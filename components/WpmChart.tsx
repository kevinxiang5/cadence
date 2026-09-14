import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { paceSummary, type PacePoint } from '@/lib/pace';
import { colors, fonts, radii } from '@/lib/theme';

const IDEAL_LO = 120;
const IDEAL_HI = 160;
const CHART_H = 148;
const PAD_L = 28;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 22;

type Props = {
  points: PacePoint[];
  overallWpm: number;
};

export function WpmChart({ points, overallWpm }: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const summary = useMemo(() => paceSummary(points), [points]);
  const maxWpm = Math.max(180, overallWpm + 20, summary.peak + 20, IDEAL_HI + 20);

  const plotW = Math.max(0, width - PAD_L - PAD_R);
  const plotH = CHART_H - PAD_T - PAD_B;
  const lastT = points[points.length - 1]?.t || 1;

  const toXY = (p: PacePoint) => ({
    x: PAD_L + (p.t / lastT) * plotW,
    y: PAD_T + (1 - p.wpm / maxWpm) * plotH,
  });

  const coords = width > 0 ? points.map(toXY) : [];
  const idealTop = PAD_T + (1 - IDEAL_HI / maxWpm) * plotH;
  const idealBot = PAD_T + (1 - IDEAL_LO / maxWpm) * plotH;

  const yTicks = [0, 80, 160].filter((v) => v <= maxWpm);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View>
          <Text style={styles.kicker}>Pace</Text>
          <Text style={styles.title}>WPM over time</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.big}>{overallWpm}</Text>
          <Text style={styles.bigLabel}>avg WPM</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>Peak {summary.peak || '—'}</Text>
        <Text style={styles.meta}>Finish {summary.end || '—'}</Text>
        <Text style={styles.meta}>Ideal 120–160</Text>
      </View>

      <View style={styles.chart} onLayout={onLayout}>
        {width > 0 ? (
          <>
            <View
              style={[
                styles.ideal,
                {
                  top: idealTop,
                  height: Math.max(4, idealBot - idealTop),
                  left: PAD_L,
                  right: PAD_R,
                },
              ]}
            />
            {yTicks.map((v) => {
              const y = PAD_T + (1 - v / maxWpm) * plotH;
              return (
                <View key={v} style={[styles.grid, { top: y, left: PAD_L, right: PAD_R }]}>
                  <Text style={[styles.yLabel, { top: -8, left: -PAD_L }]}>{v}</Text>
                </View>
              );
            })}
            {coords.slice(1).map((pt, i) => {
              const prev = coords[i];
              if (!prev) return null;
              return <Segment key={`s-${i}`} x1={prev.x} y1={prev.y} x2={pt.x} y2={pt.y} />;
            })}
            {coords.map((pt, i) => (
              <View
                key={`d-${i}`}
                style={[
                  styles.dot,
                  i === coords.length - 1 && styles.dotEnd,
                  { left: pt.x - 3, top: pt.y - 3 },
                ]}
              />
            ))}
            <Text style={[styles.xLabel, { left: PAD_L, bottom: 2 }]}>0s</Text>
            <Text style={[styles.xLabel, { right: PAD_R, bottom: 2, textAlign: 'right' }]}>
              {lastT}s
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

function Segment({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const angle = Math.atan2(dy, dx);
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x1,
        top: y1,
        width: len,
        height: 2.5,
        backgroundColor: colors.teal,
        borderRadius: 2,
        transform: [{ rotate: `${angle}rad` }],
        transformOrigin: 'left center',
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  kicker: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  stats: { alignItems: 'flex-end' },
  big: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.teal,
    lineHeight: 32,
  },
  bigLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.muted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
  },
  chart: {
    height: CHART_H,
    position: 'relative',
  },
  ideal: {
    position: 'absolute',
    backgroundColor: 'rgba(14, 77, 74, 0.08)',
    borderRadius: 4,
  },
  grid: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.cardBorder,
  },
  yLabel: {
    position: 'absolute',
    width: 24,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.mutedLight,
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.mutedLight,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tealMid,
  },
  dotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.copper,
  },
});
