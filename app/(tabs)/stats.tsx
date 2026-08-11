import { format, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, SectionLabel } from '@/components/Card';
import { GOAL_LABELS } from '@/lib/prompts';
import { formatDuration, getDetailedStats } from '@/lib/stats';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore, type Session } from '@/store/useCadenceStore';

const SKILL_ROWS: { key: keyof ReturnType<typeof getDetailedStats>['skills']; label: string }[] = [
  { key: 'delivery', label: 'Delivery' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'persuasiveness', label: 'Persuasiveness' },
  { key: 'storytelling', label: 'Storytelling' },
  { key: 'overall', label: 'Overall' },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const sessions = useCadenceStore((s) => s.sessions);
  const streak = useCadenceStore((s) => s.streak);
  const longestStreak = useCadenceStore((s) => s.longestStreak);
  const xp = useCadenceStore((s) => s.xp);
  const enemyWord = useCadenceStore((s) => s.profile.enemyWord);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => getDetailedStats(sessions, xp), [sessions, xp]);
  const maxWeek = Math.max(1, ...stats.week.map((d) => d.count));
  const maxFiller = Math.max(1, ...stats.topFillers.map((f) => f.count));
  const maxCat = Math.max(1, ...stats.byCategory.map((c) => c.count));

  const trendLabel =
    stats.trend === 'up'
      ? `↑ +${stats.trendDelta} vs earlier`
      : stats.trend === 'down'
        ? `↓ ${stats.trendDelta} vs earlier`
        : stats.trend === 'flat'
          ? '→ Holding steady'
          : 'Start a session to track trend';

  return (
    <LinearGradient colors={[colors.parchment, colors.parchmentDeep]} style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.sub}>Your speaking sharpness, measured.</Text>

        {/* Level + XP */}
        <Card style={{ marginBottom: 14 }}>
          <View style={styles.levelRow}>
            <View>
              <Text style={styles.levelKicker}>Speaker level</Text>
              <Text style={styles.levelNum}>Lvl {stats.level}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.xpBig}>{xp} XP</Text>
              <Text style={styles.xpNext}>
                {stats.xpForNextLevel - stats.xpIntoLevel} to next level
              </Text>
            </View>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${Math.round(stats.levelProgress * 100)}%` }]} />
          </View>
          <Text style={styles.trend}>{trendLabel}</Text>
        </Card>

        {/* Hero metrics */}
        <View style={styles.heroStats}>
          <HeroStat value={streak} label="Streak" accent={colors.copper} />
          <HeroStat value={longestStreak} label="Best streak" accent={colors.teal} />
          <HeroStat value={stats.totalSessions} label="Sessions" accent={colors.tealMid} />
        </View>

        {/* Speaking metrics */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>Speaking metrics</SectionLabel>
          <View style={styles.metricGrid}>
            <Metric cell label="Avg WPM" value={stats.avgWpm || '—'} hint="Ideal 120–160" />
            <Metric cell label="Best WPM" value={stats.bestWpm || '—'} />
            <Metric cell label="Latest WPM" value={stats.latestWpm ?? '—'} />
            <Metric cell label="Avg fillers" value={stats.avgFillers || '—'} hint="Lower is better" />
            <Metric
              cell
              label="Filler rate"
              value={stats.totalSessions ? `${stats.fillerRate}%` : '—'}
              hint="Per 100 words"
            />
            <Metric cell label="Best score" value={stats.bestOverall || '—'} />
            <Metric cell label="Words spoken" value={stats.totalWords || '—'} />
            <Metric
              cell
              label="Time practiced"
              value={stats.totalSeconds ? formatDuration(stats.totalSeconds) : '—'}
            />
            <Metric cell label="Total fillers" value={stats.totalFillers || '—'} />
          </View>
        </Card>

        {/* 7-day activity */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>Last 7 days</SectionLabel>
          <View style={styles.weekRow}>
            {stats.week.map((d) => {
              const barH = Math.max(6, Math.round((d.count / maxWeek) * 72));
              return (
                <View key={d.key} style={styles.weekDay}>
                  <View style={styles.weekBarWrap}>
                    <View
                      style={[
                        styles.weekBar,
                        {
                          height: barH,
                          backgroundColor: d.count > 0 ? colors.teal : colors.parchmentDeep,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.weekLabel}>{d.label}</Text>
                  <Text style={styles.weekCount}>{d.count || ''}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.weekHint}>
            {stats.week.reduce((n, d) => n + d.count, 0)} sessions this week
            {enemyWord ? ` · Hunting “${enemyWord}”` : ''}
          </Text>
        </Card>

        {/* Skill bars */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>Skill averages</SectionLabel>
          {stats.totalSessions === 0 ? (
            <Text style={styles.emptyInline}>Complete a session to unlock skill averages.</Text>
          ) : (
            SKILL_ROWS.map((row) => (
              <SkillBar key={row.key} label={row.label} value={stats.skills[row.key]} />
            ))
          )}
        </Card>

        {/* Top fillers */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>Your top fillers</SectionLabel>
          {stats.topFillers.length === 0 ? (
            <Text style={styles.emptyInline}>No fillers logged yet — or you’re already clean.</Text>
          ) : (
            stats.topFillers.map((f) => (
              <View key={f.label} style={styles.barRow}>
                <Text style={styles.barLabel}>“{f.label}”</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFillCoral,
                      { width: `${Math.round((f.count / maxFiller) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barCount}>{f.count}</Text>
              </View>
            ))
          )}
        </Card>

        {/* Weak vocabulary */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>Words to upgrade</SectionLabel>
          {stats.topWeakWords.length === 0 ? (
            <Text style={styles.emptyInline}>No weak-word patterns yet.</Text>
          ) : (
            <View style={styles.chipWrap}>
              {stats.topWeakWords.map((w) => (
                <View key={w.label} style={styles.weakChip}>
                  <Text style={styles.weakText}>{w.label}</Text>
                  <Text style={styles.weakCount}>×{w.count}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* By category */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>By focus</SectionLabel>
          {stats.byCategory.length === 0 ? (
            <Text style={styles.emptyInline}>Practice Interview, Debate, Story, Pitch, or Daily.</Text>
          ) : (
            stats.byCategory.map((c) => (
              <View key={c.category} style={styles.catRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catLabel}>{c.label}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFillTeal,
                        { width: `${Math.round((c.count / maxCat) * 100)}%` },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.catMeta}>
                  <Text style={styles.catCount}>{c.count}×</Text>
                  <Text style={styles.catScore}>{c.avgScore} avg</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Session history */}
        <SectionLabel>Session history</SectionLabel>
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyBody}>
              Finish today’s prompt — your WPM, fillers, and scores will land here in detail.
            </Text>
          </View>
        ) : (
          sessions.slice(0, 25).map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              expanded={expandedId === s.id}
              onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
            />
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function HeroStat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.heroItem}>
      <Text style={[styles.heroNum, { color: accent }]}>{value}</Text>
      <Text style={styles.heroLabel}>{label}</Text>
    </View>
  );
}

function Metric({
  label,
  value,
  hint,
  cell,
}: {
  label: string;
  value: string | number;
  hint?: string;
  cell?: boolean;
}) {
  return (
    <View style={[styles.metric, cell && styles.metricCell]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </View>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 80 ? colors.success : value >= 60 ? colors.tealMid : colors.copper;
  return (
    <View style={styles.skillRow}>
      <Text style={styles.skillLabel}>{label}</Text>
      <View style={styles.skillTrack}>
        <View style={[styles.skillFill, { width: `${value}%`, backgroundColor: tone }]} />
      </View>
      <Text style={[styles.skillValue, { color: tone }]}>{value || '—'}</Text>
    </View>
  );
}

function SessionCard({
  session,
  expanded,
  onToggle,
}: {
  session: Session;
  expanded: boolean;
  onToggle: () => void;
}) {
  const a = session.analysis;
  return (
    <Pressable onPress={onToggle} style={styles.session}>
      <View style={styles.sessionTop}>
        <Text style={styles.sessionCat}>{GOAL_LABELS[session.category]}</Text>
        <Text style={styles.sessionDate}>
          {format(parseISO(session.createdAt), 'MMM d · h:mm a')}
        </Text>
      </View>
      <Text style={styles.sessionPrompt} numberOfLines={expanded ? 4 : 2}>
        {session.promptText}
      </Text>
      <View style={styles.sessionMeta}>
        <Text style={styles.meta}>{a.wpm} WPM</Text>
        <Text style={styles.meta}>{a.fillerCount} fillers</Text>
        <Text style={styles.meta}>{a.scores.overall} score</Text>
        <Text style={[styles.meta, { color: colors.copper }]}>+{a.xpEarned} XP</Text>
      </View>

      {expanded && (
        <View style={styles.sessionDetail}>
          <View style={styles.detailGrid}>
            <Detail label="Clarity" value={a.scores.clarity} />
            <Detail label="Confidence" value={a.scores.confidence} />
            <Detail label="Delivery" value={a.scores.delivery} />
            <Detail label="Persuade" value={a.scores.persuasiveness} />
            <Detail label="Story" value={a.scores.storytelling} />
            <Detail label="Words" value={a.wordCount} />
          </View>
          {a.fillersFound.length > 0 && (
            <Text style={styles.detailLine}>
              Fillers:{' '}
              {a.fillersFound.map((f) => `${f.word}×${f.count}`).join(', ')}
            </Text>
          )}
          {a.vocabUpgrades.length > 0 && (
            <Text style={styles.detailLine}>
              Upgrades:{' '}
              {a.vocabUpgrades
                .slice(0, 4)
                .map((u) => `${u.original}→${u.suggestion}`)
                .join(', ')}
            </Text>
          )}
          <Text style={styles.detailLine}>
            Prep: {session.prepMinutes === 0 ? 'Spoke now' : `${session.prepMinutes} min`} ·{' '}
            {formatDuration(a.durationSec)}
          </Text>
          <Text style={styles.fixLine}>{a.coaching.fix}</Text>
        </View>
      )}
      <Text style={styles.expandHint}>{expanded ? 'Tap to collapse' : 'Tap for details'}</Text>
    </Pressable>
  );
}

function Detail({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    color: colors.teal,
    marginBottom: 6,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    marginBottom: 20,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  levelKicker: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 4,
  },
  levelNum: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: colors.teal,
  },
  xpBig: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.copper,
  },
  xpNext: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  xpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.parchmentDeep,
    overflow: 'hidden',
    marginBottom: 10,
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.copper,
    borderRadius: 4,
  },
  trend: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.tealMid,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  heroItem: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  heroNum: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
  },
  heroLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metric: { marginBottom: 8 },
  metricCell: {
    width: '33.33%',
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  metricLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.ink,
  },
  metricHint: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.mutedLight,
    marginTop: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 100,
    marginBottom: 8,
  },
  weekDay: { flex: 1, alignItems: 'center' },
  weekBarWrap: {
    height: 72,
    width: 18,
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  weekBar: {
    width: '100%',
    borderRadius: 6,
  },
  weekLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.muted,
  },
  weekCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.teal,
    height: 14,
  },
  weekHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  skillLabel: {
    width: 100,
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
  skillFill: {
    height: '100%',
    borderRadius: 4,
  },
  skillValue: {
    width: 28,
    textAlign: 'right',
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  barLabel: {
    width: 88,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.coral,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.parchmentDeep,
    overflow: 'hidden',
  },
  barFillCoral: {
    height: '100%',
    backgroundColor: colors.coral,
    borderRadius: 4,
  },
  barFillTeal: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 4,
  },
  barCount: {
    width: 28,
    textAlign: 'right',
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  weakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.fillerHighlight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  weakText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.coral,
  },
  weakCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  catLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 6,
  },
  catMeta: { alignItems: 'flex-end', minWidth: 52 },
  catCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.teal,
  },
  catScore: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
  },
  emptyInline: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  empty: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 6,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  session: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionCat: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.tealLight,
  },
  sessionDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
  },
  sessionPrompt: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
    marginBottom: 10,
  },
  sessionMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
  },
  sessionDetail: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  detailItem: {
    width: '33.33%',
    marginBottom: 10,
  },
  detailLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  detailValue: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.ink,
  },
  detailLine: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: 6,
  },
  fixLine: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.copper,
    lineHeight: 20,
    marginTop: 4,
  },
  expandHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mutedLight,
    marginTop: 10,
  },
});
