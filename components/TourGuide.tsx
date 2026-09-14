import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
  Dimensions,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOUR_STEPS, tourScreenFromSegments, tourStepAt, type TourScreen } from '@/lib/tour';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

function screenFromSegments(segments: string[]): TourScreen {
  return tourScreenFromSegments(segments);
}

export type AnchorRect = { x: number; y: number; width: number; height: number };

type TourContextValue = {
  register: (id: string, rect: AnchorRect | null) => void;
  registerScroll: (ref: RefObject<ScrollView | null> | null) => void;
  activeTargetId: string | null;
  getScroll: () => ScrollView | null;
};

const TourContext = createContext<TourContextValue | null>(null);

function scrollAnchorIntoView(anchor: View, scroll: ScrollView | null) {
  if (!scroll) return;
  const inner =
    (scroll as unknown as { getInnerViewNode?: () => number }).getInnerViewNode?.() ??
    findNodeHandle(scroll);
  if (inner == null) {
    scroll.scrollToEnd({ animated: true });
    return;
  }
  anchor.measureLayout(
    inner as number,
    (_x, y) => {
      scroll.scrollTo({ y: Math.max(0, y - 72), animated: true });
    },
    () => {
      scroll.scrollToEnd({ animated: true });
    }
  );
}

export function TourScrollView(props: ScrollViewProps) {
  const ctx = useContext(TourContext);
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    ctx?.registerScroll(ref);
    return () => ctx?.registerScroll(null);
  }, [ctx]);

  return <ScrollView ref={ref} keyboardShouldPersistTaps="handled" {...props} />;
}

export function TourAnchor({
  id,
  children,
  style,
}: {
  id: string;
  children: ReactNode;
  style?: object;
}) {
  const ctx = useContext(TourContext);
  const ref = useRef<View>(null);
  const isActive = ctx?.activeTargetId === id;

  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width < 2 || height < 2) {
        ctx?.register(id, null);
        return;
      }
      ctx?.register(id, { x, y, width, height });
    });
  }, [ctx, id]);

  useEffect(() => {
    const bringIn = () => {
      measure();
      if (!isActive || !ref.current) return;
      const win = Dimensions.get('window');
      ref.current.measureInWindow((_x, y, _w, h) => {
        const off = y + h < 100 || y > win.height - 120;
        if (off) scrollAnchorIntoView(ref.current!, ctx?.getScroll() ?? null);
      });
    };
    const t1 = setTimeout(bringIn, 40);
    const t2 = setTimeout(bringIn, 220);
    const t3 = setTimeout(bringIn, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      ctx?.register(id, null);
    };
  }, [ctx, id, isActive, measure]);

  return (
    <View ref={ref} collapsable={false} onLayout={measure} style={style}>
      {children}
    </View>
  );
}

