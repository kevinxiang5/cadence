import { getWeakWordSuggestion } from '@/lib/analysis';
import { getDetailedStats } from '@/lib/stats';
import type { Goal } from '@/lib/prompts';
import type { Session, UserProfile } from '@/store/useCadenceStore';

export type CoachDrill = {
  id: string;
  title: string;
  body: string;
  promptText: string;
  category: Goal;
  day?: string;
  maxSeconds?: number;
  why?: string;
};

export const FLUENCY_DURATIONS = [90, 60, 45] as const;

/** Personalized — keep to two so Coach stays scannable. */
export function getPersonalizedDrills(sessions: Session[], profile: UserProfile): CoachDrill[] {
  const stats = getDetailedStats(sessions, 0);
  const drills: CoachDrill[] = [];

  const topFiller = stats.topFillers[0];
  if (topFiller) {
    drills.push({
      id: 'for-you-filler',
      title: `Cut “${topFiller.label}”`,
      body: `You’ve said it ${topFiller.count}×. Pause, then start the next sentence.`,
      promptText: `Talk about your week for 90 seconds. Do not say “${topFiller.label}”. If you feel it coming, go quiet and start the next sentence.`,
      category: 'daily',
      maxSeconds: 90,
    });
  }

  if (stats.avgWpm >= 170) {
    drills.push({
      id: 'for-you-pace',
      title: 'You’re rushing',
      body: `Average ${stats.avgWpm} WPM. Slowing down cuts fillers.`,
      promptText:
        'Explain a recent decision in 90 seconds. Speak slower than feels natural. Pause after every sentence.',
      category: 'daily',
      maxSeconds: 90,
    });
  } else if (stats.avgWpm > 0 && stats.avgWpm < 110) {
    drills.push({
      id: 'for-you-pace',
      title: 'Add energy',
      body: `Average ${stats.avgWpm} WPM. Aim closer to 130.`,
      promptText:
        'Pitch an idea you care about in 60 seconds. Keep the energy up. No trailing off.',
      category: 'pitch',
      maxSeconds: 60,
    });
  } else {
    const weak = stats.topWeakWords[0];
    const suggestion = weak ? getWeakWordSuggestion(weak.label) : undefined;
    if (weak && suggestion) {
      drills.push({
        id: 'for-you-word',
        title: `Swap “${weak.label}”`,
        body: `Use “${suggestion}” instead.`,
        promptText: `Retell something you did today in 90 seconds. Do not say “${weak.label}”. Use “${suggestion}” at least once.`,
        category: 'daily',
        maxSeconds: 90,
      });
    }
  }

  if (profile.goal === 'interview' && drills.length < 2) {
    drills.push({
      id: 'for-you-star',
      title: 'STAR answer',
      body: 'Situation, task, action, result — then stop.',
      promptText:
        'Tell me about a time you solved a problem at work or school. Situation, task, action, result. End on the result. Two minutes.',
      category: 'interview',
      maxSeconds: 90,
    });
  }

  return drills.slice(0, 2);
}

/**
 * Fluency lab — eight drills, not a catalog.
 * Backed by: Maurice 1983 / Nation 1989 / De Jong & Perfetti 2011 (4/3/2 + repetition);
 * Thai & Boers 2016 (time pressure); Lambert et al. 2016 (2–3 repeats);
 * Yen & Liu 2022 (soliloquizing under time constraint);
 * Seals & Church 2022 (silent pauses, chunking, slower pace, more prep).
 */
