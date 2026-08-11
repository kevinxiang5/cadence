import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';

import {
  MAX_SPEAK_SECONDS,
  abortSpeechEngine,
  isSpeechRecognitionAvailable,
  joinTranscriptParts,
  requestMicAccess,
  startSpeechEngine,
  stopSpeechEngine,
} from '@/lib/speech';

export type CaptureStatus =
  | 'idle'
  | 'countdown'
  | 'listening'
  | 'stopping'
  | 'denied'
  | 'unsupported';

type Options = {
  maxSeconds?: number;
  onAutoStop?: (payload: { transcript: string; elapsed: number; pauses: number }) => void;
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
  const finalsRef = useRef<string[]>([]);
  const interimRef = useRef('');
  const elapsedRef = useRef(0);
  const pausesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpeechEndRef = useRef<number | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushTranscript = () => {
    const interim = interimRef.current.trim();
    if (interim) {
      finalsRef.current = [...finalsRef.current, interim];
      interimRef.current = '';
      setFinalText(joinTranscriptParts(finalsRef.current));
      setInterimText('');
    }
    return joinTranscriptParts(finalsRef.current);
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

  const stopInternal = useCallback(
    (emitAutoStop: boolean) => {
      wantListeningRef.current = false;
      clearTimers();
      stopSpeechEngine();
      setStatus('idle');
      const transcript = flushTranscript();
      const result = {
        transcript,
        elapsed: Math.max(elapsedRef.current, 1),
        pauses: pausesRef.current,
      };
      if (emitAutoStop) onAutoStopRef.current?.(result);
      return result;
    },
    [clearTimers]
  );

  useSpeechRecognitionEvent('start', () => {
    if (wantListeningRef.current) setStatus('listening');
  });

  useSpeechRecognitionEvent('end', () => {
    if (!wantListeningRef.current) {
      setStatus('idle');
      return;
    }
    if (elapsedRef.current >= maxSeconds) {
      stopInternal(true);
      return;
    }
    restartTimerRef.current = setTimeout(() => {
      if (!wantListeningRef.current) return;
      try {
        startSpeechEngine();
      } catch {
        // ignore restart failure
      }
    }, 180);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const chunk = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      const trimmed = chunk.trim();
      if (trimmed) finalsRef.current = [...finalsRef.current, trimmed];
      interimRef.current = '';
      setFinalText(joinTranscriptParts(finalsRef.current));
      setInterimText('');
    } else {
      interimRef.current = chunk;
      setInterimText(chunk);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (
      event.error === 'no-speech' ||
      event.error === 'speech-timeout' ||
      event.error === 'aborted' ||
      event.error === 'busy'
    ) {
      return;
    }
    if (event.error === 'not-allowed') {
      wantListeningRef.current = false;
      clearTimers();
      abortSpeechEngine();
      setStatus('denied');
      setErrorMessage('Microphone permission was denied.');
      return;
    }
    setErrorMessage(event.message || event.error);
  });

  useSpeechRecognitionEvent('speechend', () => {
    lastSpeechEndRef.current = Date.now();
  });

  useSpeechRecognitionEvent('speechstart', () => {
    if (lastSpeechEndRef.current) {
      const gap = Date.now() - lastSpeechEndRef.current;
      if (gap >= 700) {
        pausesRef.current += 1;
        setPauses(pausesRef.current);
      }
    }
  });

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      clearTimers();
      abortSpeechEngine();
    };
  }, [clearTimers]);

  const beginListening = useCallback(async () => {
    setErrorMessage(null);
    const access = await requestMicAccess();
    if (!access.ok) {
      setStatus(access.reason === 'unsupported' ? 'unsupported' : 'denied');
      setErrorMessage(
        access.reason === 'unsupported'
          ? 'Live speech works in Chrome, Edge, or Safari. Use a demo or type below.'
          : 'Allow the microphone to speak live — or use a demo sample.'
      );
      return false;
    }

    finalsRef.current = [];
    interimRef.current = '';
    elapsedRef.current = 0;
    pausesRef.current = 0;
    lastSpeechEndRef.current = null;
    setFinalText('');
    setInterimText('');
    setElapsed(0);
    setPauses(0);
    wantListeningRef.current = true;
    setStatus('listening');

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= maxSeconds) {
        stopInternal(true);
      }
    }, 1000);

    try {
      startSpeechEngine();
      return true;
    } catch {
      wantListeningRef.current = false;
      clearTimers();
      setStatus('unsupported');
      setErrorMessage('Could not start speech recognition in this browser.');
      return false;
    }
  }, [clearTimers, maxSeconds, stopInternal]);

  const startWithCountdown = useCallback(async () => {
    if (!isSpeechRecognitionAvailable()) {
      setStatus('unsupported');
      setErrorMessage('Live speech works in Chrome, Edge, or Safari. Use a demo or type below.');
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
    finalsRef.current = [];
    interimRef.current = '';
    setFinalText('');
    setInterimText('');
    setElapsed(0);
    setPauses(0);
    elapsedRef.current = 0;
    pausesRef.current = 0;
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
    errorMessage,
    supported: status !== 'unsupported' && isSpeechRecognitionAvailable(),
    startWithCountdown,
    stop,
    resetTranscript,
    setTranscriptOverride: (text: string) => {
      finalsRef.current = text ? [text] : [];
      interimRef.current = '';
      setFinalText(text);
      setInterimText('');
    },
  };
}