export function TourProvider({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const screen = screenFromSegments(segments as string[]);
  const [rects, setRects] = useState<Record<string, AnchorRect>>({});
  const scrollHolder = useRef<RefObject<ScrollView | null> | null>(null);
  const tourStep = useCadenceStore((s) => s.tourStep);
  const tourComplete = useCadenceStore((s) => s.tourComplete);
  const activeTargetId = !tourComplete ? (tourStepAt(tourStep)?.targetId ?? null) : null;

  const register = useCallback((id: string, rect: AnchorRect | null) => {
    setRects((prev) => {
      if (!rect) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      const old = prev[id];
      if (
        old &&
        Math.abs(old.x - rect.x) < 1 &&
        Math.abs(old.y - rect.y) < 1 &&
        Math.abs(old.width - rect.width) < 1 &&
        Math.abs(old.height - rect.height) < 1
      ) {
        return prev;
      }
      return { ...prev, [id]: rect };
    });
  }, []);

  const registerScroll = useCallback((ref: RefObject<ScrollView | null> | null) => {
    scrollHolder.current = ref;
  }, []);

  const getScroll = useCallback(() => scrollHolder.current?.current ?? null, []);

  const value = useMemo(
    () => ({ register, registerScroll, activeTargetId, getScroll }),
    [register, registerScroll, activeTargetId, getScroll]
  );

  return (
    <TourContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <TourOverlay screen={screen} rects={rects} />
      </View>
    </TourContext.Provider>
  );
}

function TourOverlay({
  screen,
  rects,
}: {
  screen: TourScreen;
  rects: Record<string, AnchorRect>;
}) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const router = useRouter();
  const tourComplete = useCadenceStore((s) => s.tourComplete);
  const tourStep = useCadenceStore((s) => s.tourStep);
  const tourQuiet = useCadenceStore((s) => s.tourQuiet);
  const tourPendingScreen = useCadenceStore((s) => s.tourPendingScreen);
  const advanceTour = useCadenceStore((s) => s.advanceTour);
  const alignTourToScreen = useCadenceStore((s) => s.alignTourToScreen);
  const [tipH, setTipH] = useState(196);

  const step = tourStepAt(tourStep);

  useEffect(() => {
    if (tourComplete) return;
    alignTourToScreen(screen);
  }, [alignTourToScreen, screen, tourComplete, tourStep]);

  useEffect(() => {
    if (tourComplete || !tourPendingScreen) return;
    if (screen === tourPendingScreen) return;
    const t = setTimeout(() => {
      useCadenceStore.getState().alignTourToScreen(screen);
    }, 1400);
    return () => clearTimeout(t);
  }, [screen, tourPendingScreen, tourComplete]);

  if (tourComplete || !step) return null;
  if (tourQuiet) return null;

  const onRightScreen = step.screen === screen || step.screen === 'any';
  if (!onRightScreen) return null;

  const onDim = () => {};

  const hole = step.targetId ? rects[step.targetId] : null;
  const pad = step.circle ? 10 : 8;
  const holeRaw = hole
    ? {
        x: hole.x - pad,
        y: hole.y - pad,
        width: hole.width + pad * 2,
        height: hole.height + pad * 2,
      }
    : null;
  const holeOnScreen =
    holeRaw &&
    holeRaw.y + holeRaw.height > insets.top + 8 &&
    holeRaw.y < winH - Math.max(insets.bottom, 12) - 8;
  const holeRect = holeOnScreen ? holeRaw : null;

  const tooltipWidth = Math.min(320, winW - 40);
  let tipTop = insets.top + 72;
  let tipLeft = (winW - tooltipWidth) / 2;

  if (holeRect) {
    const below = holeRect.y + holeRect.height + 14;
    const above = holeRect.y - 14 - tipH;
    const spaceBelow = winH - insets.bottom - below;
    const placeBelow = spaceBelow >= tipH - 8;
    tipTop = placeBelow
      ? Math.min(below, winH - insets.bottom - tipH - 12)
      : Math.max(insets.top + 12, above);
    tipLeft = Math.min(Math.max(20, holeRect.x), winW - 20 - tooltipWidth);
  } else {
    tipTop = Math.max(insets.top + 24, (winH - tipH) / 3);
  }

  const holeRadius = step.circle && holeRect ? holeRect.width / 2 : radii.md;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {holeRect ? (
        <>
          <Pressable
            style={[styles.dim, { top: 0, left: 0, right: 0, height: Math.max(0, holeRect.y) }]}
            onPress={onDim}
          />
          <Pressable
            style={[styles.dim, { top: holeRect.y + holeRect.height, left: 0, right: 0, bottom: 0 }]}
            onPress={onDim}
          />
          <Pressable
            style={[
              styles.dim,
              { top: holeRect.y, left: 0, width: Math.max(0, holeRect.x), height: holeRect.height },
            ]}
            onPress={onDim}
          />
          <Pressable
            style={[
              styles.dim,
              {
                top: holeRect.y,
                left: holeRect.x + holeRect.width,
                right: 0,
                height: holeRect.height,
              },
            ]}
            onPress={onDim}
          />
          <View
            pointerEvents="none"
            style={[
              styles.holeRing,
              {
                top: holeRect.y,
                left: holeRect.x,
                width: holeRect.width,
                height: holeRect.height,
                borderRadius: holeRadius,
              },
            ]}
          />
        </>
      ) : (
        <View
          pointerEvents={step.lock ? 'none' : 'auto'}
          style={[styles.dim, StyleSheet.absoluteFill]}
        >
          {step.lock ? null : <Pressable style={StyleSheet.absoluteFill} onPress={onDim} />}
        </View>
      )}

      <View
        pointerEvents="box-none"
        style={[styles.tipWrap, { top: tipTop, left: tipLeft, width: tooltipWidth }]}
      >
        <View
          style={styles.tip}
          onLayout={(e) => {
            const h = Math.ceil(e.nativeEvent.layout.height);
            if (h > 80 && Math.abs(h - tipH) > 4) setTipH(h);
          }}
        >
          <Text style={styles.stepCount}>
            {tourStep + 1} of {TOUR_STEPS.length}
          </Text>
          <Text style={styles.tipTitle}>{step.title}</Text>
          <Text style={styles.tipBody}>{step.body}</Text>
          <View style={styles.tipRow}>
            {step.lock ? (
              <Text style={styles.lockHint}>{holeRect ? 'Tap here' : 'Tap below'}</Text>
            ) : (
              <>
                <View />
                <Pressable
                  onPress={() => {
                    const last = step.id === 'wrap-up';
                    advanceTour();
                    if (last) router.replace('/(tabs)');
                  }}
                  style={styles.nextBtn}
                >
                  <Text style={styles.nextText}>{step.cta}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
  },
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(20, 36, 36, 0.58)',
  },
  holeRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.copper,
  },
  tipWrap: {
    position: 'absolute',
  },
  tip: {
    width: '100%',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.ink,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  stepCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.copper,
    marginBottom: 6,
  },
  tipTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 4,
  },
  tipBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  skip: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.muted,
  },
  lockHint: {
    flexShrink: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.copper,
    textAlign: 'right',
  },
  nextBtn: {
    backgroundColor: colors.teal,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  nextText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.cream,
  },
});
