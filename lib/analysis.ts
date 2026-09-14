import { synthesizePace, type PacePoint } from '@/lib/pace';
import { restoreTranscript } from '@/lib/transcript';

export type { PacePoint };

export type VocabUpgrade = {
  original: string;
  suggestion: string;
  count: number;
};

export type RepeatedWord = {
  word: string;
  count: number;
};

export type CoachingCard = {
  strength: string;
  fix: string;
  rewriteTip: string;
};

export type AnalysisResult = {
  wordCount: number;
  durationSec: number;
  wpm: number;
  paceSeries?: PacePoint[];
  fillerCount: number;
  fillersFound: { word: string; count: number }[];
  fillerPositions: { start: number; end: number; word: string }[];
  repeatedWords: RepeatedWord[];
  vocabUpgrades: VocabUpgrade[];
  pauseEstimate: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  stutterCount: number;
  cleanTranscript: string;
  scores: {
    delivery: number;
    clarity: number;
    confidence: number;
    persuasiveness: number;
    storytelling: number;
    overall: number;
  };
  coaching: CoachingCard;
  xpEarned: number;
};

type FillerMatcher = {
  word: string;
  re: RegExp;
  /** If set, highlight/count this capture group instead of the full match. */
  group?: number;
};

/**
 * Longest / most specific first. "like" is only a filler in hedge/quotative
 * contexts so "I like this job" is not flagged. Same for "right" vs "the right call".
 * Apple often writes um/uh as umm, uhh, hum, or a lone "a" before a pronoun.
 */
