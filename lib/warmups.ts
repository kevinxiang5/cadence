import { localTodayKey } from '@/lib/dates';
import type { CoachDrill } from '@/lib/coach';

export const WARMUPS: CoachDrill[] = [
  {
    id: 'warm-leather',
    title: 'Tongue twister',
    body: 'Red leather, yellow leather. Twice slow, once fast.',
    promptText:
      'Say “red leather, yellow leather” twice slowly, then once at full speed. Then tell me what you had for breakfast in one clean sentence.',
    category: 'daily',
  },
  {
    id: 'warm-pepper',
    title: 'Peter Piper',
    body: 'One twister, then a 15-second intro.',
    promptText:
      'Say “Peter Piper picked a peck of pickled peppers” twice. Then introduce yourself in 15 seconds with no um or uh.',
    category: 'interview',
  },
  {
    id: 'warm-count',
    title: 'Count with pauses',
    body: '1 to 20. Breathe every five.',
    promptText:
      'Count from 1 to 20 out loud. Pause and breathe after 5, 10, and 15. Then say one sentence about your day at that same pace.',
    category: 'daily',
  },
  {
    id: 'warm-opener',
    title: 'No soft openers',
    body: 'Start mid-thought. No so, um, or like.',
    promptText:
      'Answer this in 30 seconds, starting on a real word — not so, um, like, or okay: What are you working on this week, and why does it matter?',
    category: 'daily',
  },
  {
    id: 'warm-breath',
    title: 'One-breath line',
    body: 'One idea per breath. Then stop.',
    promptText:
      'Take a breath. In one breath, say what you want this month. Stop at the end of the breath. Then take another breath and add one proof point.',
    category: 'daily',
  },
];

export const STRONG_OPENERS = [
  'The result was…',
  'Here’s what changed…',
  'I decided to…',
  'The tension was…',
  'What I learned is…',
];

export const WEAK_OPENERS = [
  'So um…',
  'I guess like…',
  'Sorry, this might ramble…',
  'I don’t know if this makes sense but…',
  'Okay so basically…',
];

export function getDailyChallenge(date = new Date()): CoachDrill {
  const key = localTodayKey(date);
  const n = key.split('-').reduce((sum, part) => sum + Number(part), 0);
  const pool: CoachDrill[] = [
    {
      id: 'chal-zero-um',
      title: 'Zero ums',
      body: '45 seconds. Pause instead of padding.',
      promptText:
        'Talk about your last 24 hours for 45 seconds. Do not say um or uh. If you feel one coming, pause.',
      category: 'daily',
    },
    {
      id: 'chal-number',
      title: 'One number',
      body: 'Put a concrete number in your answer.',
      promptText:
        'Describe a win from this month in 40 seconds. Include one specific number — time, people, money, or count.',
      category: 'pitch',
    },
    {
      id: 'chal-close',
      title: 'Crisp close',
      body: 'End on one sentence. Then stop.',
      promptText:
        'Teach me one thing you know well. End with a single takeaway sentence, then stop talking.',
      category: 'daily',
    },
    {
      id: 'chal-scene',
      title: 'Open in a scene',
      body: 'No setup. Start in the moment.',
      promptText:
        'Tell a 45-second story from this week. Start in the middle of the moment — no “so basically.”',
      category: 'story',
    },
    {
      id: 'chal-side',
      title: 'Pick a side',
      body: 'No hedging. One claim, one reason.',
      promptText:
        'Phones at the dinner table: good or bad? Pick a side in the first sentence. One reason. One close. 30 seconds.',
      category: 'debate',
    },
    {
      id: 'chal-hire',
      title: 'Why you',
      body: '30 seconds. No apology.',
      promptText:
        'Why should someone pick you? 30 seconds. Lead with a strength, give one proof, stop. No “I think maybe.”',
      category: 'interview',
    },
  ];
  return pool[n % pool.length];
}

export function greeting(name: string, date = new Date()): string {
  const h = date.getHours();
  const who = name.trim() || 'there';
  if (h < 12) return `Morning, ${who}`;
  if (h < 17) return `Hey, ${who}`;
  return `Evening, ${who}`;
}
