import { Redirect } from 'expo-router';

import { useCadenceStore } from '@/store/useCadenceStore';

export default function Index() {
  const done = useCadenceStore((s) => s.profile.onboardingComplete);
  if (!done) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
