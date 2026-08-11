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
  fillerCount: number;
  fillersFound: { word: string; count: number }[];
  fillerPositions: { start: number; end: number; word: string }[];
  repeatedWords: RepeatedWord[];
  vocabUpgrades: VocabUpgrade[];
  pauseEstimate: number;
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

const FILLERS = [
  'um',
  'uh',
  'uhm',
  'erm',
  'like',
  'you know',
  'i mean',
  'basically',
  'actually',
  'literally',
  'sort of',
  'kind of',
  'kinda',
  'sorta',
  'right',
  'okay so',
  'so yeah',
  'i guess',
];

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

function findFillers(text: string): { word: string; count: number }[] {
  const lower = normalize(text);
  const counts = new Map<string, number>();

  // Multi-word fillers first
  const multi = FILLERS.filter((f) => f.includes(' ')).sort((a, b) => b.length - a.length);
  let working = lower;
  for (const filler of multi) {
    const re = new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = working.match(re);
    if (matches?.length) {
      counts.set(filler, (counts.get(filler) ?? 0) + matches.length);
      working = working.replace(re, ' ');
    }
  }

  const single = FILLERS.filter((f) => !f.includes(' '));
  for (const filler of single) {
    // "like" as filler: avoid matching "like" as verb of preference when followed by "to" sometimes — keep simple for MVP
    const re = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = working.match(re);
    if (matches?.length) {
      counts.set(filler, (counts.get(filler) ?? 0) + matches.length);
    }
  }

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

function findFillerPositions(text: string): { start: number; end: number; word: string }[] {
  const positions: { start: number; end: number; word: string }[] = [];
  const sorted = [...FILLERS].sort((a, b) => b.length - a.length);

  for (const filler of sorted) {
    const re = new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const overlaps = positions.some(
        (p) => match!.index < p.end && match!.index + match![0].length > p.start
      );
      if (!overlaps) {
        positions.push({
          start: match.index,
          end: match.index + match[0].length,
          word: filler,
        });
      }
    }
  }

  return positions.sort((a, b) => a.start - b.start);
}

function findRepeatedWords(words: string[]): RepeatedWord[] {
  const counts = new Map<string, number>();
  for (const w of words) {
    const clean = w.replace(/['']/g, '');
    if (clean.length < 3 || STOP_WORDS.has(clean) || FILLERS.includes(clean)) continue;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c >= 3)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function findVocabUpgrades(text: string): VocabUpgrade[] {
  const lower = normalize(text);
  const found: VocabUpgrade[] = [];

  // Multi-word weak phrases first
  const entries = Object.entries(WEAK_WORDS).sort((a, b) => b[0].length - a[0].length);
  const claimed = new Set<string>();

  for (const [weak, suggestion] of entries) {
    if (claimed.has(weak)) continue;
    const re = new RegExp(`\\b${weak.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(re);
    if (matches?.length) {
      found.push({ original: weak, suggestion, count: matches.length });
      claimed.add(weak);
    }
  }

  return found.slice(0, 6);
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

function scoreClarity(upgrades: VocabUpgrade[], repeated: RepeatedWord[], wordCount: number): number {
  const weakPenalty = upgrades.reduce((s, u) => s + u.count, 0) * 4;
  const repeatPenalty = repeated.reduce((s, r) => s + (r.count - 2) * 5, 0);
  const lengthBonus = wordCount >= 40 && wordCount <= 180 ? 10 : 0;
  return clamp(Math.round(88 - weakPenalty - repeatPenalty + lengthBonus), 25, 98);
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
  result: Omit<AnalysisResult, 'coaching' | 'xpEarned'>
): CoachingCard {
  const { fillersFound, vocabUpgrades, scores, wpm, repeatedWords } = result;

  let strength = 'You showed up and completed the rep — consistency compounds.';
  if (scores.confidence >= 80) strength = 'Your delivery carried real confidence — keep that steady pace.';
  else if (scores.storytelling >= 75) strength = 'You built a narrative arc people can follow and feel.';
  else if (scores.clarity >= 80) strength = 'Your clarity was strong — ideas landed without fog.';
  else if (wpm >= 120 && wpm <= 160) strength = 'Your speaking pace sat in a persuasive sweet spot.';
  else if (fillersFound.length === 0) strength = 'Clean take — almost no filler words. That\'s rare.';

  let fix = 'Aim for one cleaner take with fewer soft openers.';
  if (fillersFound[0]) {
    fix = `Cut “${fillersFound[0].word}” — you used it ${fillersFound[0].count}×. Pause instead.`;
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
  if (vocabUpgrades[0]) {
    rewriteTip = `Try: replace “${vocabUpgrades[0].original}” → “${vocabUpgrades[0].suggestion}” and cut one filler.`;
  } else if (fillersFound[0]) {
    rewriteTip = `Rewrite tip: start mid-thought — skip “um/so/basically” openers entirely.`;
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
  options?: { pauseCount?: number }
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

  const delivery = scoreDelivery(wpm, fillerCount, wordCount);
  const clarity = scoreClarity(vocabUpgrades, repeatedWords, wordCount);
  const confidence = scoreConfidence(fillerCount, wpm, text);
  const persuasiveness = scorePersuasiveness(text, wordCount);
  const storytelling = scoreStorytelling(text);
  const overall = Math.round(
    delivery * 0.25 + clarity * 0.2 + confidence * 0.25 + persuasiveness * 0.15 + storytelling * 0.15
  );

  const partial = {
    wordCount,
    durationSec: safeDuration,
    wpm,
    fillerCount,
    fillersFound,
    fillerPositions,
    repeatedWords,
    vocabUpgrades,
    pauseEstimate,
    scores: { delivery, clarity, confidence, persuasiveness, storytelling, overall },
  };

  const coaching = buildCoaching(partial);

  // XP: base + bonuses
  let xp = 25;
  xp += Math.round(overall / 5);
  if (fillerCount === 0) xp += 15;
  if (wpm >= 120 && wpm <= 160) xp += 10;
  if (wordCount >= 40) xp += 5;

  return { ...partial, coaching, xpEarned: xp };
}
