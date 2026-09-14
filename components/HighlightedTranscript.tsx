import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type HighlightKind = 'filler' | 'upgrade';
type Segment = { text: string; highlight?: HighlightKind };

type Position = { start: number; end: number; kind: HighlightKind };

type Props = {
  transcript: string;
  fillerPositions: { start: number; end: number; word: string }[];
  upgradePositions?: { start: number; end: number; word: string }[];
};

export function HighlightedTranscript({
  transcript,
  fillerPositions,
  upgradePositions = [],
}: Props) {
  if (!transcript) {
    return <Text style={styles.empty}>No transcript yet.</Text>;
  }

  const marks: Position[] = [
    ...fillerPositions.map((p) => ({ start: p.start, end: p.end, kind: 'filler' as const })),
    ...upgradePositions.map((p) => ({ start: p.start, end: p.end, kind: 'upgrade' as const })),
  ].sort((a, b) => a.start - b.start);

  if (marks.length === 0) {
    return <Text style={styles.body}>{transcript}</Text>;
  }

  const segments: Segment[] = [];
  let cursor = 0;

  for (const pos of marks) {
    if (pos.start < cursor) continue;
    if (pos.start > cursor) {
      segments.push({ text: transcript.slice(cursor, pos.start) });
    }
    segments.push({ text: transcript.slice(pos.start, pos.end), highlight: pos.kind });
    cursor = pos.end;
  }
  if (cursor < transcript.length) {
    segments.push({ text: transcript.slice(cursor) });
  }

  return (
    <Text style={styles.body}>
      {segments.map((seg, i) =>
        seg.highlight === 'filler' ? (
          <Text key={i} style={styles.filler}>
            {seg.text}
          </Text>
        ) : seg.highlight === 'upgrade' ? (
          <Text key={i} style={styles.upgrade}>
            {seg.text}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <View style={styles.streak}>
      <Text style={styles.streakFire}>◆</Text>
      <Text style={styles.streakNum}>{streak}</Text>
      <Text style={styles.streakLabel}>day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
    color: colors.inkSoft,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    fontStyle: 'italic',
  },
  filler: {
    backgroundColor: colors.fillerHighlight,
    color: colors.coral,
    fontFamily: fonts.bodyBold,
    borderRadius: 4,
  },
  upgrade: {
    backgroundColor: colors.upgradeHighlight,
    color: colors.teal,
    fontFamily: fonts.bodyBold,
    borderRadius: 4,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(196, 120, 74, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  streakFire: {
    color: colors.copper,
    fontSize: 12,
  },
  streakNum: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.copper,
  },
  streakLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.copper,
  },
});
