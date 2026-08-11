import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card, SectionLabel } from '@/components/Card';
import { formatReminderTime, scheduleDailyReminder } from '@/lib/notifications';
import { ENEMY_WORDS, HABIT_STACKS } from '@/lib/prompts';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

const TIMES = [
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '5:00 PM', hour: 17, minute: 0 },
  { label: '8:00 PM', hour: 20, minute: 0 },
  { label: '9:30 PM', hour: 21, minute: 30 },
];

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const profile = useCadenceStore((s) => s.profile);
  const updateReminder = useCadenceStore((s) => s.updateReminder);
  const setHabitStack = useCadenceStore((s) => s.setHabitStack);
  const setEnemyWord = useCadenceStore((s) => s.setEnemyWord);
  const [saving, setSaving] = useState(false);

  const saveReminder = async (hour: number, minute: number) => {
    updateReminder(hour, minute);
    setSaving(true);
    const result = await scheduleDailyReminder(hour, minute, profile.name);
    setSaving(false);
    if (Platform.OS === 'web') {
      Alert.alert(
        'Reminder saved',
        `We'll nudge you at ${formatReminderTime(hour, minute)}. Native push works on iOS/Android.`
      );
    } else if (!result.ok && result.reason === 'denied') {
      Alert.alert('Notifications off', 'Enable notifications in Settings so Cadence can remind you.');
    }
  };

  return (
    <LinearGradient colors={[colors.parchment, colors.parchmentDeep]} style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Routine</Text>
        <Text style={styles.sub}>Make speaking as automatic as brushing your teeth.</Text>

        <Card style={{ marginBottom: 18 }}>
          <SectionLabel>Daily reminder</SectionLabel>
          <Text style={styles.current}>
            Currently {formatReminderTime(profile.reminderHour, profile.reminderMinute)}
          </Text>
          <View style={styles.chipGrid}>
            {TIMES.map((t) => {
              const active =
                t.hour === profile.reminderHour && t.minute === profile.reminderMinute;
              return (
                <Pressable
                  key={t.label}
                  onPress={() => saveReminder(t.hour, t.minute)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {saving ? <Text style={styles.saving}>Scheduling…</Text> : null}
        </Card>

        <Card style={{ marginBottom: 18 }}>
          <SectionLabel>Habit stack</SectionLabel>
          <Text style={styles.hint}>Pair Cadence with something you already do.</Text>
          {HABIT_STACKS.map((h) => {
            const active = profile.habitStackId === h.id;
            return (
              <Pressable
                key={h.id}
                onPress={() => setHabitStack(active ? null : h.id)}
                style={[styles.habitRow, active && styles.habitActive]}
              >
                <Text style={styles.habitEmoji}>{h.emoji}</Text>
                <Text style={[styles.habitLabel, active && styles.habitLabelActive]}>{h.label}</Text>
              </Pressable>
            );
          })}
        </Card>

        <Card style={{ marginBottom: 18 }}>
          <SectionLabel>Enemy word of the week</SectionLabel>
          <Text style={styles.hint}>Ban one filler. Pause instead of padding.</Text>
          <View style={styles.chipGrid}>
            {ENEMY_WORDS.map((w) => {
              const active = profile.enemyWord === w;
              return (
                <Pressable
                  key={w}
                  onPress={() => setEnemyWord(w)}
                  style={[styles.chip, active && styles.enemyActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{w}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Button
          label="Reschedule reminder"
          variant="secondary"
          onPress={() => saveReminder(profile.reminderHour, profile.reminderMinute)}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    color: colors.teal,
    marginBottom: 6,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    marginBottom: 24,
    lineHeight: 22,
  },
  current: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 14,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 20,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  enemyActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkSoft,
  },
  chipTextActive: { color: colors.cream },
  saving: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    marginBottom: 4,
  },
  habitActive: {
    backgroundColor: colors.upgradeHighlight,
  },
  habitEmoji: { fontSize: 20 },
  habitLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.inkSoft,
  },
  habitLabelActive: { color: colors.teal, fontFamily: fonts.bodyBold },
});