const FILLER_MATCHERS: FillerMatcher[] = [
  { word: 'you know', re: /\byou know(?:\s+what\s+i\s+mean)?\b/gi },
  { word: 'i mean', re: /\bi mean\b/gi },
  { word: 'kind of', re: /\bkind of\b/gi },
  { word: 'sort of', re: /\bsort of\b/gi },
  { word: 'okay so', re: /\bokay so\b/gi },
  { word: 'so yeah', re: /\bso yeah\b/gi },
  { word: 'i guess', re: /\bi guess\b/gi },
  { word: 'like', re: /\b(?:i'm|i am|i was|he was|she was|they were|we were|it's|it was)\s+(like)\b/gi, group: 1 },
  { word: 'like', re: /\blike\s*,/gi },
  { word: 'like', re: /\b(like)\s+(?:i|we|um|uh|so|you know)\b/gi, group: 1 },
  { word: 'like', re: /(?:think|know|mean|guess|basically|just|really|and|but|so)\s+(like)\b/gi, group: 1 },
  { word: 'like', re: /(?:^|[.!?]\s+)(like)\b/gi, group: 1 },
  { word: 'um', re: /\b(?:um+|uhm+|uh+m+|hum+|unm+)\b/gi },
  { word: 'uh', re: /\b(?:uh+|ah+|er+|erm|err|eh+|uh+-?huh|uh+-?oh)\b/gi },
  { word: 'hmm', re: /\b(?:hm+|mm+|mm-?h+m+)\b/gi },
  {
    word: 'uh',
    re: /(?:^|[\s,])(a|oh|eh)(?=\s+(?:I|I'm|I've|I'd|I'll|we|we're|you|they|he|she|it|so|like|um|uh)\b)/gi,
    group: 1,
  },
  { word: 'uh', re: /,\s*(?:a|oh|eh)\s*,/gi },
  { word: 'right', re: /\bright\s*\?/gi },
  { word: 'right', re: /,\s*right\b/gi },
  { word: 'basically', re: /\bbasically\b/gi },
  { word: 'actually', re: /\bactually\b/gi },
  { word: 'literally', re: /\bliterally\b/gi },
  { word: 'kinda', re: /\bkinda\b/gi },
  { word: 'sorta', re: /\bsorta\b/gi },
];

const STUTTER_RE = /\b(I|I'm|I've|I'd|we|the|and|so|that|it|my|you)\s+\1\b/gi;

const HESITATION_WORDS = new Set(['um', 'uh', 'hmm']);
const FILLER_LABELS = new Set(FILLER_MATCHERS.map((m) => m.word));

const WEAK_WORDS: Record<string, string> = {
  good: 'compelling',
  bad: 'problematic',
  nice: 'thoughtful',
  great: 'outstanding',
  stuff: 'work',
  things: 'priorities',
  'a lot': 'considerably',
  lots: 'numerous',
  very: 'remarkably',
  really: 'genuinely',
  just: 'simply',
  maybe: 'perhaps',
  somehow: 'through deliberate effort',
  'kind of': 'somewhat',
  'sort of': 'somewhat',
  okay: 'solid',
  fine: 'adequate',
  interesting: 'striking',
  important: 'essential',
  help: 'support',
  big: 'substantial',
  small: 'modest',
  hard: 'demanding',
  easy: 'straightforward',
  get: 'secure',
  make: 'create',
  do: 'deliver',
  went: 'moved',
  said: 'explained',
  think: 'believe',
  feel: 'sense',
  want: 'aim',
  need: 'require',
  try: 'strive',
  pretty: 'notably',
};

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'my',
  'your',
  'his',
  'her',
  'its',
  'our',
  'their',
  'me',
  'him',
  'them',
  'what',
  'which',
  'who',
  'whom',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'up',
  'down',
  'out',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'if',
  'because',
  'while',
  'although',
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[""]/g, '"').replace(/['']/g, "'").trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function spanFromMatch(match: RegExpExecArray, group?: number): { start: number; end: number } {
  if (group && match[group]) {
    const captured = match[group];
    const offset = match[0].lastIndexOf(captured);
    const start = match.index + Math.max(0, offset);
    return { start, end: start + captured.length };
  }
  return { start: match.index, end: match.index + match[0].length };
}

function findFillerPositions(text: string): { start: number; end: number; word: string }[] {
  const positions: { start: number; end: number; word: string }[] = [];

  const push = (start: number, end: number, word: string) => {
    if (start < 0 || end <= start || end > text.length) return;
    const overlaps = positions.some((p) => start < p.end && end > p.start);
    if (!overlaps) positions.push({ start, end, word });
  };

  for (const { re, word, group } of FILLER_MATCHERS) {
    const copy = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    let match: RegExpExecArray | null;
    while ((match = copy.exec(text)) !== null) {
      const span = spanFromMatch(match, group);
      push(span.start, span.end, word);
      if (match[0].length === 0) copy.lastIndex += 1;
    }
  }

  const stutter = new RegExp(STUTTER_RE.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = stutter.exec(text)) !== null) {
    const token = m[1];
    if (HESITATION_WORDS.has(token.toLowerCase())) continue;
    const secondStart = m.index + m[0].length - token.length;
    push(secondStart, m.index + m[0].length, `${token} ${token}`);
    if (m[0].length === 0) stutter.lastIndex += 1;
  }

  return positions.sort((a, b) => a.start - b.start);
}

function findFillers(text: string): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of findFillerPositions(text)) {
    counts.set(p.word, (counts.get(p.word) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

function findRepeatedWords(words: string[]): RepeatedWord[] {
  const counts = new Map<string, number>();
  for (const w of words) {
    const clean = w.replace(/['']/g, '');
    if (clean.length < 3 || STOP_WORDS.has(clean) || FILLER_LABELS.has(clean) || HESITATION_WORDS.has(clean)) continue;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c >= 3)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findVocabUpgrades(text: string): VocabUpgrade[] {
  const lower = normalize(text);
  const found: VocabUpgrade[] = [];

  // Multi-word weak phrases first
  const entries = Object.entries(WEAK_WORDS).sort((a, b) => b[0].length - a[0].length);
  const claimed = new Set<string>();

  for (const [weak, suggestion] of entries) {
    if (claimed.has(weak)) continue;
    const re = new RegExp(`\\b${escapeRe(weak)}\\b`, 'gi');
    const matches = lower.match(re);
    if (matches?.length) {
      found.push({ original: weak, suggestion, count: matches.length });
      claimed.add(weak);
    }
  }

  return found.slice(0, 6);
}

export function getWeakWordSuggestion(word: string): string | undefined {
  return WEAK_WORDS[word.toLowerCase()];
}

function matchCase(source: string, replacement: string) {
  if (!source) return replacement;
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function findUpgradePositions(
  text: string,
  upgrades: VocabUpgrade[],
  fillerPositions: { start: number; end: number }[] = []
): { start: number; end: number; word: string; suggestion: string }[] {
  const positions: { start: number; end: number; word: string; suggestion: string }[] = [];
  const sorted = [...upgrades].sort((a, b) => b.original.length - a.original.length);

  for (const u of sorted) {
    const re = new RegExp(`\\b${escapeRe(u.original)}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = [...fillerPositions, ...positions].some((p) => start < p.end && end > p.start);
      if (!overlaps) {
        positions.push({ start, end, word: match[0], suggestion: u.suggestion });
      }
    }
  }

  return positions.sort((a, b) => a.start - b.start);
}

export function applyVocabUpgrades(text: string, upgrades: VocabUpgrade[]): string {
  let out = text;
  const sorted = [...upgrades].sort((a, b) => b.original.length - a.original.length);
  for (const u of sorted) {
    const re = new RegExp(`\\b${escapeRe(u.original)}\\b`, 'gi');
    out = out.replace(re, (match) => matchCase(match, u.suggestion));
  }
  return out;
}

export function stripFillerSpans(
  text: string,
  positions: { start: number; end: number }[]
): string {
  let out = text;
  const sorted = [...positions].sort((a, b) => b.start - a.start);
  for (const p of sorted) {
    const before = out.slice(0, p.start);
    const after = out.slice(p.end);
    const needsSpace = /\S$/.test(before) && /^\S/.test(after);
    out = `${before}${needsSpace ? ' ' : ''}${after}`;
  }
  return restoreTranscript(out.replace(/\s+/g, ' ').replace(/\s+([,.!?;:])/g, '$1'));
}

export function buildCleanTake(
  text: string,
  fillerPositions: { start: number; end: number }[],
  upgrades: VocabUpgrade[]
): string {
  const stripped = stripFillerSpans(text, fillerPositions);
  return applyVocabUpgrades(stripped, upgrades);
}

function sentenceStats(text: string, wordCount: number): { sentenceCount: number; avgWordsPerSentence: number } {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => tokenize(s).length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  return {
    sentenceCount,
    avgWordsPerSentence: Math.round(wordCount / sentenceCount),
  };
}

function estimatePauses(text: string, durationSec: number, wordCount: number): number {
  const sentenceBreaks = (text.match(/[.!?]+/g) ?? []).length;
  const ellipses = (text.match(/\.\.\./g) ?? []).length;
  const commas = (text.match(/,/g) ?? []).length;
  // Rough: expected continuous speech vs actual duration
  const expectedSec = wordCount / 2.5; // ~150 wpm baseline
  const surplus = Math.max(0, durationSec - expectedSec);
  return Math.round(sentenceBreaks + ellipses * 2 + commas * 0.15 + surplus / 2);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreDelivery(wpm: number, fillerCount: number, wordCount: number): number {
  const idealWpm = wpm >= 120 && wpm <= 160 ? 100 : wpm < 100 ? 60 + wpm / 3 : wpm > 180 ? 70 : 85;
  const fillerRate = wordCount > 0 ? fillerCount / wordCount : 0;
  const fillerScore = clamp(100 - fillerRate * 400, 20, 100);
  return Math.round(idealWpm * 0.45 + fillerScore * 0.55);
}

function scoreClarity(
  upgrades: VocabUpgrade[],
  repeated: RepeatedWord[],
  wordCount: number,
  avgWordsPerSentence: number
): number {
  const weakPenalty = upgrades.reduce((s, u) => s + u.count, 0) * 4;
  const repeatPenalty = repeated.reduce((s, r) => s + (r.count - 2) * 5, 0);
  const lengthBonus = wordCount >= 40 && wordCount <= 180 ? 10 : 0;
  const runOnPenalty = avgWordsPerSentence > 28 ? 8 : avgWordsPerSentence > 22 ? 4 : 0;
  return clamp(Math.round(88 - weakPenalty - repeatPenalty + lengthBonus - runOnPenalty), 25, 98);
}

function scoreConfidence(fillerCount: number, wpm: number, text: string): number {
  const hedges = (normalize(text).match(/\b(maybe|i guess|kind of|sort of|probably|i think)\b/g) ?? [])
    .length;
  const fillerPenalty = fillerCount * 3;
  const hedgePenalty = hedges * 4;
  const paceBonus = wpm >= 110 && wpm <= 165 ? 8 : 0;
  return clamp(Math.round(90 - fillerPenalty - hedgePenalty + paceBonus), 20, 98);
}

function scorePersuasiveness(text: string, wordCount: number): number {
  const lower = normalize(text);
  const hasStructure =
    /\b(first|second|finally|because|so|therefore|result|learned|impact)\b/.test(lower);
  const hasSpecifics = /\b(\d+|percent|%|weeks?|days?|minutes?|dollars?|people)\b/.test(lower);
  const hasAsk = /\b(should|need|must|will|let's|join|hire|invest)\b/.test(lower);
  let score = 55;
  if (hasStructure) score += 15;
  if (hasSpecifics) score += 15;
  if (hasAsk) score += 8;
  if (wordCount >= 50) score += 5;
  return clamp(score, 30, 96);
}

function scoreStorytelling(text: string): number {
  const lower = normalize(text);
  const hasScene = /\b(when|then|suddenly|moment|sitting|walking|remember)\b/.test(lower);
  const hasTurn = /\b(but|however|until|realized|changed|taught|learned)\b/.test(lower);
  const hasDetail = /\b(eye|voice|room|coffee|laptop|door|night|morning)\b/.test(lower);
  let score = 50;
  if (hasScene) score += 18;
  if (hasTurn) score += 18;
  if (hasDetail) score += 12;
  return clamp(score, 28, 96);
}

function buildCoaching(
  result: Omit<AnalysisResult, 'coaching' | 'xpEarned' | 'cleanTranscript'>
): CoachingCard {
  const { fillersFound, vocabUpgrades, scores, wpm, repeatedWords, avgWordsPerSentence, stutterCount } =
    result;

  const ums = fillersFound.filter((f) => f.word === 'um' || f.word === 'uh');
  const umCount = ums.reduce((s, f) => s + f.count, 0);
  const restart = fillersFound.find((f) => f.word.includes(' '));

  let strength = 'You showed up and completed the rep — consistency compounds.';
  if (scores.confidence >= 80) strength = 'Your delivery carried real confidence — keep that steady pace.';
  else if (scores.storytelling >= 75) strength = 'You built a narrative arc people can follow and feel.';
  else if (scores.clarity >= 80) strength = 'Your clarity was strong — ideas landed without fog.';
  else if (wpm >= 120 && wpm <= 160) strength = 'Your speaking pace sat in a persuasive sweet spot.';
  else if (fillersFound.length === 0) strength = 'Clean take — almost no filler words. That\'s rare.';

  let fix = 'Aim for one cleaner take with fewer soft openers.';
  if (ums[0] && umCount >= 2) {
    const label = ums.length > 1 ? 'um/uh' : ums[0].word;
    const n = umCount;
    fix = `Cut “${label}” — you used ${ums.length > 1 ? 'them' : 'it'} ${n}×. When you feel it coming, close your mouth and start the next sentence.`;
  } else if (fillersFound[0] && !fillersFound[0].word.includes(' ')) {
    fix = `Cut “${fillersFound[0].word}” — you used it ${fillersFound[0].count}×. Pause instead.`;
  } else if (stutterCount >= 2 && restart) {
    fix = `You restarted “${restart.word.split(' ')[0]}” ${stutterCount}×. Commit to the first try.`;
  } else if (avgWordsPerSentence > 28) {
    fix = `Sentences are running long (~${avgWordsPerSentence} words). Period. Then the next thought.`;
  } else if (vocabUpgrades[0]) {
    fix = `Swap “${vocabUpgrades[0].original}” for “${vocabUpgrades[0].suggestion}” once next round.`;
  } else if (wpm > 175) {
    fix = 'Slow down ~10%. Breath between sentences will add weight.';
  } else if (wpm < 100) {
    fix = 'Pick up the energy slightly — aim closer to 130 WPM.';
  } else if (repeatedWords[0]) {
    fix = `“${repeatedWords[0].word}” showed up ${repeatedWords[0].count}× — vary your language.`;
  }

  let rewriteTip = 'Open with the outcome, then rewind into the story.';
  if (umCount >= 2) {
    rewriteTip = 'Silence is a tool. Replace every um/uh with a beat of quiet — it reads as control.';
  } else if (vocabUpgrades[0]) {
    rewriteTip = `Try: replace “${vocabUpgrades[0].original}” → “${vocabUpgrades[0].suggestion}” and cut one filler.`;
  } else if (fillersFound[0]) {
    rewriteTip = 'Rewrite tip: start mid-thought — skip “um/so/basically” openers entirely.';
  } else if (avgWordsPerSentence > 24) {
    rewriteTip = 'One idea per sentence. If you hear yourself stacking “and…and…”, stop and start a new one.';
  } else if (scores.persuasiveness < 70) {
    rewriteTip = 'Add one concrete number or result before your closing line.';
  } else {
    rewriteTip = 'End with a crisp takeaway in one sentence — then stop.';
  }

  return { strength, fix, rewriteTip };
}

export function previewSpeech(transcript: string) {
  const text = transcript.trim();
  const words = tokenize(text);
  const fillersFound = findFillers(text);
  return {
    wordCount: words.length,
    fillerCount: fillersFound.reduce((s, f) => s + f.count, 0),
    fillersFound,
    fillerPositions: findFillerPositions(text),
  };
}

export function analyzeSpeech(
  transcript: string,
  durationSec: number,
  options?: { pauseCount?: number; paceSeries?: PacePoint[] }
): AnalysisResult {
  const text = transcript.trim();
  const words = tokenize(text);
  const wordCount = words.length;
  const safeDuration = Math.max(durationSec, 1);
  const wpm = Math.round((wordCount / safeDuration) * 60);

  const fillersFound = findFillers(text);
  const fillerCount = fillersFound.reduce((s, f) => s + f.count, 0);
  const fillerPositions = findFillerPositions(text);
  const repeatedWords = findRepeatedWords(words);
  const vocabUpgrades = findVocabUpgrades(text);
  const pauseEstimate =
    options?.pauseCount != null
      ? options.pauseCount
      : estimatePauses(text, safeDuration, wordCount);
  const { sentenceCount, avgWordsPerSentence } = sentenceStats(text, wordCount);
  const stutterCount = fillersFound
    .filter((f) => / /.test(f.word) && !['you know', 'i mean', 'kind of', 'sort of', 'okay so', 'so yeah', 'i guess'].includes(f.word))
    .reduce((s, f) => s + f.count, 0);

  const delivery = scoreDelivery(wpm, fillerCount, wordCount);
  const clarity = scoreClarity(vocabUpgrades, repeatedWords, wordCount, avgWordsPerSentence);
  const confidence = scoreConfidence(fillerCount, wpm, text);
  const persuasiveness = scorePersuasiveness(text, wordCount);
  const storytelling = scoreStorytelling(text);
  const overall = Math.round(
    delivery * 0.25 + clarity * 0.2 + confidence * 0.25 + persuasiveness * 0.15 + storytelling * 0.15
  );

  const paceSeries =
    options?.paceSeries && options.paceSeries.length >= 2
      ? options.paceSeries
      : synthesizePace(wordCount, safeDuration);

  const cleanTranscript = buildCleanTake(text, fillerPositions, vocabUpgrades);

  const partial = {
    wordCount,
    durationSec: safeDuration,
    wpm,
    paceSeries,
    fillerCount,
    fillersFound,
    fillerPositions,
    repeatedWords,
    vocabUpgrades,
    pauseEstimate,
    sentenceCount,
    avgWordsPerSentence,
    stutterCount,
    scores: { delivery, clarity, confidence, persuasiveness, storytelling, overall },
  };

  const coaching = buildCoaching(partial);

  // XP: base + bonuses
  let xp = 25;
  xp += Math.round(overall / 5);
  if (fillerCount === 0) xp += 15;
  if (wpm >= 120 && wpm <= 160) xp += 10;
  if (wordCount >= 40) xp += 5;

  return { ...partial, cleanTranscript, coaching, xpEarned: xp };
}
