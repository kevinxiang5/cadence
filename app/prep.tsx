import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/Button';
import { PROMPTS } from '@/lib/prompts';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

export default function PrepScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const active = useCadenceStore((s) => s.activePractice);
  const setNotes = useCadenceStore((s) => s.setNotes);

  const minutes = (active?.prepMinutes || 2) as 2 | 5;
  const [remaining, setRemaining] = useState(minutes * 60);
  const [notes, setLocalNotes] = useState(active?.notes ?? '');
  const [finished, setFinished] = useState(false);

  const promptText = active?.promptText ?? 'Prepare your answer';
  const hints = useMemo(() => {
    const found = PROMPTS.find((p) => p.id === active?.promptId);
    return (
      found?.hints ?? [
        'Outline 3 beats',
        'Pick one vivid detail',
        'Decide your closing line',
      ]
    );
  }, [active?.promptId]);

  const goRecord = () => {
    if (finished) return;
    setFinished(true);
    setNotes(notes);
    router.replace('/record');
  };

  useEffect(() => {
    if (remaining <= 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      goRecord();
      return;
    }
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const mm = Math.floor(remaining / 60);
  const ss = (remaining % 60).toString().padStart(2, '0');
  const progress = 1 - remaining / (minutes * 60);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.headerLabel}>Prep · {minutes} min</Text>
        <Pressable onPress={goRecord} hitSlop={12}>
          <Text style={styles.skip}>Skip →</Text>
        </Pressable>
      </View>

      <View style={styles.timerWrap}>
        <View style={styles.ring}>
          <View style={[styles.ringFill, { opacity: 0.15 + progress * 0.5 }]} />
          <Text style={styles.timer}>
            {mm}:{ss}
          </Text>
        </View>
        <Text style={styles.timerHint}>Scratch notes. Then speak.</Text>
      </View>

      <Text style={styles.prompt} numberOfLines={3}>
        {promptText}
      </Text>

      <View style={styles.hints}>
        {hints.slice(0, 3).map((h, i) => (
          <Text key={i} style={styles.hint}>
            · {h}
          </Text>
        ))}
      </View>

      <TextInput
        style={styles.notes}
        multiline
        placeholder="Bullet your beats here…"
        placeholderTextColor={colors.mutedLight}
        value={notes}
        onChangeText={setLocalNotes}
        textAlignVertical="top"
      />

      <Button label="I'm ready — record" onPress={goRecord} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.parchment,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  back: { fontFamily: fonts.bodyMedium, color: colors.muted, fontSize: 15 },
  skip: { fontFamily: fonts.bodyMedium, color: colors.teal, fontSize: 15 },
  headerLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  timerWrap: { alignItems: 'center', marginBottom: 24 },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  ringFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.tealGlow,
  },
  timer: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    color: colors.teal,
  },
  timerHint: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
  },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
    marginBottom: 14,
  },
  hints: { marginBottom: 14, gap: 4 },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.tealMid,
    lineHeight: 20,
  },
  notes: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
    marginBottom: 16,
    minHeight: 120,
  },
});
