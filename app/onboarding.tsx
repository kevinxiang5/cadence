import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { PressScale } from '@/components/PressScale';
import { scheduleDailyReminder, formatReminderTime } from '@/lib/notifications';
import { GOAL_LABELS, type Goal } from '@/lib/prompts';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

const GOALS: Goal[] = ['interview', 'debate', 'story', 'pitch', 'daily'];

const TIMES = [
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '5:00 PM', hour: 17, minute: 0 },
  { label: '8:00 PM', hour: 20, minute: 0 },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const completeOnboarding = useCadenceStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>('interview');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  const title = useMemo(() => {
    if (step === 0) return 'Two minutes a day.';
    if (step === 1) return 'Your name';
    if (step === 2) return 'What’s the focus?';
    return 'Daily reminder';
  }, [step]);

  const subtitle = useMemo(() => {
    if (step === 0) return 'Prompt. Speak. Get coached — on this phone.';
    if (step === 1) return 'Stays on this device.';
    if (step === 2) return 'Change this anytime.';
    return 'Pick a time you already have.';
  }, [step]);

  const finish = async () => {
    completeOnboarding({ name, goal, reminderHour: hour, reminderMinute: minute });
    try {
      await scheduleDailyReminder(hour, minute, name.trim() || 'Hey');
    } catch {
      // Reminders are optional — don't block first launch.
    }
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={[colors.parchment, colors.parchmentDeep]} style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.brandRow}>
          <Logo size={56} />
          <Text style={styles.brand}>speac</Text>
        </View>
        <View style={styles.progressRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        <Animated.View key={step} entering={FadeInDown.duration(280)} exiting={FadeOut.duration(140)}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {step === 0 && (
            <View style={styles.howList}>
              <HowRow n="1" text="Prompt" />
              <HowRow n="2" text="Speak" />
              <HowRow n="3" text="Score" />
            </View>
          )}

          {step === 1 && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.mutedLight}
              style={styles.input}
              autoFocus
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={() => {
                Keyboard.dismiss();
                if (name.trim()) setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <View style={styles.goalGrid}>
              {GOALS.map((g, index) => (
                <Animated.View key={g} entering={FadeIn.delay(40 * index).duration(220)}>
                  <PressScale onPress={() => setGoal(g)}>
                    <View style={[styles.goalChip, goal === g && styles.goalChipActive]}>
                      <Text style={[styles.goalText, goal === g && styles.goalTextActive]}>
                        {GOAL_LABELS[g]}
                      </Text>
                    </View>
                  </PressScale>
                </Animated.View>
              ))}
            </View>
          )}

          {step === 3 && (
            <View style={styles.timeGrid}>
              {TIMES.map((t, index) => {
                const active = t.hour === hour && t.minute === minute;
                return (
                  <Animated.View key={t.label} entering={FadeIn.delay(30 * index).duration(200)}>
                    <PressScale
                      onPress={() => {
                        setHour(t.hour);
                        setMinute(t.minute);
                      }}
                    >
                      <View style={[styles.timeChip, active && styles.timeChipActive]}>
                        <Text style={[styles.timeText, active && styles.timeTextActive]}>
                          {t.label}
                        </Text>
                      </View>
                    </PressScale>
                  </Animated.View>
                );
              })}
              <Text style={styles.timeHint}>{formatReminderTime(hour, minute)} · change in Coach</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.footer}>
          {step > 0 && (
            <Button label="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} />
          )}
          {step < 3 ? (
            <Button
              label="Continue"
              onPress={() => setStep((s) => s + 1)}
              disabled={step === 1 && !name.trim()}
              style={{ flex: 1 }}
            />
          ) : (
            <Button label="Let’s go" variant="copper" onPress={finish} style={{ flex: 1 }} />
          )}
        </View>

        <Text style={styles.tagline}>
          Speech stays here. No account.
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function HowRow({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.howRow}>
      <View style={styles.howN}>
        <Text style={styles.howNText}>{n}</Text>
      </View>
      <Text style={styles.howText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    color: colors.teal,
    letterSpacing: -0.5,
  },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 36 },
  dot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.parchmentDeep,
  },
  dotActive: { backgroundColor: colors.teal },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.muted,
    lineHeight: 24,
    marginBottom: 28,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 24,
  },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  goalChip: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  goalChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  goalText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.inkSoft,
  },
  goalTextActive: { color: colors.cream },
  timeGrid: { gap: 10, marginBottom: 24 },
  timeChip: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  timeChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  timeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.inkSoft,
  },
  timeTextActive: { color: colors.cream },
  timeHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 24,
  },
  howList: { gap: 12, marginBottom: 12 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howN: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howNText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.cream },
  howText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink, flex: 1 },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mutedLight,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
});
