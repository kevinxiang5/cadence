import { EXTRA_PROMPTS } from '@/lib/promptPack';

export type Goal = 'interview' | 'debate' | 'story' | 'pitch' | 'daily';

export type Prompt = {
  id: string;
  category: Goal;
  text: string;
  hints: string[];
};

const CORE_PROMPTS: Prompt[] = [
  // Interview
  {
    id: 'int-1',
    category: 'interview',
    text: 'Tell me about a time you disagreed with a teammate and how you handled it.',
    hints: ['Set the scene in one sentence', 'Name the tension, not the villain', 'End with what you learned'],
  },
  {
    id: 'int-2',
    category: 'interview',
    text: 'Why should we hire you over someone with more experience?',
    hints: ['Lead with a concrete strength', 'Connect it to their needs', 'Close with energy, not apology'],
  },
  {
    id: 'int-3',
    category: 'interview',
    text: 'Walk me through a project you are proud of — what was your unique contribution?',
    hints: ['Start with the outcome', 'Zoom into your decision', 'Quantify impact if you can'],
  },
  {
    id: 'int-4',
    category: 'interview',
    text: 'Describe a failure. What would you do differently now?',
    hints: ['Own it without spiraling', 'Show the lesson clearly', 'Bridge to how you work today'],
  },
  {
    id: 'int-5',
    category: 'interview',
    text: 'Where do you see yourself in five years — and why does this role get you there?',
    hints: ['Be ambitious but grounded', 'Make the role the bridge', 'Avoid vague “grow and learn”'],
  },
  {
    id: 'int-6',
    category: 'interview',
    text: 'Explain a complex idea from your field so a smart non-expert would understand.',
    hints: ['Use one analogy', 'Cut jargon early', 'Check for clarity as you go'],
  },

  // Debate
  {
    id: 'deb-1',
    category: 'debate',
    text: 'Should remote work be the default for knowledge jobs? Argue yes or no.',
    hints: ['Pick a clear side', 'One strong claim beats three weak ones', 'Address the best counterargument'],
  },
  {
    id: 'deb-2',
    category: 'debate',
    text: 'Is a four-day workweek realistic for startups? Defend your position.',
    hints: ['Define “realistic”', 'Use one concrete example', 'Concede one point, then reinforce yours'],
  },
  {
    id: 'deb-3',
    category: 'debate',
    text: 'Should social media platforms be held liable for content their users post?',
    hints: ['Frame the tradeoff', 'Avoid absolute language', 'Close with a practical proposal'],
  },
  {
    id: 'deb-4',
    category: 'debate',
    text: 'College degrees are overrated for tech careers. Agree or disagree.',
    hints: ['Separate signal from skill', 'Acknowledge exceptions', 'Land on a nuanced stance'],
  },
  {
    id: 'deb-5',
    category: 'debate',
    text: 'AI will create more jobs than it destroys. Argue for or against.',
    hints: ['Timeframe matters — name yours', 'Distinguish types of work', 'End with a conditional claim'],
  },

  // Story
  {
    id: 'sto-1',
    category: 'story',
    text: 'Tell a two-minute story about a moment that changed how you see yourself.',
    hints: ['Open in the middle of the moment', 'One sensory detail', 'End with the shift, not a moral'],
  },
  {
    id: 'sto-2',
    category: 'story',
    text: 'Describe the most interesting conversation you had this month.',
    hints: ['Who were you talking to?', 'What surprised you?', 'Why does it still stick?'],
  },
  {
    id: 'sto-3',
    category: 'story',
    text: 'Recount a time you took a risk that didn’t go as planned — but taught you something.',
    hints: ['Build tension before the turn', 'Be honest about the mess', 'Land the insight cleanly'],
  },
  {
    id: 'sto-4',
    category: 'story',
    text: 'Tell the story of how you got into what you do now — in under 90 seconds.',
    hints: ['Skip the resume list', 'One turning point', 'Make curiosity the engine'],
  },
  {
    id: 'sto-5',
    category: 'story',
    text: 'Share a small everyday moment that reveals something about who you are.',
    hints: ['Stay specific', 'Avoid overselling', 'Let the detail do the work'],
  },

  // Pitch
  {
    id: 'pit-1',
    category: 'pitch',
    text: 'Pitch an app that helps people save money without feeling deprived.',
    hints: ['Who hurts today?', 'What’s the aha?', 'Ask for one clear next step'],
  },
  {
    id: 'pit-2',
    category: 'pitch',
    text: 'Convince a skeptical friend to try a cold plunge or ice bath with you.',
    hints: ['Start with their objection', 'Make it social, not preachy', 'Offer a low bar first try'],
  },
  {
    id: 'pit-3',
    category: 'pitch',
    text: 'Pitch yourself as the co-founder someone should want to build with.',
    hints: ['Name your superpower', 'Show how you complement others', 'Keep ego light'],
  },
  {
    id: 'pit-4',
    category: 'pitch',
    text: 'You have 60 seconds: convince an investor your generation’s biggest problem is worth solving.',
    hints: ['Name the problem vividly', 'Why now?', 'Why you?'],
  },
  {
    id: 'pit-5',
    category: 'pitch',
    text: 'Pitch a weekend trip destination to a group that can’t agree on anything.',
    hints: ['Acknowledge the deadlock', 'Offer a compromise frame', 'Make the vibe irresistible'],
  },

  // Daily
  {
    id: 'day-1',
    category: 'daily',
    text: 'What is one thing you are avoiding — and what would “starting” look like today?',
    hints: ['Name it plainly', 'Shrink the first step', 'Speak with self-respect'],
  },
  {
    id: 'day-2',
    category: 'daily',
    text: 'Explain your current mood as if you were briefing a close friend.',
    hints: ['Skip “fine”', 'One cause, one feeling', 'End with what you need'],
  },
  {
    id: 'day-3',
    category: 'daily',
    text: 'What opinion have you changed your mind about in the last year?',
    hints: ['What did you used to believe?', 'What cracked it?', 'What do you believe now?'],
  },
  {
    id: 'day-4',
    category: 'daily',
    text: 'Give advice to your past self from one year ago — 90 seconds, no fluff.',
    hints: ['Be specific', 'Skip the Instagram quotes', 'Say the hard thing kindly'],
  },
  {
    id: 'day-5',
    category: 'daily',
    text: 'If you could master one communication skill this month, what would it be and why?',
    hints: ['Pick one skill', 'Connect it to a real situation', 'Make it measurable'],
  },
  {
    id: 'day-6',
    category: 'daily',
    text: 'Describe your ideal Tuesday — then name one thing blocking it.',
    hints: ['Paint the day vividly', 'Be honest about the blocker', 'One micro-fix'],
  },
  {
    id: 'day-7',
    category: 'daily',
    text: 'What’s a compliment you wish people gave you more often — and why does it matter?',
    hints: ['Name the compliment', 'What does it signal?', 'Keep it grounded'],
  },
  {
    id: 'day-8',
    category: 'daily',
    text: 'Teach me something you know well in under two minutes.',
    hints: ['Assume I’m smart but new', 'One example', 'One common mistake'],
  },
  {
    id: 'int-7',
    category: 'interview',
    text: 'Tell me about a time you had to learn something fast with no one to ask.',
    hints: ['Name the clock', 'Show how you learned', 'End with what you’d repeat'],
  },
  {
    id: 'int-8',
    category: 'interview',
    text: 'What is a strength that used to get you in trouble — and how do you use it now?',
    hints: ['Name the double edge', 'Give one scene', 'Show the control'],
  },
  {
    id: 'int-9',
    category: 'interview',
    text: 'Walk me through how you handle feedback you disagree with.',
    hints: ['Don’t get defensive', 'Show you heard it', 'Say what you did next'],
  },
  {
    id: 'int-10',
    category: 'interview',
    text: 'Describe your working style in 60 seconds — how do people experience you?',
    hints: ['Skip Myers-Briggs', 'One example of you in a crunch', 'Name a need you have'],
  },
  {
    id: 'deb-6',
    category: 'debate',
    text: 'Should internships be paid, always? Defend your position.',
    hints: ['Define the harm', 'One counterargument', 'A practical rule'],
  },
  {
    id: 'deb-7',
    category: 'debate',
    text: 'Is “follow your passion” good advice for people in their twenties?',
    hints: ['Don’t strawman', 'Use one real path', 'Land a nuanced close'],
  },
  {
    id: 'deb-8',
    category: 'debate',
    text: 'Should schools ban phones during the day?',
    hints: ['Pick a side fast', 'Address focus vs freedom', 'Propose a policy'],
  },
  {
    id: 'sto-6',
    category: 'story',
    text: 'Tell the story of a compliment you didn’t believe — and what it changed.',
    hints: ['Set the scene', 'Why you rejected it', 'What shifted later'],
  },
  {
    id: 'sto-7',
    category: 'story',
    text: 'Recount a time you were the new person in the room.',
    hints: ['The feeling, specifically', 'One choice you made', 'How it ended'],
  },
  {
    id: 'sto-8',
    category: 'story',
    text: 'Tell a story about a meal that still lives in your head.',
    hints: ['Sensory first', 'Who were you with?', 'Why it stuck'],
  },
  {
    id: 'pit-6',
    category: 'pitch',
    text: 'Pitch a better morning routine to someone who hates routines.',
    hints: ['Start with their objection', 'Make it tiny', 'One vivid payoff'],
  },
  {
    id: 'pit-7',
    category: 'pitch',
    text: 'You have 45 seconds: sell me on a book, show, or podcast that changed you.',
    hints: ['Who it’s for', 'The aha', 'The ask: try the first chapter'],
  },
  {
    id: 'pit-8',
    category: 'pitch',
    text: 'Pitch why your team should try a weekly speaking rep like this one.',
    hints: ['The cost of filler-heavy meetings', 'The 2-minute bar', 'A first experiment'],
  },
  {
    id: 'day-9',
    category: 'daily',
    text: 'What are you pretending not to know?',
    hints: ['Say it plainly', 'What would honesty cost?', 'One next move'],
  },
  {
    id: 'day-10',
    category: 'daily',
    text: 'Describe a person you admire — without using the word “inspiring.”',
    hints: ['One scene of them', 'What they do, not adjectives', 'What you borrowed'],
  },
  {
    id: 'day-11',
    category: 'daily',
    text: 'If today were a chapter title, what would it be — and why?',
    hints: ['Name the title', 'Two beats from the day', 'How it should end'],
  },
  {
    id: 'day-12',
    category: 'daily',
    text: 'Explain a disagreement you had this week as if you were fair to both sides.',
    hints: ['Their view first', 'Yours second', 'What you’d do differently'],
  },
];

