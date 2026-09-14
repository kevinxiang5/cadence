import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { BootScreen } from '@/components/BootScreen';
import { TourProvider } from '@/components/TourGuide';
import { hrefForTourStep, tourScreenFromSegments, tourStepAt } from '@/lib/tour';
import { colors } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const [readyTimeout, setReadyTimeout] = useState(false);
  const [bootMin, setBootMin] = useState(false);

  const hydrated = useCadenceStore((s) => s.hydrated);

  useEffect(() => {
    const unsub = useCadenceStore.persist.onFinishHydration(() => {
      useCadenceStore.getState().setHydrated(true);
    });
    if (useCadenceStore.persist.hasHydrated()) {
      useCadenceStore.getState().setHydrated(true);
    } else {
      void useCadenceStore.persist.rehydrate();
    }
    const fallback = setTimeout(() => {
      useCadenceStore.getState().setHydrated(true);
      setReadyTimeout(true);
    }, 2000);
    const hold = setTimeout(() => setBootMin(true), 1100);
    SplashScreen.hideAsync().catch(() => {});
    return () => {
      unsub();
      clearTimeout(fallback);
      clearTimeout(hold);
    };
  }, []);

  const ready = (loaded || readyTimeout) && hydrated && bootMin;

  if (!ready) {
    return <BootScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <AuthGate />
      <FlowGate />
      <TourProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.parchment },
          animation: 'slide_from_right',
          animationDuration: 280,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="compose" />
        <Stack.Screen name="prep" />
        <Stack.Screen
          name="record"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="results" />
        <Stack.Screen name="privacy" />
      </Stack>
      </TourProvider>
    </>
  );
}

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const onboardingComplete = useCadenceStore((s) => s.profile.onboardingComplete);

  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingComplete && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [onboardingComplete, segments, router]);

  return null;
}

function FlowGate() {
  const router = useRouter();
  const segments = useSegments();
  const onboardingComplete = useCadenceStore((s) => s.profile.onboardingComplete);
  const tourComplete = useCadenceStore((s) => s.tourComplete);
  const tourStep = useCadenceStore((s) => s.tourStep);
  const tourPendingScreen = useCadenceStore((s) => s.tourPendingScreen);
  const analysis = useCadenceStore((s) => s.lastAnalysis);
  const active = useCadenceStore((s) => s.activePractice);

  useEffect(() => {
    if (!onboardingComplete) return;
    if (segments[0] === 'onboarding') return;

    const leaf = segments[segments.length - 1] ?? '';

    if (leaf === 'results' && !analysis) {
      router.replace(active ? '/record' : '/(tabs)');
      return;
    }

    if (tourComplete) return;

    const step = tourStepAt(tourStep);
    if (!step) return;
    if (tourPendingScreen) return;

    const screen = tourScreenFromSegments(segments as string[]);
    if (step.screen === screen || step.screen === 'any') return;

    if (step.screen === 'results' && !analysis) {
      router.replace('/record');
      return;
    }
    if (step.screen === 'record' && !active) {
      router.replace('/(tabs)');
      return;
    }

    router.replace(hrefForTourStep(step));
  }, [
    active,
    analysis,
    onboardingComplete,
    router,
    segments,
    tourComplete,
    tourPendingScreen,
    tourStep,
  ]);

  return null;
}
