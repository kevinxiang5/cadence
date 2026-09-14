import type { Session } from '@/store/useCadenceStore';
import { GOAL_LABELS, type Goal } from '@/lib/prompts';
import { localTodayKey } from '@/lib/dates';

export type SkillAverages = {
  delivery: number;
  clarity: number;
  confidence: number;
  persuasiveness: number;
  storytelling: number;
  overall: number;
};

export type CountItem = { label: string; count: number };

export type DayActivity = {
  key: string;
  label: string;
  count: number;
  avgScore: number | null;
};

export type DetailedStats = {
  totalSessions: number;
  totalWords: number;
  totalSeconds: number;
  totalFillers: number;
  avgWpm: number;
  bestWpm: number;
  latestWpm: number | null;
  avgFillers: number;
  fillerRate: number; // per 100 words
  bestOverall: number;
  latestOverall: number | null;
  avgOverall: number;
  skills: SkillAverages;
  topFillers: CountItem[];
  topWeakWords: CountItem[];
  byCategory: { category: Goal; label: string; count: number; avgScore: number }[];
  week: DayActivity[];
  trend: 'up' | 'down' | 'flat' | 'new';
  trendDelta: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgress: number; // 0-1
};

const XP_PER_LEVEL = 100;

function localDayKey(d: Date): string {
  return localTodayKey(d);
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function avg1(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function getLevelFromXp(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  return {
    level,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    levelProgress: xpIntoLevel / XP_PER_LEVEL,
  };
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

export function getDetailedStats(sessions: Session[], xp: number): DetailedStats {
  const levelInfo = getLevelFromXp(xp);

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalWords: 0,
      totalSeconds: 0,
      totalFillers: 0,
      avgWpm: 0,
      bestWpm: 0,
      latestWpm: null,
      avgFillers: 0,
      fillerRate: 0,
      bestOverall: 0,
      latestOverall: null,
      avgOverall: 0,
      skills: {
        delivery: 0,
        clarity: 0,
        confidence: 0,
        persuasiveness: 0,
        storytelling: 0,
        overall: 0,
      },
      topFillers: [],
      topWeakWords: [],
      byCategory: [],
      week: buildWeek([]),
      trend: 'new',
      trendDelta: 0,
      ...levelInfo,
    };
  }

  const wpms = sessions.map((s) => s.analysis.wpm);
  const fillers = sessions.map((s) => s.analysis.fillerCount);
  const overalls = sessions.map((s) => s.analysis.scores.overall);
  const totalWords = sessions.reduce((n, s) => n + s.analysis.wordCount, 0);
  const totalSeconds = sessions.reduce((n, s) => n + s.analysis.durationSec, 0);
  const totalFillers = sessions.reduce((n, s) => n + s.analysis.fillerCount, 0);

  const skills: SkillAverages = {
    delivery: avg(sessions.map((s) => s.analysis.scores.delivery)),
    clarity: avg(sessions.map((s) => s.analysis.scores.clarity)),
    confidence: avg(sessions.map((s) => s.analysis.scores.confidence)),
    persuasiveness: avg(sessions.map((s) => s.analysis.scores.persuasiveness)),
    storytelling: avg(sessions.map((s) => s.analysis.scores.storytelling)),
    overall: avg(overalls),
  };

  const fillerMap = new Map<string, number>();
  const weakMap = new Map<string, number>();
  for (const s of sessions) {
    for (const f of s.analysis.fillersFound) {
      fillerMap.set(f.word, (fillerMap.get(f.word) ?? 0) + f.count);
    }
    for (const u of s.analysis.vocabUpgrades) {
      weakMap.set(u.original, (weakMap.get(u.original) ?? 0) + u.count);
    }
  }

  const topFillers = [...fillerMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topWeakWords = [...weakMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const catMap = new Map<Goal, { count: number; scoreSum: number }>();
  for (const s of sessions) {
    const cur = catMap.get(s.category) ?? { count: 0, scoreSum: 0 };
    cur.count += 1;
    cur.scoreSum += s.analysis.scores.overall;
    catMap.set(s.category, cur);
  }
  const byCategory = [...catMap.entries()]
    .map(([category, v]) => ({
      category,
      label: GOAL_LABELS[category],
      count: v.count,
      avgScore: Math.round(v.scoreSum / v.count),
    }))
    .sort((a, b) => b.count - a.count);

  // Trend: last up to 3 vs prior up to 3
  const recent = overalls.slice(0, Math.min(3, overalls.length));
  const prior = overalls.slice(recent.length, recent.length + 3);
  let trend: DetailedStats['trend'] = 'new';
  let trendDelta = 0;
  if (prior.length > 0) {
    const r = avg(recent);
    const p = avg(prior);
    trendDelta = r - p;
    trend = trendDelta >= 3 ? 'up' : trendDelta <= -3 ? 'down' : 'flat';
  } else if (sessions.length >= 1) {
    trend = 'flat';
  }

  return {
    totalSessions: sessions.length,
    totalWords,
    totalSeconds,
    totalFillers,
    avgWpm: avg(wpms),
    bestWpm: Math.max(...wpms),
    latestWpm: sessions[0]?.analysis.wpm ?? null,
    avgFillers: avg1(fillers),
    fillerRate: totalWords > 0 ? Math.round((totalFillers / totalWords) * 1000) / 10 : 0,
    bestOverall: Math.max(...overalls),
    latestOverall: sessions[0]?.analysis.scores.overall ?? null,
    avgOverall: avg(overalls),
    skills,
    topFillers,
    topWeakWords,
    byCategory,
    week: buildWeek(sessions),
    trend,
    trendDelta,
    ...levelInfo,
  };
}

function buildWeek(sessions: Session[]): DayActivity[] {
  const days: DayActivity[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = localDayKey(d);
    const label = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const daySessions = sessions.filter((s) => localDayKey(new Date(s.createdAt)) === key);
    const avgScore =
      daySessions.length > 0
        ? Math.round(
            daySessions.reduce((n, s) => n + s.analysis.scores.overall, 0) / daySessions.length
          )
        : null;
    days.push({ key, label, count: daySessions.length, avgScore });
  }
  return days;
}

export type TakeDelta = {
  overall: number;
  wpm: number;
  fillers: number;
  personalBest: boolean;
};

export function compareTakes(
  current: { scores: { overall: number }; wpm: number; fillerCount: number },
  previous?: { scores: { overall: number }; wpm: number; fillerCount: number } | null,
  bestOverall = 0
): TakeDelta | null {
  if (!previous) {
    return {
      overall: 0,
      wpm: 0,
      fillers: 0,
      personalBest: current.scores.overall >= bestOverall && current.scores.overall > 0,
    };
  }
  return {
    overall: current.scores.overall - previous.scores.overall,
    wpm: current.wpm - previous.wpm,
    fillers: previous.fillerCount - current.fillerCount,
    personalBest: current.scores.overall > bestOverall,
  };
}

/** Local calendar date YYYY-MM-DD (timezone-safe for streaks). */
export { localTodayKey, localYesterdayKey } from '@/lib/dates';
