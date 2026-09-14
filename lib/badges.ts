import type { AnalysisResult } from '@/lib/analysis';
import type { Goal } from '@/lib/prompts';
import type { Session } from '@/store/useCadenceStore';

export type Badge = {
  id: string;
  title: string;
  hint: string;
  earned: boolean;
};

type BadgeInput = {
  sessions: Session[];
  streak: number;
  longestStreak: number;
  xp: number;
  pending?: { analysis: AnalysisResult; category: Goal } | null;
};

export function getBadges({
  sessions,
  streak,
  longestStreak,
  xp,
  pending,
}: BadgeInput): Badge[] {
  const all = pending
    ? [
        {
          analysis: pending.analysis,
          category: pending.category,
          promptId: '',
        },
        ...sessions,
      ]
    : sessions;

  const count = all.length;
  const clean = all.some((s) => s.analysis.fillerCount === 0 && s.analysis.wordCount >= 20);
  const paced = all.some((s) => s.analysis.wpm >= 120 && s.analysis.wpm <= 160);
  const sharp = all.some(
    (s) => s.analysis.vocabUpgrades.length === 0 && s.analysis.wordCount >= 25
  );
  const story = all.filter((s) => s.category === 'story').length;
  const interview = all.filter((s) => s.category === 'interview').length;
  const best = Math.max(0, ...all.map((s) => s.analysis.scores.overall));
  const zeroUm = all.some(
    (s) =>
      s.analysis.wordCount >= 20 &&
      !s.analysis.fillersFound.some((f) => f.word === 'um' || f.word === 'uh')
  );

  return [
    { id: 'first', title: 'First rep', hint: 'Finish one take.', earned: count >= 1 },
    { id: 'clean', title: 'Clean take', hint: '20+ words, zero fillers.', earned: clean },
    { id: 'pace', title: 'Pace lock', hint: 'Land between 120–160 WPM.', earned: paced },
    { id: 'sharp', title: 'Sharp vocab', hint: 'A take with no weak-word swaps.', earned: sharp },
    { id: 'streak3', title: 'Three in a row', hint: 'A 3-day streak.', earned: longestStreak >= 3 || streak >= 3 },
    { id: 'streak7', title: 'Week warrior', hint: 'A 7-day streak.', earned: longestStreak >= 7 || streak >= 7 },
    { id: 'ten', title: 'Ten takes', hint: 'Log 10 sessions.', earned: count >= 10 },
    { id: 'xp100', title: 'Century', hint: 'Earn 100 XP.', earned: xp + (pending?.analysis.xpEarned ?? 0) >= 100 },
    { id: 'story3', title: 'Storyteller', hint: 'Three story reps.', earned: story >= 3 },
    { id: 'int3', title: 'Interview ready', hint: 'Three interview reps.', earned: interview >= 3 },
    { id: 'eighty', title: 'High 80s', hint: 'Score 80 or above.', earned: best >= 80 },
    { id: 'no-um', title: 'No um, no uh', hint: 'A 20+ word take without um or uh.', earned: zeroUm },
  ];
}

export function newlyEarnedBadges(before: Badge[], after: Badge[]): Badge[] {
  return after.filter((b) => b.earned && !before.find((x) => x.id === b.id)?.earned);
}
