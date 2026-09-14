import { localTodayKey } from '@/lib/dates';

export type WordOfTheDay = {
  word: string;
  meaning: string;
  prompt: string;
};

const WORDS: WordOfTheDay[] = [
  { word: 'succinct', meaning: 'Said in a few clear words.', prompt: 'Describe your last week in a succinct way.' },
  { word: 'candid', meaning: 'Honest and direct, without spinning.', prompt: 'Give a candid take on a skill you are still building.' },
  { word: 'deliberate', meaning: 'Done on purpose, not rushed.', prompt: 'Talk about a deliberate choice you made recently.' },
  { word: 'poised', meaning: 'Calm and ready under pressure.', prompt: 'When were you poised when it would have been easy to panic?' },
  { word: 'lucid', meaning: 'Easy to understand.', prompt: 'Give a lucid explanation of something you know well.' },
  { word: 'precise', meaning: 'Exact — the right word, not a nearby one.', prompt: 'Be precise: what do you want this year, in one sentence?' },
  { word: 'grounded', meaning: 'Steady and realistic.', prompt: 'Share a grounded opinion about a trend everyone is hyped about.' },
  { word: 'crisp', meaning: 'Clean and sharp, no extra words.', prompt: 'Give a crisp introduction of yourself in 20 seconds.' },
  { word: 'vivid', meaning: 'Easy to picture.', prompt: 'Tell a vivid 30-second story from this week.' },
  { word: 'measured', meaning: 'Careful and even, not extreme.', prompt: 'Give a measured response to a disagreement you had.' },
  { word: 'pointed', meaning: 'Aimed at one clear idea.', prompt: 'Make a pointed case for something you believe.' },
  { word: 'fluent', meaning: 'Smooth, without getting stuck.', prompt: 'Talk fluently about a hobby for 30 seconds.' },
  { word: 'assured', meaning: 'Confident without being loud.', prompt: 'Sound assured: why should someone trust your judgment?' },
  { word: 'concise', meaning: 'Short, and still complete.', prompt: 'Give a concise recap of your day.' },
  { word: 'articulate', meaning: 'Able to put thoughts into clean words.', prompt: 'Articulate why a recent decision mattered.' },
  { word: 'earnest', meaning: 'Sincere, not performing.', prompt: 'Speak in an earnest way about something you care about.' },
  { word: 'decisive', meaning: 'Willing to pick a side.', prompt: 'Be decisive: remote work — good or bad for you, and why?' },
  { word: 'composed', meaning: 'In control of your tone.', prompt: 'Stay composed while describing a stressful moment.' },
  { word: 'incisive', meaning: 'Cuts to the real issue fast.', prompt: 'Give an incisive take on a problem at school or work.' },
  { word: 'resonant', meaning: 'Sticks with the listener.', prompt: 'Tell a resonant story that would stay with an interviewer.' },
  { word: 'salient', meaning: 'The part that actually matters.', prompt: 'Name the salient point of a messy week.' },
  { word: 'resolve', meaning: 'A firm decision, not a mood.', prompt: 'Talk about a resolve you made and whether it held.' },
  { word: 'conviction', meaning: 'Belief you can stand on.', prompt: 'Speak with conviction about something small that still matters.' },
  { word: 'restraint', meaning: 'Knowing when to stop.', prompt: 'Tell a story where restraint served you better than volume.' },
  { word: 'specificity', meaning: 'Details instead of fog.', prompt: 'Describe yesterday with more specificity than feels comfortable.' },
  { word: 'momentum', meaning: 'Motion that keeps going.', prompt: 'Where do you have momentum right now, and where is it fake?' },
  { word: 'humility', meaning: 'Accurate about yourself.', prompt: 'Show humility without putting yourself down.' },
  { word: 'urgency', meaning: 'Why this cannot wait.', prompt: 'Make a case with urgency but without panic.' },
  { word: 'candor', meaning: 'Honesty without cruelty.', prompt: 'Use candor: what should someone stop doing?' },
];

export function getWordOfTheDay(date = new Date()): WordOfTheDay {
  const key = localTodayKey(date);
  const n = key.split('-').reduce((sum, part) => sum + Number(part), 0);
  return WORDS[n % WORDS.length];
}
