import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { HighlightedTranscript } from '@/components/HighlightedTranscript';
import { TourAnchor, TourScrollView } from '@/components/TourGuide';
import { WpmChart } from '@/components/WpmChart';
import { findUpgradePositions } from '@/lib/analysis';
import { synthesizePace } from '@/lib/pace';
import { getBadges, newlyEarnedBadges } from '@/lib/badges';
import { compareTakes } from '@/lib/stats';
import { tourStepAt } from '@/lib/tour';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

const SKILLS: { key: 'delivery' | 'clarity' | 'confidence' | 'persuasiveness' | 'storytelling'; label: string }[] =
  [
    { key: 'delivery', label: 'Delivery' },
    { key: 'clarity', label: 'Clarity' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'persuasiveness', label: 'Persuade' },
    { key: 'storytelling', label: 'Story' },
  ];

function signed(n: number) {
  if (n === 0) return 'same';
  return n > 0 ? `+${n}` : `${n}`;
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const analysis = useCadenceStore((s) => s.lastAnalysis);
  const transcript = useCadenceStore((s) => s.lastTranscript);
  const active = useCadenceStore((s) => s.activePractice);
  const lastPrompt = useCadenceStore((s) => s.lastPrompt);
  const sessions = useCadenceStore((s) => s.sessions);
  const streak = useCadenceStore((s) => s.streak);
  const longestStreak = useCadenceStore((s) => s.longestStreak);
  const xp = useCadenceStore((s) => s.xp);
  const saveSession = useCadenceStore((s) => s.saveSession);
  const resultSaved = useCadenceStore((s) => s.resultSaved);
  const tourComplete = useCadenceStore((s) => s.tourComplete);
  const tourStep = useCadenceStore((s) => s.tourStep);
  const completeTourStep = useCadenceStore((s) => s.completeTourStep);
  const startPractice = useCadenceStore((s) => s.startPractice);
  const fluencyChain = useCadenceStore((s) => s.fluencyChain);
  const advanceFluencyChain = useCadenceStore((s) => s.advanceFluencyChain);
  const clearFluencyChain = useCadenceStore((s) => s.clearFluencyChain);

  const src = active ?? lastPrompt;
  const previous = sessions[0];
  const bestOverall = Math.max(0, ...sessions.map((s) => s.analysis.scores.overall));

  const paceNote = useMemo(() => {
    if (!analysis) return '';
    if (analysis.wpm < 110) return 'A bit slow — add energy.';
    if (analysis.wpm > 170) return 'Fast — breathe between sentences.';
    return 'Pace is in a good range.';
  }, [analysis]);

  const upgradePositions = useMemo(() => {
    if (!analysis) return [];
    return findUpgradePositions(transcript, analysis.vocabUpgrades, analysis.fillerPositions);
  }, [analysis, transcript]);

  const sharper = analysis?.cleanTranscript && analysis.cleanTranscript !== transcript
    ? analysis.cleanTranscript
    : '';

  const unlocked = useMemo(() => {
    if (!analysis) return [];
    const input = { sessions, streak, longestStreak, xp };
    const before = getBadges(input);
    const after = getBadges({
      ...input,
      pending: { analysis, category: src?.category ?? 'daily' },
    });
    return newlyEarnedBadges(before, after);
  }, [analysis, sessions, streak, longestStreak, xp, src?.category]);

  if (!analysis) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.missing}>No results yet.</Text>
        <Button label="Back to Today" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  const delta = compareTakes(analysis, previous?.analysis, bestOverall);
  const persist = () => {
    if (!resultSaved) saveSession();
  };

  const save = () => {
    persist();
    if (!tourComplete) {
      completeTourStep('results-save');
    }
    router.replace('/(tabs)/stats');
  };

  const done = () => {
    persist();
    clearFluencyChain();
    if (!tourComplete) {
      completeTourStep('results-save');
      router.replace('/(tabs)/stats');
      return;
    }
    router.replace('/(tabs)');
  };

  const retry = () => {
    clearFluencyChain();
    if (src) {
      startPractice({
        promptId: src.promptId,
        promptText: src.promptText,
        category: src.category,
        prepMinutes: 0,
      });
    }
    router.replace('/record');
  };

  const nextFluencyRound = () => {
    persist();
    if (advanceFluencyChain()) {
      router.replace('/record');
    }
  };

  const retryWithSwaps = () => {
    const clean = analysis.cleanTranscript;
    if (clean && clean !== transcript) {
      startPractice({
        promptId: `${src?.promptId ?? 'retry'}-clean`,
        promptText: `Say this cleaner version out loud. Same idea — no fillers:\n\n${clean}`,
        category: src?.category ?? 'daily',
        prepMinutes: 0,
      });
      router.replace('/record');
      return;
    }
    const swaps = analysis.vocabUpgrades.slice(0, 4);
    const avoid = swaps.map((u) => `“${u.original}”`).join(', ');
    const use = swaps.map((u) => `“${u.suggestion}”`).join(', ');
    const original = src?.promptText ?? 'Say the same idea again, cleaner.';
    startPractice({
      promptId: `${src?.promptId ?? 'retry'}-swaps`,
      promptText: `${original}\n\nSame idea, sharper words. Do not say ${avoid}. Use ${use} where they fit.`,
      category: src?.category ?? 'daily',
      prepMinutes: 0,
    });
    router.replace('/record');
  };

  const topFiller = analysis.fillersFound[0];
  const swaps = analysis.vocabUpgrades;
  const nextSecs =
    fluencyChain && fluencyChain.round < fluencyChain.durations.length - 1
      ? fluencyChain.durations[fluencyChain.round + 1]
      : null;
  const fluencyLabel =
    fluencyChain != null
      ? `Round ${fluencyChain.round + 1} of ${fluencyChain.durations.length}`
      : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <TourScrollView
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 28, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.kicker}>Coaching</Text>
          <Text style={styles.title}>Your take</Text>
          <Text style={styles.xp}>+{analysis.xpEarned} XP{fluencyLabel ? ` · ${fluencyLabel}` : ''}</Text>
        </View>

        <TourAnchor id="results-score">
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Overall</Text>
          <Text style={styles.heroScore}>{analysis.scores.overall}</Text>
          <Text style={styles.paceNote}>{paceNote}</Text>
          {delta?.personalBest ? <Text style={styles.pb}>Personal best</Text> : null}
        </View>
        </TourAnchor>

        <WpmChart
          points={
            analysis.paceSeries?.length
              ? analysis.paceSeries
              : synthesizePace(analysis.wordCount, analysis.durationSec)
          }
          overallWpm={analysis.wpm}
        />

        {previous ? (
          <View style={styles.deltaRow}>
            <DeltaCell label="Score" value={signed(delta?.overall ?? 0)} good={(delta?.overall ?? 0) >= 0} />
            <DeltaCell
              label="WPM"
              value={signed(delta?.wpm ?? 0)}
              good={Math.abs(delta?.wpm ?? 0) <= 15 || analysis.wpm <= 160}
            />
            <DeltaCell label="Fillers" value={signed(delta?.fillers ?? 0)} good={(delta?.fillers ?? 0) >= 0} />
          </View>
        ) : (
          <Text style={styles.firstTake}>Save to start your streak.</Text>
        )}

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{analysis.wpm}</Text>
            <Text style={styles.statLabel}>WPM</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, analysis.fillerCount > 0 && { color: colors.coral }]}>
              {analysis.fillerCount}
            </Text>
            <Text style={styles.statLabel}>Fillers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{analysis.wordCount}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{analysis.sentenceCount ?? 1}</Text>
            <Text style={styles.statLabel}>Sentences</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Skills this take</Text>
          {SKILLS.map((row) => {
            const value = analysis.scores[row.key];
            const tone = value >= 80 ? colors.success : value >= 60 ? colors.tealMid : colors.copper;
            return (
              <View key={row.key} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{row.label}</Text>
                <View style={styles.skillTrack}>
                  <View style={[styles.skillFill, { width: `${value}%`, backgroundColor: tone }]} />
                </View>
                <Text style={[styles.skillValue, { color: tone }]}>{value}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>One thing to fix</Text>
          <Text style={styles.fix}>{analysis.coaching.fix}</Text>
          {topFiller ? (
            <Text style={styles.fixSub}>
              Heard “{topFiller.word}” {topFiller.count}× in this take.
              {(analysis.avgWordsPerSentence ?? 0) > 22
                ? ` Sentences averaged ${analysis.avgWordsPerSentence} words.`
                : ''}
            </Text>
          ) : (
            <Text style={styles.fixSub}>{analysis.coaching.strength}</Text>
          )}
        </View>

        {unlocked.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.section}>Badges unlocked</Text>
            {unlocked.map((b) => (
              <Text key={b.id} style={styles.badgeLine}>
                ◆ {b.title} — {b.hint}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.section}>Words to swap</Text>
          {swaps.length === 0 ? (
            <Text style={styles.emptySwaps}>
              No weak-word swaps this take. Fillers are highlighted in the transcript below.
            </Text>
          ) : (
            swaps.map((u) => (
              <View key={u.original} style={styles.swapRow}>
                <Text style={styles.swapFrom}>“{u.original}”</Text>
                <Text style={styles.swapArrow}>→</Text>
                <Text style={styles.swapTo}>“{u.suggestion}”</Text>
                {u.count > 1 ? <Text style={styles.swapCount}>×{u.count}</Text> : null}
              </View>
            ))
          )}
          {analysis.repeatedWords.length > 0 ? (
            <Text style={styles.rewriteTip}>
              Repeated: {analysis.repeatedWords.map((r) => `“${r.word}” ×${r.count}`).join(', ')}
            </Text>
          ) : null}
          <Text style={styles.rewriteTip}>{analysis.coaching.rewriteTip}</Text>
        </View>

        {sharper ? (
          <View style={styles.card}>
            <Text style={styles.section}>Cleaner take</Text>
            <Text style={styles.sharper}>{sharper}</Text>
            <Text style={styles.rewriteTip}>
              Fillers cut, sentences marked, weak words swapped. Say this version next.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.section}>What you said</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.fillerHighlight }]} />
              <Text style={styles.legendText}>Filler</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.upgradeHighlight }]} />
              <Text style={styles.legendText}>Swap</Text>
            </View>
          </View>
          <HighlightedTranscript
            transcript={transcript}
            fillerPositions={analysis.fillerPositions}
            upgradePositions={upgradePositions}
          />
        </View>

        <View style={styles.actions}>
          {tourComplete && nextSecs ? (
            <Button label={`Same talk in ${nextSecs}s`} onPress={nextFluencyRound} />
          ) : tourComplete && (sharper || swaps.length > 0) ? (
            <Button
              label={sharper ? 'Retry cleaner' : 'Retry with swaps'}
              onPress={retryWithSwaps}
            />
          ) : null}
          {tourComplete ? (
            <TourAnchor id="results-save">
              <Button
                label={resultSaved ? 'Stats' : 'Save'}
                variant={nextSecs || sharper || swaps.length > 0 ? 'secondary' : 'primary'}
                onPress={save}
              />
            </TourAnchor>
          ) : null}
          {tourComplete ? (
            <Button
              label="Retry"
              variant="secondary"
              onPress={retry}
              disabled={!src}
            />
          ) : null}
        </View>
      </TourScrollView>

      {(!tourComplete && tourStepAt(tourStep)?.id === 'results-save') || tourComplete ? (
      <View style={[styles.doneBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {!tourComplete && tourStepAt(tourStep)?.id === 'results-save' ? (
          <TourAnchor id="results-save">
            <Button
              label={resultSaved ? 'Stats' : 'Save'}
              onPress={save}
            />
          </TourAnchor>
        ) : (
          <Pressable onPress={done} style={styles.doneBar}>
            <Text style={styles.doneBarLabel}>Done</Text>
          </Pressable>
        )}
      </View>
      ) : null}
    </View>
  );
}

function DeltaCell({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <View style={styles.deltaCell}>
      <Text style={[styles.deltaValue, { color: good ? colors.success : colors.coral }]}>{value}</Text>
      <Text style={styles.deltaLabel}>{label} vs last</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  missing: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  kicker: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: colors.ink,
    marginBottom: 4,
  },
  xp: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.copper,
  },
  hero: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  heroLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  heroScore: {
    fontFamily: fonts.displayBold,
    fontSize: 56,
    color: colors.teal,
    lineHeight: 64,
  },
  paceNote: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  pb: {
    marginTop: 8,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.copper,
    letterSpacing: 0.4,
  },
  deltaRow: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 12,
  },
  deltaCell: { flex: 1, alignItems: 'center' },
  deltaValue: { fontFamily: fonts.displayBold, fontSize: 18 },
  deltaLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 2,
  },
  firstTake: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.teal,
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  section: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 8,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  skillLabel: {
    width: 88,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkSoft,
  },
  skillTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.parchmentDeep,
    overflow: 'hidden',
  },
  skillFill: { height: '100%', borderRadius: 4 },
  skillValue: {
    width: 28,
    textAlign: 'right',
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  fix: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
  },
  fixSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  badgeLine: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.teal,
    lineHeight: 22,
    marginBottom: 4,
  },
  emptySwaps: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  swapFrom: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.coral,
  },
  swapArrow: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.mutedLight,
  },
  swapTo: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.teal,
    flex: 1,
  },
  swapCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.muted,
  },
  rewriteTip: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 21,
    marginTop: 12,
  },
  sharper: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
    color: colors.inkSoft,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  actions: { gap: 10, marginTop: 4 },
  doneBarWrap: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: colors.parchment,
  },
  doneBar: {
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  doneBarLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.teal,
    letterSpacing: 0.2,
  },
});
