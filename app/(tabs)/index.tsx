import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PressScale } from '@/components/PressScale';
import { StreakBadge } from '@/components/HighlightedTranscript';
import { TourAnchor, TourScrollView } from '@/components/TourGuide';
import { localTodayKey } from '@/lib/dates';
import { GOAL_LABELS, getPromptById, getTodaysPrompt } from '@/lib/prompts';
import { colors, fonts, layout, radii } from '@/lib/theme';
import { getDailyChallenge } from '@/lib/warmups';
import { useCadenceStore } from '@/store/useCadenceStore';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useCadenceStore((s) => s.profile);
  const streak = useCadenceStore((s) => s.streak);
  const xp = useCadenceStore((s) => s.xp);
  const lastPracticeDate = useCadenceStore((s) => s.lastPracticeDate);
  const sessions = useCadenceStore((s) => s.sessions);
  const startPractice = useCadenceStore((s) => s.startPractice);
  const completeTourStep = useCadenceStore((s) => s.completeTourStep);
  const tourComplete = useCadenceStore((s) => s.tourComplete);
  const toggleFavorite = useCadenceStore((s) => s.toggleFavorite);
  const favoritePromptIds = useCadenceStore((s) => s.favoritePromptIds) ?? [];
  const customPrompts = useCadenceStore((s) => s.customPrompts) ?? [];
  const [showHints, setShowHints] = useState(false);

  const prompt = useMemo(() => getTodaysPrompt(profile.goal), [profile.goal]);
  const catalogHints = useMemo(
    () => getPromptById(prompt.id, customPrompts)?.hints ?? [],
    [prompt.id, customPrompts]
  );
  const challenge = useMemo(() => getDailyChallenge(), []);
  const practicedToday = lastPracticeDate === localTodayKey();
  const last = sessions[0];
  const starred = favoritePromptIds.includes(prompt.id);

  const begin = (
    prepMinutes: 0 | 2,
    override?: { promptId: string; promptText: string; category?: typeof prompt.category }
  ) => {
    startPractice({
      promptId: override?.promptId ?? prompt.id,
      promptText: override?.promptText ?? prompt.text,
      category: override?.category ?? prompt.category,
      prepMinutes,
    });
    completeTourStep('today-speak');
    if (prepMinutes === 0) {
      router.push('/record');
    } else {
      router.push('/prep');
    }
  };

  return (
    <LinearGradient colors={[colors.parchment, colors.parchmentDeep]} style={styles.root}>
      <TourScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + layout.tabClearance },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <StreakBadge streak={streak} />
          <Text style={styles.brand}>speac</Text>
        </View>

        <Text style={styles.todayLead}>
          {practicedToday ? 'Done for today — go again anytime.' : 'Two minutes. Out loud.'}
        </Text>

        {last && tourComplete ? (
          <PressScale
            onPress={() =>
              begin(0, {
                promptId: last.promptId,
                promptText: last.promptText,
                category: last.category,
              })
            }
            style={styles.recap}
          >
            <Text style={styles.recapKicker}>Last take</Text>
            <View style={styles.recapRow}>
              <Text style={styles.recapScore}>{last.analysis.scores.overall}</Text>
              <Text style={styles.recapMeta}>
                {last.analysis.wpm} WPM · {last.analysis.fillerCount} fillers · {xp} XP
              </Text>
            </View>
          </PressScale>
        ) : null}

        <TourAnchor id="today-prompt">
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.category}>
              {sessions.length === 0 ? 'Your first prompt' : GOAL_LABELS[prompt.category]}
            </Text>
            <PressScale onPress={() => toggleFavorite(prompt.id)}>
              <Text style={[styles.star, starred && styles.starOn]}>{starred ? '★' : '☆'}</Text>
            </PressScale>
          </View>
          <Text style={styles.prompt}>{prompt.text}</Text>
          {tourComplete && catalogHints.length > 0 ? (
            <PressScale onPress={() => setShowHints((s) => !s)}>
              <Text style={styles.hintToggle}>{showHints ? 'Hide beats' : 'Show 3 beats'}</Text>
            </PressScale>
          ) : null}
          {tourComplete && showHints
            ? catalogHints.slice(0, 3).map((h) => (
                <Text key={h} style={styles.hintLine}>
                  · {h}
                </Text>
              ))
            : null}
        </View>
        </TourAnchor>

        <View style={styles.actions}>
          <TourAnchor id="today-speak">
            <Button label={practicedToday && tourComplete ? 'Go again' : 'Speak now'} onPress={() => begin(0)} />
          </TourAnchor>
          {tourComplete ? (
            <Button label="Prep 2 min" variant="secondary" onPress={() => begin(2)} />
          ) : null}
        </View>

        {tourComplete ? (
          <>
            <Text style={styles.moreLabel}>Challenge</Text>

            <PressScale
              onPress={() =>
                begin(0, {
                  promptId: challenge.id,
                  promptText: challenge.promptText,
                  category: challenge.category,
                })
              }
              style={styles.challenge}
            >
              <Text style={styles.category}>Daily challenge</Text>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.drillBody}>{challenge.body}</Text>
            </PressScale>
          </>
        ) : null}
      </TourScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: layout.screenPad, gap: layout.stackGap },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayLead: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginTop: -4,
  },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.teal,
    letterSpacing: -0.6,
  },
  recap: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: layout.cardPad,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recapKicker: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.copper,
    marginBottom: 6,
  },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recapScore: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.teal,
  },
  recapMeta: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: layout.cardPad,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  category: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 8,
  },
  star: { fontSize: 22, color: colors.mutedLight, marginTop: -4 },
  starOn: { color: colors.copper },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
  },
  hintToggle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.tealMid,
    marginTop: 12,
  },
  hintLine: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.tealMid,
    lineHeight: 20,
    marginTop: 6,
  },
  moreLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 8,
  },
  actions: { gap: 12 },
  doneTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.success,
    marginBottom: 6,
  },
  doneBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  challenge: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: layout.cardPad,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  challengeTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 4,
  },
  word: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.ink,
    marginBottom: 4,
  },
  wordMeaning: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 14,
  },
  warmup: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: layout.cardPad,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  drillTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.ink,
    marginBottom: 6,
  },
  drillBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
});
