import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AnalysisResult } from '@/lib/analysis';
import { localTodayKey, localYesterdayKey } from '@/lib/dates';
import type { Goal, Prompt } from '@/lib/prompts';
import { TOUR_SCREEN_RANK, TOUR_STEPS, tourStepAt, type TourScreen } from '@/lib/tour';

export type Session = {
  id: string;
  promptId: string;
  promptText: string;
  category: Goal;
  transcript: string;
  analysis: AnalysisResult;
  createdAt: string;
  prepMinutes: 0 | 2 | 5;
};

export type UserProfile = {
  name: string;
  goal: Goal;
  reminderHour: number;
  reminderMinute: number;
  habitStackId: string | null;
  enemyWord: string;
  onboardingComplete: boolean;
};

type PromptSnapshot = {
  promptId: string;
  promptText: string;
  category: Goal;
  prepMinutes: 0 | 2 | 5;
  maxSeconds?: number;
};

type ActivePractice = (PromptSnapshot & { notes: string }) | null;

export type FluencyChain = {
  promptId: string;
  promptText: string;
  category: Goal;
  round: number;
  durations: readonly number[];
};

type CadenceState = {
  profile: UserProfile;
  sessions: Session[];
  streak: number;
  longestStreak: number;
  xp: number;
  lastPracticeDate: string | null;
  activePractice: ActivePractice;
  lastPrompt: PromptSnapshot | null;
  lastAnalysis: AnalysisResult | null;
  lastTranscript: string;
  favoritePromptIds: string[];
  customPrompts: Prompt[];
  hydrated: boolean;
  tourStep: number;
  tourComplete: boolean;
  tourQuiet: boolean;
  tourPendingScreen: TourScreen | null;
  resultSaved: boolean;
  fluencyChain: FluencyChain | null;

  setHydrated: (v: boolean) => void;
  completeOnboarding: (data: {
    name: string;
    goal: Goal;
    reminderHour: number;
    reminderMinute: number;
  }) => void;
  startTour: () => void;
  advanceTour: () => void;
  skipTour: () => void;
  completeTourStep: (id: string) => void;
  quietTour: () => void;
  alignTourToScreen: (screen: TourScreen) => void;
  updateReminder: (hour: number, minute: number) => void;
  setHabitStack: (id: string | null) => void;
  setEnemyWord: (word: string) => void;
  updateGoal: (goal: Goal) => void;
  updateName: (name: string) => void;
  toggleFavorite: (id: string) => void;
  addCustomPrompt: (text: string, category: Goal) => Prompt;
  removeCustomPrompt: (id: string) => void;
  startPractice: (data: {
    promptId: string;
    promptText: string;
    category: Goal;
    prepMinutes: 0 | 2 | 5;
    maxSeconds?: number;
    keepFluency?: boolean;
  }) => void;
  beginFluencyChain: (data: {
    promptId: string;
    promptText: string;
    category: Goal;
  }) => void;
  advanceFluencyChain: () => boolean;
  clearFluencyChain: () => void;
  setNotes: (notes: string) => void;
  setLastResult: (transcript: string, analysis: AnalysisResult) => void;
  saveSession: () => Session | null;
  clearActive: () => void;
};

function computeStreak(lastDate: string | null, currentStreak: number, now = new Date()): number {
  const today = localTodayKey(now);
  if (!lastDate) return 1;
  if (lastDate === today) return Math.max(currentStreak, 1);
  if (lastDate === localYesterdayKey(now)) return currentStreak + 1;
  return 1;
}

const defaultProfile: UserProfile = {
  name: '',
  goal: 'daily',
  reminderHour: 9,
  reminderMinute: 0,
  habitStackId: null,
  enemyWord: 'um',
  onboardingComplete: false,
};

const CUSTOM_HINTS = ['Open with the outcome', 'One concrete detail', 'Close on a takeaway'];

