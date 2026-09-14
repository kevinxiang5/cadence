/**
 * Quick sanity check for the local analysis engine.
 * Run: npx tsx scripts/smoke-analysis.ts
 */
import { analyzeSpeech, previewSpeech } from '../lib/analysis';
import { SAMPLE_ANSWERS } from '../lib/samples';
import {
  enrichRecognitionChunk,
  mergeFillersFromAlternatives,
  restoreTranscript,
} from '../lib/transcript';

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

for (const sample of SAMPLE_ANSWERS) {
  const result = analyzeSpeech(restoreTranscript(sample.transcript), sample.durationSec);
  console.log(`\n=== ${sample.label} ===`);
  console.log(`WPM: ${result.wpm} | Fillers: ${result.fillerCount} | Overall: ${result.scores.overall}`);
  console.log(`Sentences: ${result.sentenceCount} (~${result.avgWordsPerSentence} words)`);
  console.log(`Fillers found:`, result.fillersFound.map((f) => `${f.word}×${f.count}`).join(', ') || 'none');
  console.log(
    `Upgrades:`,
    result.vocabUpgrades.map((u) => `${u.original}→${u.suggestion}`).join(', ') || 'none'
  );
  console.log(`Fix: ${result.coaching.fix}`);
  if (result.cleanTranscript !== restoreTranscript(sample.transcript)) {
    console.log(`Cleaner: ${result.cleanTranscript.slice(0, 140)}…`);
  }
}

const messy = analyzeSpeech(SAMPLE_ANSWERS[0].transcript, SAMPLE_ANSWERS[0].durationSec);
assert(messy.fillerCount >= 5, 'messy sample should have many fillers');
assert(messy.vocabUpgrades.length >= 1, 'messy sample should suggest vocab upgrades');

const asr = previewSpeech(
  "a I think we should umm go with the first option because uhh it is a good plan and a we can start next week"
);
const asrWords = asr.fillersFound.map((f) => f.word);
console.log('\n=== ASR quirks ===', asr.fillersFound);
assert(asrWords.includes('um'), 'umm should count as um');
assert(asrWords.includes('uh'), 'uhh and “a I” / “a we” should count as uh');
assert(asr.fillerCount >= 4, `expected >=4 ASR fillers, got ${asr.fillerCount}`);

const verbLike = previewSpeech('I like this job and people like you make it work.');
assert(
  !verbLike.fillersFound.some((f) => f.word === 'like'),
  'verb “like” should not count as a filler'
);

const hedgeLike = previewSpeech('I think like the main thing is we ship.');
assert(
  hedgeLike.fillersFound.some((f) => f.word === 'like'),
  'hedge “think like” should count as a filler'
);

const stutter = previewSpeech('I I need the the team to move.');
assert(stutter.fillerCount >= 2, 'stuttered I/the should be caught');

const restored = restoreTranscript(
  'a I think we should go with the first option because it is a good plan but we can start next week'
);
assert(/[.!?]/.test(restored), 'unpunctuated speech should get periods');
assert(/^Uh I think/.test(restored), `leading “a I” should become Uh, got: ${restored}`);
console.log('\nRestored:', restored);

const merged = mergeFillersFromAlternatives(
  'I think we should go',
  ['I um think we should go', 'I think we should uh go']
);
assert(/\bum\b/i.test(merged), `alternatives should splice um into primary, got: ${merged}`);

const fromGaps = enrichRecognitionChunk('I think we should go', [], [
  { segment: 'I', startTimeMillis: 0, endTimeMillis: 200 },
  { segment: 'think', startTimeMillis: 720, endTimeMillis: 980 },
  { segment: 'we', startTimeMillis: 1100, endTimeMillis: 1300 },
  { segment: 'should', startTimeMillis: 1400, endTimeMillis: 1700 },
  { segment: 'go', startTimeMillis: 1800, endTimeMillis: 2000 },
]);
assert(/\bum\b/i.test(fromGaps), `segment gap should insert um, got: ${fromGaps}`);

const solid = analyzeSpeech(SAMPLE_ANSWERS[1].transcript, SAMPLE_ANSWERS[1].durationSec);
assert(solid.fillerCount === 0, 'solid sample should be clean of fillers');
assert(solid.sentenceCount >= 3, 'solid sample should have multiple sentences');

console.log('\n✓ Analysis smoke check passed');