export function getFluencyLab(profile: UserProfile): CoachDrill[] {
  const enemy = profile.enemyWord || 'um';

  return [
    {
      id: 'lab-432',
      title: 'Same talk, tighter',
      body: '90s, then 60s, then 45s. Same story each time.',
      why: '4/3/2 — the best-studied fluency drill. Repetition plus shrinking time.',
      promptText:
        'Pick something you know well — a project, a how-to, or last weekend. Tell the whole thing this round. You will say it twice more, shorter.',
      category: 'daily',
      maxSeconds: 90,
    },
    {
      id: 'lab-silent',
      title: 'Quiet instead of um',
      body: 'Feel a filler coming? Close your mouth.',
      why: 'Silent pauses read as control. Filled pauses do not.',
      promptText:
        'Talk about your last 48 hours for 90 seconds. Every time you want um, uh, or like — pause, then start the next sentence. Silence is the drill.',
      category: 'daily',
      maxSeconds: 90,
    },
    {
      id: 'lab-chunk',
      title: 'One idea, then a period',
      body: 'Short sentences. Breath between them.',
      why: 'Chunking longer thoughts is how speakers drop fillers.',
      promptText:
        'Explain how you got into what you do now. One idea per sentence. Period. Breath. Next idea. Two minutes.',
      category: 'story',
      maxSeconds: 90,
    },
    {
      id: 'lab-slow',
      title: 'Slow the pace',
      body: 'Aim ~130 WPM. Slower than feels natural.',
      why: 'Rushing is a main cause of um/uh. Recorded speech usually sounds faster than it felt.',
      promptText:
        'Teach me something you know well. Speak slower than feels natural. Pause after every sentence. Two minutes.',
      category: 'daily',
      maxSeconds: 90,
    },
    {
      id: 'lab-plan',
      title: 'Think, then talk',
      body: 'After the countdown, wait one extra beat.',
      why: 'Planning the first sentence before you speak cuts verbal stalling.',
      promptText:
        'After the beep, wait one extra second in silence. Then answer, starting on a real word: What are you working on this week, and why does it matter? Two minutes.',
      category: 'daily',
      maxSeconds: 90,
    },
    {
      id: 'lab-repeat',
      title: 'Second telling',
      body: 'Same story you told someone this week. Cleaner.',
      why: 'Fluency jumps most on the 2nd and 3rd telling of the same material.',
      promptText:
        'Retell the last story you told someone this week. Same facts. Fewer hedges. Two minutes.',
      category: 'story',
      maxSeconds: 90,
    },
    {
      id: 'lab-open',
      title: 'Start on a real word',
      body: 'No so, um, like, or okay.',
      why: 'Soft openers train the mouth to stall. First word should carry the idea.',
      promptText:
        'Start with “The result was…” or “Here’s what changed…” Tell me about a decision you made this month. Two minutes. Do not start with so, um, like, or okay.',
      category: 'daily',
      maxSeconds: 90,
    },
    {
      id: 'lab-enemy',
      title: `Ban “${enemy}”`,
      body: 'One take. Pause instead of padding.',
      why: 'Self-awareness plus a single banned word is how filler habits actually move.',
      promptText: `Tell a 90-second story from this week. Do not say “${enemy}” even once. If it comes, go quiet.`,
      category: 'daily',
      maxSeconds: 90,
    },
  ];
}

export function getWeekPlan(goal: Goal): CoachDrill[] {
  const focus: Record<Goal, CoachDrill> = {
    interview: {
      id: 'week-focus',
      title: 'Interview rep',
      body: 'Walk through a project you’re proud of.',
      promptText: 'Walk me through a project you are proud of — what was your unique contribution? Two minutes.',
      category: 'interview',
      maxSeconds: 90,
    },
    debate: {
      id: 'week-focus',
      title: 'Debate rep',
      body: 'Pick a side. One claim beats three.',
      promptText: 'Should remote work be the default for knowledge jobs? Argue yes or no. Two minutes.',
      category: 'debate',
      maxSeconds: 90,
    },
    story: {
      id: 'week-focus',
      title: 'Story rep',
      body: 'Open in the moment. End on the shift.',
      promptText: 'Tell a two-minute story about a moment that changed how you see yourself.',
      category: 'story',
      maxSeconds: 90,
    },
    pitch: {
      id: 'week-focus',
      title: 'Pitch rep',
      body: 'Who hurts, what’s the aha, what’s the ask.',
      promptText: 'Pitch an app that helps people save money without feeling deprived. Two minutes.',
      category: 'pitch',
      maxSeconds: 90,
    },
    daily: {
      id: 'week-focus',
      title: 'Daily rep',
      body: 'Name one thing you’re avoiding, then start.',
      promptText: 'What is one thing you are avoiding — and what would “starting” look like today? Two minutes.',
      category: 'daily',
      maxSeconds: 90,
    },
  };
  return [focus[goal]];
}
