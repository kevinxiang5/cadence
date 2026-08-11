import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card, ScorePill, SectionLabel } from '@/components/Card';
import { HighlightedTranscript } from '@/components/HighlightedTranscript';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const analysis = useCadenceStore((s) => s.lastAnalysis);
  const transcript = useCadenceStore((s) => s.lastTranscript);
  const active = useCadenceStore((s) => s.activePractice);
  const lastPrompt = useCadenceStore((s) => s.lastPrompt);
  const saveSession = useCadenceStore((s) => s.saveSession);
  const startPractice = useCadenceStore((s) => s.startPractice);

  const paceNote = useMemo(() => {
    if (!analysis) return '';
    if (analysis.wpm < 110) return 'A bit slow — add energy without rushing.';
    if (analysis.wpm > 170) return 'Fast — breathe between sentences.';
    return 'Pace is in a strong conversational range.';
  }, [analysis]);

  if (!analysis) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.missing}>No results yet.</Text>
        <Button label="Back to Today" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  const save = () => {
    saveSession();
    router.replace('/(tabs)/stats');
  };

  const fillerRate = Math.round(
    (analysis.fillerCount / Math.max(analysis.wordCount, 1)) * 100
  );

  const retry = () => {
    const src = active ?? lastPrompt;
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

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>Coaching</Text>
        <Text style={styles.title}>Here’s your upgrade</Text>
        <Text style={styles.xp}>+{analysis.xpEarned} XP</Text>

        <View style={styles.scoreRow}>
          <ScorePill label="WPM" value={analysis.wpm} />
          <ScorePill label="Fillers" value={analysis.fillerCount} invert />
          <ScorePill label="Overall" value={analysis.scores.overall} />
        </View>

        <Text style={styles.paceNote}>{paceNote}</Text>

        <View style={styles.scoreRow}>
          <ScorePill label="Clarity" value={analysis.scores.clarity} />
          <ScorePill label="Confidence" value={analysis.scores.confidence} />
          <ScorePill label="Delivery" value={analysis.scores.delivery} />
        </View>

        <View style={styles.scoreRow}>
          <ScorePill label="Persuade" value={analysis.scores.persuasiveness} />
          <ScorePill label="Story" value={analysis.scores.storytelling} />
          <ScorePill label="Pauses~" value={analysis.pauseEstimate} invert />
        </View>

        <View style={styles.metaStrip}>
          <Text style={styles.metaItem}>{analysis.wordCount} words</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>{analysis.durationSec}s</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>
            {analysis.fillerCount === 0 ? 'Clean take' : `${fillerRate}% filler rate`}
          </Text>
        </View>

        <Card style={{ marginTop: 8, marginBottom: 16 }}>
          <SectionLabel>Coaching card</SectionLabel>
          <View style={styles.coachBlock}>
            <Text style={styles.coachLabel}>Strength</Text>
            <Text style={styles.coachText}>{analysis.coaching.strength}</Text>
          </View>
          <View style={styles.coachBlock}>
            <Text style={[styles.coachLabel, { color: colors.copper }]}>Fix</Text>
            <Text style={styles.coachText}>{analysis.coaching.fix}</Text>
          </View>
          <View style={[styles.coachBlock, { marginBottom: 0 }]}>
            <Text style={[styles.coachLabel, { color: colors.tealLight }]}>Rewrite tip</Text>
            <Text style={styles.coachText}>{analysis.coaching.rewriteTip}</Text>
          </View>
        </Card>

        {analysis.vocabUpgrades.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Vocabulary upgrades</SectionLabel>
            {analysis.vocabUpgrades.map((u) => (
              <View key={u.original} style={styles.upgradeRow}>
                <Text style={styles.weak}>{u.original}</Text>
                <Text style={styles.arrow}>→</Text>
                <Text style={styles.strong}>{u.suggestion}</Text>
                {u.count > 1 ? <Text style={styles.count}>×{u.count}</Text> : null}
              </View>
            ))}
          </Card>
        )}

        {analysis.fillersFound.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Filler words</SectionLabel>
            <View style={styles.fillerChips}>
              {analysis.fillersFound.map((f) => (
                <View key={f.word} style={styles.fillerChip}>
                  <Text style={styles.fillerWord}>{f.word}</Text>
                  <Text style={styles.fillerCount}>{f.count}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {analysis.repeatedWords.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Repeated words</SectionLabel>
            {analysis.repeatedWords.map((r) => (
              <Text key={r.word} style={styles.repeat}>
                “{r.word}” · {r.count}×
              </Text>
            ))}
          </Card>
        )}

        <Card style={{ marginBottom: 20 }}>
          <SectionLabel>Transcript</SectionLabel>
          <HighlightedTranscript
            transcript={transcript}
            fillerPositions={analysis.fillerPositions}
          />
        </Card>

        <View style={styles.actions}>
          <Button label="Save session + streak" onPress={save} />
          <Button
            label="Retry this prompt"
            variant="secondary"
            onPress={retry}
            disabled={!active && !lastPrompt}
          />
          <Button label="Done for now" variant="ghost" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScrollView>
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
    fontSize: 32,
    color: colors.ink,
    marginBottom: 4,
  },
  xp: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.copper,
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  paceNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 18,
  },
  metaStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  metaItem: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.tealMid,
  },
  metaDot: { color: colors.mutedLight },
  coachBlock: { marginBottom: 14 },
  coachLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.success,
    marginBottom: 4,
  },
  coachText: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkSoft,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  weak: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.coral,
    backgroundColor: colors.fillerHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  arrow: { color: colors.muted, fontFamily: fonts.body },
  strong: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.teal,
    backgroundColor: colors.upgradeHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 1,
  },
  count: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
    marginLeft: 'auto',
  },
  fillerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fillerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.fillerHighlight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  fillerWord: { fontFamily: fonts.bodyBold, color: colors.coral, fontSize: 14 },
  fillerCount: { fontFamily: fonts.bodyMedium, color: colors.inkSoft, fontSize: 13 },
  repeat: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  actions: { gap: 10 },
});
