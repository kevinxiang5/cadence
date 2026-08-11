export {};

declare global {
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onaudiostart: ((ev: Event) => void) | null;
    onaudioend: ((ev: Event) => void) | null;
    onend: ((ev: Event) => void) | null;
    onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
    onnomatch: ((ev: Event) => void) | null;
    onresult: ((ev: SpeechRecognitionEvent) => void) | null;
    onsoundstart: ((ev: Event) => void) | null;
    onsoundend: ((ev: Event) => void) | null;
    onspeechstart: ((ev: Event) => void) | null;
    onspeechend: ((ev: Event) => void) | null;
    onstart: ((ev: Event) => void) | null;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof webkitSpeechRecognition;
  }
}
