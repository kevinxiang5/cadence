import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AnalysisResult } from '@/lib/analysis';
import { localTodayKey, localYesterdayKey } from '@/lib/dates';
import type { Goal } from '@/lib/prompts';

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
};

type ActivePractice = (PromptSnapshot & { notes: string }) | null;

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
  hydrated: boolean;

  setHydrated: (v: boolean) => void;
  completeOnboarding: (data: {
    name: string;
    goal: Goal;
    reminderHour: number;
    reminderMinute: number;
  }) => void;
  updateReminder: (hour: number, minute: number) => void;
  setHabitStack: (id: string | null) => void;
  setEnemyWord: (word: string) => void;
  updateGoal: (goal: Goal) => void;
  startPractice: (data: {
    promptId: string;
    promptText: string;
    category: Goal;
    prepMinutes: 0 | 2 | 5;
  }) => void;
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
      hydrated: false,

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
        }),

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

      startPractice: ({ promptId, promptText, category, prepMinutes }) =>
        set({
          activePractice: { promptId, promptText, category, prepMinutes, notes: '' },
          lastPrompt: { promptId, promptText, category, prepMinutes },
          lastAnalysis: null,
          lastTranscript: '',
        }),

      setNotes: (notes) => {
        const active = get().activePractice;
        if (!active) return;
        set({ activePractice: { ...active, notes } });
      },

      setLastResult: (transcript, analysis) =>
        set({ lastTranscript: transcript, lastAnalysis: analysis }),

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
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
