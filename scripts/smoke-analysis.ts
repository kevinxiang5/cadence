/**
 * Quick sanity check for the local analysis engine.
 * Run: npx tsx scripts/smoke-analysis.ts
 */
import { analyzeSpeech } from '../lib/analysis';
import { SAMPLE_ANSWERS } from '../lib/samples';

for (const sample of SAMPLE_ANSWERS) {
  const result = analyzeSpeech(sample.transcript, sample.durationSec);
  console.log(`\n=== ${sample.label} ===`);
  console.log(`WPM: ${result.wpm} | Fillers: ${result.fillerCount} | Overall: ${result.scores.overall}`);
  console.log(`Fillers found:`, result.fillersFound.map((f) => `${f.word}×${f.count}`).join(', ') || 'none');
  console.log(
    `Upgrades:`,
    result.vocabUpgrades.map((u) => `${u.original}→${u.suggestion}`).join(', ') || 'none'
  );
  console.log(`Fix: ${result.coaching.fix}`);
}

const messy = analyzeSpeech(SAMPLE_ANSWERS[0].transcript, SAMPLE_ANSWERS[0].durationSec);
if (messy.fillerCount < 5) {
  console.error('\nFAIL: messy sample should have many fillers');
  process.exit(1);
}
if (messy.vocabUpgrades.length < 1) {
  console.error('\nFAIL: messy sample should suggest vocab upgrades');
  process.exit(1);
}
console.log('\n✓ Analysis smoke check passed');
