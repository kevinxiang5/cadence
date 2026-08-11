import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
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
    if (step === 0) return 'What should we call you?';
    if (step === 1) return 'What are you training for?';
    return 'When should Cadence show up?';
  }, [step]);

  const subtitle = useMemo(() => {
    if (step === 0) return 'A first name is enough. This stays on your device.';
    if (step === 1) return 'We’ll bias today’s prompt toward this — you can switch anytime.';
    return 'Pick a time that already exists in your day. Habit > willpower.';
  }, [step]);

  const finish = async () => {
    completeOnboarding({ name, goal, reminderHour: hour, reminderMinute: minute });
    await scheduleDailyReminder(hour, minute, name.trim() || 'Hey');
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={[colors.parchment, colors.parchmentDeep]} style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Cadence</Text>
        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {step === 0 && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.mutedLight}
            style={styles.input}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => name.trim() && setStep(1)}
          />
        )}

        {step === 1 && (
          <View style={styles.goalGrid}>
            {GOALS.map((g) => (
              <Pressable
                key={g}
                onPress={() => setGoal(g)}
                style={[styles.goalChip, goal === g && styles.goalChipActive]}
              >
                <Text style={[styles.goalText, goal === g && styles.goalTextActive]}>
                  {GOAL_LABELS[g]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.timeGrid}>
            {TIMES.map((t) => {
              const active = t.hour === hour && t.minute === minute;
              return (
                <Pressable
                  key={t.label}
                  onPress={() => {
                    setHour(t.hour);
                    setMinute(t.minute);
                  }}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                >
                  <Text style={[styles.timeText, active && styles.timeTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
            <Text style={styles.timeHint}>
              Reminder set for {formatReminderTime(hour, minute)}. You can change this in Routine.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          {step > 0 && (
            <Button label="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} />
          )}
          {step < 2 ? (
            <Button
              label="Continue"
              onPress={() => setStep((s) => s + 1)}
              disabled={step === 0 && !name.trim()}
              style={{ flex: 1 }}
            />
          ) : (
            <Button label="Start my first day" variant="copper" onPress={finish} style={{ flex: 1 }} />
          )}
        </View>

        <Text style={styles.tagline}>
          Duolingo for speaking — 2 minutes that make you sharper.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    color: colors.teal,
    letterSpacing: -0.5,
    marginBottom: 20,
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
  tagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mutedLight,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
});
