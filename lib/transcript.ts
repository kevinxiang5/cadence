export type RecognitionSegment = {
  segment: string;
  startTimeMillis: number;
  endTimeMillis: number;
};

const HESITATION_TOKEN = /^(?:um+|uhm+|uh+m+|uh+|uhh+|ah+|er+|erm|hmm+|mm+|hum+)$/i;

const FILLER_IN_ALT = /\b(?:um+|uhm+|uh+m+|uh+|uhh+|ah+|er+|erm|hum+)\b/gi;

/** Apple often writes a hesitation as a lone "a" / "oh" / "eh" before a pronoun. */
export function looksLikeHesitationToken(token: string): boolean {
  const t = token.replace(/[^\w']/g, '');
  return HESITATION_TOKEN.test(t);
}

function normWord(token: string): string {
  return token.toLowerCase().replace(/[^\w']/g, '');
}

function canonicalHesitation(token: string): string {
  const t = token.toLowerCase().replace(/[^\w]/g, '');
  if (/^(uh+|ah+|er+|erm)/.test(t)) return 'uh';
  if (/^(hm+|mm+)/.test(t)) return 'hmm';
  return 'um';
}

function tokenizeWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * If an alternative hypothesis contains um/uh that the primary dropped,
 * splice those hesitations into the primary at the aligned position.
 */
export function mergeFillersFromAlternatives(primary: string, alternatives: string[]): string {
  const base = primary.trim();
  if (!base || alternatives.length === 0) return base;

  let best = base;
  let bestFillers = countAltFillers(base);

  for (const alt of alternatives) {
    if (!alt?.trim()) continue;
    if (countAltFillers(alt) <= bestFillers) continue;
    const merged = spliceHesitations(base, alt);
    const n = countAltFillers(merged);
    if (n > bestFillers) {
      best = merged;
      bestFillers = n;
    }
  }
  return best;
}

function countAltFillers(text: string): number {
  return text.match(FILLER_IN_ALT)?.length ?? 0;
}

function spliceHesitations(primary: string, alt: string): string {
  const p = tokenizeWords(primary);
  const a = tokenizeWords(alt);
  const out: string[] = [];
  let i = 0;
  let j = 0;

  while (i < p.length || j < a.length) {
    if (j < a.length && looksLikeHesitationToken(a[j])) {
      if (i >= p.length || !looksLikeHesitationToken(p[i])) {
        out.push(canonicalHesitation(a[j]));
        j += 1;
        continue;
      }
    }

    if (i < p.length && j < a.length && normWord(p[i]) === normWord(a[j])) {
      out.push(p[i]);
      i += 1;
      j += 1;
      continue;
    }

    if (i < p.length) {
      out.push(p[i]);
      i += 1;
      if (j < a.length && !looksLikeHesitationToken(a[j])) j += 1;
    } else {
      j += 1;
    }
  }

  return out.join(' ');
}

/**
 * Gaps of ~0.3–0.7s between words are usually a swallowed um/uh.
 * Longer gaps are thought pauses — those become periods, not fillers.
 */
export function insertHesitationsFromSegments(
  text: string,
  segments: RecognitionSegment[] | undefined
): string {
  if (!segments || segments.length < 2) return text.trim();

  const ordered = [...segments]
    .filter((s) => s.segment.trim())
    .sort((a, b) => a.startTimeMillis - b.startTimeMillis);

  if (ordered.length < 2) return text.trim();

  const parts: string[] = [];
  for (let i = 0; i < ordered.length; i += 1) {
    const piece = ordered[i].segment.trim();
    if (i > 0) {
      const gap = ordered[i].startTimeMillis - ordered[i - 1].endTimeMillis;
      const prev = ordered[i - 1].segment.trim();
      if (
        gap >= 320 &&
        gap < 720 &&
        !/[.!?]$/.test(prev) &&
        !looksLikeHesitationToken(prev) &&
        !looksLikeHesitationToken(piece)
      ) {
        parts.push('um');
      }
    }
    parts.push(piece);
  }

  const rebuilt = parts.join(' ').replace(/\s+/g, ' ').trim();
  return rebuilt || text.trim();
}

export function enrichRecognitionChunk(
  transcript: string,
  alternatives: string[] = [],
  segments?: RecognitionSegment[]
): string {
  const withAlts = mergeFillersFromAlternatives(transcript, alternatives);
  return insertHesitationsFromSegments(withAlts, segments);
}

/** Join chunks, turning a real pause into a period when ASR skipped punctuation. */
export function joinWithPauses(
  chunks: { text: string; pauseBeforeMs?: number }[]
): string {
  let out = '';
  for (const chunk of chunks) {
    const next = chunk.text.trim();
    if (!next) continue;
    if (!out) {
      out = next;
      continue;
    }
    const pause = chunk.pauseBeforeMs ?? 0;
    if (pause >= 700 && !/[.!?]$/.test(out) && !/^[.!?,]/.test(next)) {
      out = `${out}. ${next}`;
    } else {
      out = `${out} ${next}`;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

const CLAUSE_BREAK = /^(but|so|then|anyway|also)$/i;
const QUESTION_START =
  /^(who|what|when|where|why|how|is|are|do|does|did|can|could|would|should|will|am)\b/i;

export function canonicalizeHesitations(text: string): string {
  return text
    .replace(/\b(?:um+|uhm+|uh+m+|hum+)\b/gi, 'um')
    .replace(/\b(?:uhh+|ahh+|er+|erm|eh+)\b/gi, 'uh')
    .replace(
      /(^|[\s,])(?:a|oh)(?=\s+(?:I|I'm|I've|I'd|I'll|we|we're|you|they|he|she|it|so|like|um|uh)\b)/gi,
      '$1uh'
    );
}

/**
 * Capitalize, fix "i", add missing periods from clause breaks,
 * and end with a sentence mark when the recognizer returned a wall of words.
 */
export function restoreTranscript(text: string, opts?: { complete?: boolean }): string {
  let t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '';

  t = canonicalizeHesitations(t);
  t = t.replace(/\s+([,.!?;:])/g, '$1');
  t = t.replace(/([.!?])([^\s])/g, '$1 $2');
  t = splitUnpunctuated(t);
  t = t.replace(/\bi\b/g, 'I');
  t = t.replace(/\bi'(m|ve|d|ll|re)\b/gi, (_m, x: string) => `I'${x.toLowerCase()}`);

  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_m, left: string, c: string) => left + c.toUpperCase());

  t = t
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      const s = sentence.trim();
      if (!s) return s;
      if (/[?]$/.test(s) || !QUESTION_START.test(s)) return s;
      if (/[.!]$/.test(s)) return `${s.slice(0, -1)}?`;
      return `${s}?`;
    })
    .join(' ');

  if (opts?.complete !== false && t.length > 28 && !/[.!?]$/.test(t)) t += '.';
  return t;
}

function splitUnpunctuated(text: string): string {
  if (/[.!?]/.test(text)) return text;
  const words = text.split(/\s+/);
  if (words.length < 16) return text;

  let since = 0;
  const out: string[] = [];
  for (const w of words) {
    const raw = w.replace(/[^\w']/g, '');
    if (since >= 10 && CLAUSE_BREAK.test(raw) && out.length) {
      const prev = out[out.length - 1];
      if (!/[.!?]$/.test(prev)) {
        out[out.length - 1] = prev.replace(/[,;:]+$/, '') + '.';
      }
      out.push(w.charAt(0).toUpperCase() + w.slice(1));
      since = 1;
    } else {
      out.push(w);
      since += 1;
    }
  }
  return out.join(' ');
}

export function polishSpokenTranscript(
  text: string,
  chunks?: { text: string; pauseBeforeMs?: number }[],
  opts?: { complete?: boolean }
): string {
  const joined = chunks?.length ? joinWithPauses(chunks) : text;
  return restoreTranscript(joined, opts);
}
