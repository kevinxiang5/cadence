import { Platform } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export const MAX_SPEAK_SECONDS = 90;

export function isSpeechRecognitionAvailable(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export async function requestMicAccess(): Promise<{ ok: boolean; reason?: 'denied' | 'unsupported' }> {
  if (!isSpeechRecognitionAvailable()) {
    return { ok: false, reason: 'unsupported' };
  }

  if (Platform.OS === 'web') {
    try {
      const nav = globalThis.navigator as Navigator | undefined;
      if (!nav?.mediaDevices?.getUserMedia) {
        return { ok: true };
      }
      const stream = await nav.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return { ok: true };
    } catch {
      return { ok: false, reason: 'denied' };
    }
  }

  try {
    const mic = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!mic.granted) return { ok: false, reason: 'denied' };

    if (Platform.OS === 'ios') {
      const speech = await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();
      if (!speech.granted) return { ok: false, reason: 'denied' };
    } else {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return { ok: false, reason: 'denied' };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'unsupported' };
  }
}

export function startSpeechEngine() {
  try {
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      maxAlternatives: 1,
      addsPunctuation: true,
      contextualStrings: [
        'um',
        'uh',
        'like',
        'basically',
        'you know',
        'I mean',
        'actually',
        'literally',
        'kind of',
        'sort of',
      ],
      volumeChangeEventOptions: {
        enabled: Platform.OS !== 'web',
        intervalMillis: 120,
      },
    });
  } catch (error) {
    console.warn('Speech engine failed to start', error);
    throw error;
  }
}

export function stopSpeechEngine() {
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {
    // ignore
  }
}

export function abortSpeechEngine() {
  try {
    ExpoSpeechRecognitionModule.abort();
  } catch {
    // ignore
  }
}

export function joinTranscriptParts(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function estimateDurationFromWords(wordCount: number): number {
  if (wordCount <= 0) return 1;
  return Math.max(1, Math.round((wordCount / 140) * 60));
}
