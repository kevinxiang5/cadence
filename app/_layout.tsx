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
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { colors } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const hydrated = useCadenceStore((s) => s.hydrated);
  // Trigger rehydrate if persist hasn't fired yet
  useEffect(() => {
    const unsub = useCadenceStore.persist.onFinishHydration(() => {
      useCadenceStore.getState().setHydrated(true);
    });
    if (useCadenceStore.persist.hasHydrated()) {
      useCadenceStore.getState().setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [loaded, hydrated]);

  if (!loaded || !hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.parchment }} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.parchment },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="prep"
          options={{ animation: 'slide_from_right', presentation: 'card' }}
        />
        <Stack.Screen
          name="record"
          options={{ animation: 'slide_from_bottom', presentation: 'card' }}
        />
        <Stack.Screen
          name="results"
          options={{ animation: 'fade', presentation: 'card' }}
        />
      </Stack>
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
