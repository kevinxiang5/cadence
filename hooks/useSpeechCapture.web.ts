import { useCallback, useEffect, useRef, useState } from 'react';

import { countSpokenWords, wpmAt, type PacePoint } from '@/lib/pace';
import {
  MAX_SPEAK_SECONDS,
  getWebSpeechRecognitionCtor,
  isSpeechRecognitionAvailable,
  joinTranscriptParts,
  requestMicAccess,
} from '@/lib/speech';
import { polishSpokenTranscript } from '@/lib/transcript';

export type CaptureStatus =
  | 'idle'
  | 'countdown'
  | 'listening'
  | 'stopping'
  | 'denied'
  | 'unsupported';

type Options = {
  maxSeconds?: number;
  onAutoStop?: (payload: {
    transcript: string;
    elapsed: number;
    pauses: number;
    paceSeries: PacePoint[];
  }) => void;
};

export function useSpeechCapture(options: Options = {}) {
  const maxSeconds = options.maxSeconds ?? MAX_SPEAK_SECONDS;
  const onAutoStopRef = useRef(options.onAutoStop);
  onAutoStopRef.current = options.onAutoStop;

  const [status, setStatus] = useState<CaptureStatus>(() =>
    isSpeechRecognitionAvailable() ? 'idle' : 'unsupported'
  );
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [pauses, setPauses] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wantListeningRef = useRef(false);
  const chunksRef = useRef<{ text: string; pauseBeforeMs: number }[]>([]);
  const finalsRef = useRef<string[]>([]);
  const interimRef = useRef('');
  const elapsedRef = useRef(0);
  const pausesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpeechEndRef = useRef<number | null>(null);
  const pendingPauseRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const paceRef = useRef<PacePoint[]>([]);
  const [paceSeries, setPaceSeries] = useState<PacePoint[]>([]);

  const assembled = (complete: boolean) =>
    polishSpokenTranscript('', chunksRef.current, { complete });

  const flushTranscript = () => {
    const interim = interimRef.current.trim();
    if (interim) {
      chunksRef.current = [
        ...chunksRef.current,
        { text: interim, pauseBeforeMs: pendingPauseRef.current },
      ];
      pendingPauseRef.current = 0;
      interimRef.current = '';
    }
    const transcript = assembled(true);
    finalsRef.current = chunksRef.current.map((c) => c.text);
    setFinalText(transcript);
    setInterimText('');
    return transcript;
  };

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const stopEngine = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    rec.onspeechstart = null;
    rec.onspeechend = null;
    try {
      rec.stop();
    } catch {
      try {
        rec.abort();
      } catch {
        // ignore
      }
    }
  }, []);

  const startEngine = useCallback(() => {
    const Ctor = getWebSpeechRecognitionCtor();
    if (!Ctor) throw new Error('unsupported');

    stopEngine();
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 3;

    rec.onresult = (event) => {
      let interim = '';
      const newlyFinal: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = result[0]?.transcript ?? '';
        if (result.isFinal) {
          const trimmed = chunk.trim();
          if (trimmed) {
            chunksRef.current = [
              ...chunksRef.current,
              { text: trimmed, pauseBeforeMs: pendingPauseRef.current },
            ];
            pendingPauseRef.current = 0;
            newlyFinal.push(trimmed);
          }
        } else {
          interim += chunk;
        }
      }
      if (newlyFinal.length) {
        finalsRef.current = chunksRef.current.map((c) => c.text);
        setFinalText(assembled(false));
      }
      interimRef.current = interim;
      setInterimText(interim);
    };

    rec.onspeechend = () => {
      lastSpeechEndRef.current = Date.now();
    };

    rec.onspeechstart = () => {
      if (lastSpeechEndRef.current) {
        const gap = Date.now() - lastSpeechEndRef.current;
        pendingPauseRef.current = Math.max(pendingPauseRef.current, gap);
        if (gap >= 700) {
          pausesRef.current += 1;
          setPauses(pausesRef.current);
        }
      }
    };

    rec.onerror = (event) => {
      if (
        event.error === 'no-speech' ||
        event.error === 'aborted' ||
        event.error === 'audio-capture'
      ) {
        return;
      }
      if (event.error === 'not-allowed') {
        wantListeningRef.current = false;
        clearTimers();
        stopEngine();
        setStatus('denied');
        setErrorMessage('Microphone permission was denied.');
      }
    };

    rec.onend = () => {
      if (!wantListeningRef.current) {
        setStatus('idle');
        return;
      }
      if (elapsedRef.current >= maxSeconds) {
        return;
      }
      restartTimerRef.current = setTimeout(() => {
        if (!wantListeningRef.current) return;
        try {
          startEngine();
        } catch {
          // ignore restart failure
        }
      }, 180);
    };

    recognitionRef.current = rec;
    rec.start();
    setStatus('listening');
  }, [clearTimers, maxSeconds, stopEngine]);

  const stopInternal = useCallback(
    (emitAutoStop: boolean) => {
      wantListeningRef.current = false;
      clearTimers();
      stopEngine();
      setStatus('idle');
      const transcript = flushTranscript();
      const result = {
        transcript,
        elapsed: Math.max(elapsedRef.current, 1),
        pauses: pausesRef.current,
        paceSeries: [...paceRef.current],
      };
      if (emitAutoStop) onAutoStopRef.current?.(result);
      return result;
    },
    [clearTimers, stopEngine]
  );

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      clearTimers();
      stopEngine();
    };
  }, [clearTimers, stopEngine]);

  const beginListening = useCallback(async () => {
    setErrorMessage(null);
    const access = await requestMicAccess();
    if (!access.ok) {
      setStatus(access.reason === 'unsupported' ? 'unsupported' : 'denied');
      setErrorMessage(
        access.reason === 'unsupported'
          ? 'Live speech works in Chrome or Edge. Use a demo or type below.'
          : 'Allow the microphone to speak live — or use a demo sample.'
      );
      return false;
    }

    chunksRef.current = [];
    finalsRef.current = [];
    interimRef.current = '';
    elapsedRef.current = 0;
    pausesRef.current = 0;
    lastSpeechEndRef.current = null;
    pendingPauseRef.current = 0;
    paceRef.current = [];
    setPaceSeries([]);
    setFinalText('');
    setInterimText('');
    setElapsed(0);
    setPauses(0);
    wantListeningRef.current = true;
    setStatus('listening');

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      const spoken = countSpokenWords(
        joinTranscriptParts([...finalsRef.current, interimRef.current])
      );
      const point: PacePoint = {
        t: elapsedRef.current,
        words: spoken,
        wpm: wpmAt(spoken, elapsedRef.current),
      };
      paceRef.current = [...paceRef.current, point];
      setPaceSeries(paceRef.current);
      if (elapsedRef.current >= maxSeconds) {
        stopInternal(true);
      }
    }, 1000);

    try {
      startEngine();
      return true;
    } catch {
      wantListeningRef.current = false;
      clearTimers();
      setStatus('unsupported');
      setErrorMessage('Could not start speech recognition in this browser. Use Chrome or Edge.');
      return false;
    }
  }, [clearTimers, maxSeconds, startEngine, stopInternal]);

  const startWithCountdown = useCallback(async () => {
    if (!isSpeechRecognitionAvailable()) {
      setStatus('unsupported');
      setErrorMessage('Live speech works in Chrome or Edge. Use a demo or type below.');
      return;
    }

    setErrorMessage(null);
    setStatus('countdown');
    setCountdown(3);

    let n = 3;
    countdownRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        void beginListening();
        return;
      }
      setCountdown(n);
    }, 1000);
  }, [beginListening]);

  const stop = useCallback(() => {
    return stopInternal(false);
  }, [stopInternal]);

  const resetTranscript = useCallback(() => {
    chunksRef.current = [];
    finalsRef.current = [];
    interimRef.current = '';
    setFinalText('');
    setInterimText('');
    setElapsed(0);
    setPauses(0);
    elapsedRef.current = 0;
    pausesRef.current = 0;
    pendingPauseRef.current = 0;
  }, []);

  const transcript = joinTranscriptParts([finalText, interimText]);

  return {
    status,
    countdown,
    elapsed,
    pauses,
    finalText,
    interimText,
    transcript,
    paceSeries,
    errorMessage,
    supported: status !== 'unsupported' && isSpeechRecognitionAvailable(),
    startWithCountdown,
    stop,
    resetTranscript,
    setTranscriptOverride: (text: string) => {
      chunksRef.current = text ? [{ text, pauseBeforeMs: 0 }] : [];
      finalsRef.current = text ? [text] : [];
      interimRef.current = '';
      setFinalText(text);
      setInterimText('');
    },
  };
}
