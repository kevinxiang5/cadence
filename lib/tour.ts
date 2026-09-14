export type TourScreen = 'today' | 'record' | 'results' | 'stats' | 'any' | 'other';

export type TourStep = {
  id: string;
  screen: TourScreen;
  targetId: string | null;
  title: string;
  body: string;
  cta: string;
  /** If true, the user must tap the highlighted control — dimmer won't skip ahead. */
  lock?: boolean;
  /** Round the spotlight (mic). */
  circle?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'today-prompt',
    screen: 'today',
    targetId: 'today-prompt',
    title: 'Today’s prompt',
    body: 'Speak this out loud.',
    cta: 'Next',
  },
  {
    id: 'today-speak',
    screen: 'today',
    targetId: 'today-speak',
    title: 'Start here',
    body: 'Tap Speak now.',
    cta: 'Got it',
    lock: true,
  },
  {
    id: 'record-mic',
    screen: 'record',
    targetId: 'record-mic',
    title: 'Record',
    body: 'Tap, talk, tap again.',
    cta: 'Got it',
    lock: true,
    circle: true,
  },
  {
    id: 'results-score',
    screen: 'results',
    targetId: 'results-score',
    title: 'Your score',
    body: 'Pace, fillers, one fix.',
    cta: 'Next',
  },
  {
    id: 'results-save',
    screen: 'results',
    targetId: 'results-save',
    title: 'Save it',
    body: 'Starts your streak.',
    cta: 'Got it',
    lock: true,
  },
  {
    id: 'stats-overview',
    screen: 'stats',
    targetId: 'stats-overview',
    title: 'Your stats',
    body: 'Come back after each take.',
    cta: 'Next',
  },
  {
    id: 'wrap-up',
    screen: 'any',
    targetId: null,
    title: 'That’s it',
    body: 'Today · Coach · Library',
    cta: 'Let’s go',
  },
];

export const TOUR_SCREEN_RANK: Record<TourScreen, number> = {
  other: -1,
  today: 0,
  record: 1,
  results: 2,
  stats: 3,
  any: 4,
};

export function tourStepAt(index: number): TourStep | null {
  if (index < 0 || index >= TOUR_STEPS.length) return null;
  return TOUR_STEPS[index] ?? null;
}

export function hrefForTourStep(step: TourStep): '/(tabs)' | '/record' | '/results' | '/(tabs)/stats' {
  if (step.screen === 'record') return '/record';
  if (step.screen === 'results') return '/results';
  if (step.screen === 'stats' || step.screen === 'any') return '/(tabs)/stats';
  return '/(tabs)';
}

export function tourScreenFromSegments(segments: string[]): TourScreen {
  const leaf = segments[segments.length - 1] ?? '';
  if (leaf === 'record') return 'record';
  if (leaf === 'results') return 'results';
  if (leaf === 'stats') return 'stats';
  if (
    leaf === 'routine' ||
    leaf === 'library' ||
    leaf === 'onboarding' ||
    leaf === 'prep' ||
    leaf === 'compose' ||
    leaf === 'privacy'
  ) {
    return 'other';
  }
  return 'today';
}