export const PROMPTS: Prompt[] = [...CORE_PROMPTS, ...EXTRA_PROMPTS];

export function getPromptById(id: string, extras: Prompt[] = []): Prompt | undefined {
  return [...extras, ...PROMPTS].find((p) => p.id === id);
}

export function getRandomPrompt(category: Goal | 'all' = 'all', extras: Prompt[] = []): Prompt {
  const pool =
    category === 'all'
      ? [...extras, ...PROMPTS]
      : [...extras, ...PROMPTS].filter((p) => p.category === category);
  const list = pool.length > 0 ? pool : PROMPTS;
  return list[Math.floor(Math.random() * list.length)];
}

export function getAllPrompts(extras: Prompt[] = []): Prompt[] {
  return [...extras, ...PROMPTS];
}

export const GOAL_LABELS: Record<Goal, string> = {
  interview: 'Interview',
  debate: 'Debate',
  story: 'Story',
  pitch: 'Pitch',
  daily: 'Daily',
};

export const HABIT_STACKS = [
  { id: 'coffee', label: 'After morning coffee', emoji: '☕' },
  { id: 'commute', label: 'During my commute', emoji: '🚇' },
  { id: 'lunch', label: 'Right after lunch', emoji: '🥗' },
  { id: 'meeting', label: 'Before my first meeting', emoji: '📅' },
  { id: 'gym', label: 'After the gym', emoji: '💪' },
  { id: 'evening', label: 'Before winding down', emoji: '🌙' },
];

export const ENEMY_WORDS = [
  'um',
  'uh',
  'like',
  'you know',
  'basically',
  'I mean',
  'actually',
  'literally',
  'sort of',
  'kind of',
];

/** Deterministic daily prompt based on date + preferred goal bias */
export function getTodaysPrompt(goal: Goal = 'daily', date = new Date()): Prompt {
  const dayIndex = Math.floor(date.getTime() / 86400000);
  const preferred = PROMPTS.filter((p) => p.category === goal);
  const pool = preferred.length > 0 ? preferred : PROMPTS.filter((p) => p.category === 'daily');
  // Mix in a few from other categories for variety
  const mixed = [...pool, ...PROMPTS.filter((p) => p.category === 'daily').slice(0, 3)];
  return mixed[dayIndex % mixed.length];
}

export function getPromptsByCategory(category: Goal | 'all', extras: Prompt[] = []): Prompt[] {
  const all = [...extras, ...PROMPTS];
  if (category === 'all') return all;
  return all.filter((p) => p.category === category);
}
