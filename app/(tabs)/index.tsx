import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StreakBadge } from '@/components/HighlightedTranscript';
import { GOAL_LABELS, getTodaysPrompt } from '@/lib/prompts';
import { localTodayKey } from '@/lib/dates';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useCadenceStore((s) => s.profile);
  const streak = useCadenceStore((s) => s.streak);
  const xp = useCadenceStore((s) => s.xp);
  const lastPracticeDate = useCadenceStore((s) => s.lastPracticeDate);
  const startPractice = useCadenceStore((s) => s.startPractice);

  const prompt = useMemo(() => getTodaysPrompt(profile.goal), [profile.goal]);
  const practicedToday = lastPracticeDate === localTodayKey();

  const begin = (prepMinutes: 0 | 2 | 5) => {
    startPractice({
      promptId: prompt.id,
      promptText: prompt.text,
      category: prompt.category,
      prepMinutes,
    });
    if (prepMinutes === 0) {
      router.push('/record');
    } else {
      router.push('/prep');
    }
  };

  return (
    <LinearGradient colors={[colors.parchment, '#EDE6D8']} style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>
              {practicedToday ? 'Nice work today,' : 'Ready when you are,'}
            </Text>
            <Text style={styles.name}>{profile.name || 'Speaker'}</Text>
          </View>
          <StreakBadge streak={streak} />
        </View>

        <Text style={styles.brand}>Cadence</Text>
        <Text style={styles.oneLiner}>Your 2-minute speaking rep.</Text>

        <View style={styles.promptBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{GOAL_LABELS[prompt.category]}</Text>
            <Text style={styles.xp}>{xp} XP</Text>
          </View>
          <Text style={styles.prompt}>{prompt.text}</Text>
        </View>

        {practicedToday ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneTitle}>Today’s rep is in.</Text>
            <Text style={styles.doneBody}>
              Come back tomorrow — or open the Library for an extra round.
            </Text>
            <Button
              label="Practice another prompt"
              variant="secondary"
              onPress={() => router.push('/(tabs)/library')}
              style={{ marginTop: 14 }}
            />
            <Button
              label="Speak this prompt again"
              variant="ghost"
              onPress={() => begin(0)}
              style={{ marginTop: 4 }}
            />
            <Button
              label="See your stats"
              variant="ghost"
              onPress={() => router.push('/(tabs)/stats')}
              style={{ marginTop: 4 }}
            />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button label="Speak now" onPress={() => begin(0)} />
            <Button label="Prep for 2 minutes" variant="secondary" onPress={() => begin(2)} />
            <Button label="Prep for 5 minutes" variant="ghost" onPress={() => begin(5)} />
          </View>
        )}

        <Text style={styles.footerHint}>
          Open → speak → one clear upgrade. That’s the whole ritual.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  greeting: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.inkSoft,
    marginTop: 2,
  },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 48,
    color: colors.teal,
    letterSpacing: -1.2,
    marginBottom: 6,
  },
  oneLiner: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.muted,
    marginBottom: 36,
  },
  promptBlock: {
    marginBottom: 36,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  category: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.tealLight,
  },
  xp: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.copper,
  },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 36,
    color: colors.ink,
  },
  actions: { gap: 12 },
  doneCard: {
    backgroundColor: colors.successSoft,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 106, 79, 0.15)',
  },
  doneTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.success,
    marginBottom: 6,
  },
  doneBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  footerHint: {
    marginTop: 'auto',
    paddingTop: 40,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mutedLight,
    textAlign: 'center',
  },
});