export const useCadenceStore = create<CadenceState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      sessions: [],
      streak: 0,
      longestStreak: 0,
      xp: 0,
      lastPracticeDate: null,
      activePractice: null,
      lastPrompt: null,
      lastAnalysis: null,
      lastTranscript: '',
      favoritePromptIds: [],
      customPrompts: [],
      hydrated: false,
      tourStep: 0,
      tourComplete: false,
      tourQuiet: false,
      tourPendingScreen: null,
      resultSaved: false,
      fluencyChain: null,

      setHydrated: (v) => set({ hydrated: v }),

      completeOnboarding: ({ name, goal, reminderHour, reminderMinute }) =>
        set({
          profile: {
            ...get().profile,
            name: name.trim() || 'Speaker',
            goal,
            reminderHour,
            reminderMinute,
            onboardingComplete: true,
          },
          tourStep: 0,
          tourComplete: false,
          tourQuiet: false,
          tourPendingScreen: null,
        }),

      startTour: () =>
        set({ tourStep: 0, tourComplete: false, tourQuiet: false, tourPendingScreen: null }),

      advanceTour: () => {
        const { tourComplete, tourStep } = get();
        if (tourComplete) return;
        const current = tourStepAt(tourStep);
        const next = tourStep + 1;
        if (next >= TOUR_STEPS.length) {
          set({
            tourComplete: true,
            tourStep: TOUR_STEPS.length,
            tourQuiet: false,
            tourPendingScreen: null,
          });
          return;
        }
        const upcoming = tourStepAt(next);
        const pending =
          upcoming && upcoming.screen !== 'any' && upcoming.screen !== current?.screen
            ? upcoming.screen
            : null;
        set({ tourStep: next, tourQuiet: false, tourPendingScreen: pending });
      },

      skipTour: () => set({ tourComplete: true, tourQuiet: false, tourPendingScreen: null }),

      quietTour: () => set({ tourQuiet: true }),

      completeTourStep: (id) => {
        const { tourComplete, tourStep } = get();
        if (tourComplete) return;
        const current = tourStepAt(tourStep);
        if (current?.id !== id) return;
        const next = tourStep + 1;
        if (next >= TOUR_STEPS.length) {
          set({
            tourComplete: true,
            tourStep: TOUR_STEPS.length,
            tourQuiet: false,
            tourPendingScreen: null,
          });
          return;
        }
        const upcoming = tourStepAt(next);
        const pending =
          upcoming && upcoming.screen !== 'any' && upcoming.screen !== current.screen
            ? upcoming.screen
            : null;
        set({ tourStep: next, tourQuiet: false, tourPendingScreen: pending });
      },

      alignTourToScreen: (screen) => {
        const { tourComplete, tourStep, tourPendingScreen } = get();
        if (tourComplete) return;
        const step = tourStepAt(tourStep);
        if (!step) return;

        if (step.screen === screen || step.screen === 'any') {
          if (tourPendingScreen) set({ tourPendingScreen: null });
          return;
        }

        if (tourPendingScreen && screen === tourPendingScreen) {
          set({ tourPendingScreen: null, tourQuiet: false });
          return;
        }

        const sr = TOUR_SCREEN_RANK[screen] ?? -1;
        const tr = TOUR_SCREEN_RANK[step.screen] ?? 0;

        if (tourPendingScreen && sr >= 0 && sr === tr - 1) return;

        if (sr >= 0 && sr < tr) {
          const i = TOUR_STEPS.findIndex((s) => s.screen === screen);
          if (i >= 0) set({ tourStep: i, tourPendingScreen: null, tourQuiet: false });
        }
      },

      updateReminder: (hour, minute) =>
        set({
          profile: { ...get().profile, reminderHour: hour, reminderMinute: minute },
        }),

      setHabitStack: (id) =>
        set({ profile: { ...get().profile, habitStackId: id } }),

      setEnemyWord: (word) =>
        set({ profile: { ...get().profile, enemyWord: word } }),

      updateGoal: (goal) =>
        set({ profile: { ...get().profile, goal } }),

      updateName: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set({ profile: { ...get().profile, name: trimmed } });
      },

      toggleFavorite: (id) => {
        const ids = get().favoritePromptIds;
        set({
          favoritePromptIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
        });
      },

      addCustomPrompt: (text, category) => {
        const prompt: Prompt = {
          id: `custom-${Date.now()}`,
          text: text.trim(),
          category,
          hints: CUSTOM_HINTS,
        };
        set({ customPrompts: [prompt, ...get().customPrompts].slice(0, 50) });
        return prompt;
      },

      removeCustomPrompt: (id) =>
        set({
          customPrompts: get().customPrompts.filter((p) => p.id !== id),
          favoritePromptIds: get().favoritePromptIds.filter((x) => x !== id),
        }),

      startPractice: ({ promptId, promptText, category, prepMinutes, maxSeconds, keepFluency }) =>
        set({
          activePractice: { promptId, promptText, category, prepMinutes, maxSeconds, notes: '' },
          lastPrompt: { promptId, promptText, category, prepMinutes, maxSeconds },
          lastAnalysis: null,
          lastTranscript: '',
          fluencyChain: keepFluency ? get().fluencyChain : null,
        }),

      beginFluencyChain: ({ promptId, promptText, category }) =>
        set({
          fluencyChain: {
            promptId,
            promptText,
            category,
            round: 0,
            durations: [90, 60, 45],
          },
          activePractice: {
            promptId,
            promptText,
            category,
            prepMinutes: 0,
            maxSeconds: 90,
            notes: '',
          },
          lastPrompt: {
            promptId,
            promptText,
            category,
            prepMinutes: 0,
            maxSeconds: 90,
          },
          lastAnalysis: null,
          lastTranscript: '',
        }),

      advanceFluencyChain: () => {
        const chain = get().fluencyChain;
        if (!chain || chain.round >= chain.durations.length - 1) {
          set({ fluencyChain: null });
          return false;
        }
        const round = chain.round + 1;
        const maxSeconds = chain.durations[round];
        set({
          fluencyChain: { ...chain, round },
          activePractice: {
            promptId: chain.promptId,
            promptText: chain.promptText,
            category: chain.category,
            prepMinutes: 0,
            maxSeconds,
            notes: '',
          },
          lastPrompt: {
            promptId: chain.promptId,
            promptText: chain.promptText,
            category: chain.category,
            prepMinutes: 0,
            maxSeconds,
          },
          lastAnalysis: null,
          lastTranscript: '',
        });
        return true;
      },

      clearFluencyChain: () => set({ fluencyChain: null }),

      setNotes: (notes) => {
        const active = get().activePractice;
        if (!active) return;
        set({ activePractice: { ...active, notes } });
      },

      setLastResult: (transcript, analysis) =>
        set({ lastTranscript: transcript, lastAnalysis: analysis, resultSaved: false }),

      saveSession: () => {
        const {
          activePractice,
          lastPrompt,
          lastAnalysis,
          lastTranscript,
          sessions,
          streak,
          longestStreak,
          xp,
          lastPracticeDate,
        } = get();
        const practice = activePractice ?? (lastPrompt ? { ...lastPrompt, notes: '' } : null);
        if (!practice || !lastAnalysis) return null;

        const newStreak = computeStreak(lastPracticeDate, streak);
        const session: Session = {
          id: `s-${Date.now()}`,
          promptId: practice.promptId,
          promptText: practice.promptText,
          category: practice.category,
          transcript: lastTranscript,
          analysis: lastAnalysis,
          createdAt: new Date().toISOString(),
          prepMinutes: practice.prepMinutes,
        };

        set({
          sessions: [session, ...sessions].slice(0, 100),
          streak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          xp: xp + lastAnalysis.xpEarned,
          lastPracticeDate: localTodayKey(),
          activePractice: null,
          resultSaved: true,
        });

        return session;
      },

      clearActive: () => set({ activePractice: null, lastAnalysis: null, lastTranscript: '' }),
    }),
    {
      name: 'cadence-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        sessions: state.sessions,
        streak: state.streak,
        longestStreak: state.longestStreak,
        xp: state.xp,
        lastPracticeDate: state.lastPracticeDate,
        activePractice: state.activePractice,
        lastPrompt: state.lastPrompt,
        lastAnalysis: state.lastAnalysis,
        lastTranscript: state.lastTranscript,
        favoritePromptIds: state.favoritePromptIds,
        customPrompts: state.customPrompts,
        tourStep: state.tourStep,
        tourComplete: state.tourComplete,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
