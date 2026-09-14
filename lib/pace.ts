export type PacePoint = {
  t: number;
  words: number;
  wpm: number;
};

export function countSpokenWords(text: string): number {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}

export function wpmAt(words: number, elapsedSec: number): number {
  if (elapsedSec <= 0) return 0;
  return Math.round((words / elapsedSec) * 60);
}

/** Fake a Monkeytype-style curve when we only have a final transcript (demos / typed). */
export function synthesizePace(wordCount: number, durationSec: number): PacePoint[] {
  const n = Math.max(4, Math.min(Math.round(durationSec), 90));
  const target = wpmAt(wordCount, durationSec);
  const points: PacePoint[] = [];
  for (let t = 1; t <= n; t++) {
    const p = t / n;
    const rise = p < 0.18 ? (p / 0.18) * 0.72 : 0.72 + 0.28 * ((p - 0.18) / 0.82);
    const wobble = Math.sin(t * 1.55) * 11 + Math.sin(t * 0.37) * 7;
    const wpm = Math.max(0, Math.round(target * rise + wobble));
    points.push({ t, wpm, words: Math.round((wpm / 60) * t) });
  }
  if (points.length) {
    points[points.length - 1] = { t: n, wpm: target, words: wordCount };
  }
  return points;
}

export function paceSummary(points: PacePoint[]) {
  if (points.length === 0) {
    return { peak: 0, avg: 0, start: 0, end: 0 };
  }
  const peak = Math.max(...points.map((p) => p.wpm));
  const avg = Math.round(points.reduce((s, p) => s + p.wpm, 0) / points.length);
  return {
    peak,
    avg,
    start: points[0]?.wpm ?? 0,
    end: points[points.length - 1]?.wpm ?? 0,
  };
}
