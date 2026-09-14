import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PressScale } from '@/components/PressScale';
import { getFluencyLab, getPersonalizedDrills, type CoachDrill } from '@/lib/coach';
import { formatReminderTime, scheduleDailyReminder } from '@/lib/notifications';
import { ENEMY_WORDS, GOAL_LABELS, type Goal } from '@/lib/prompts';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

const TIMES = [
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '5:00 PM', hour: 17, minute: 0 },
  { label: '8:00 PM', hour: 20, minute: 0 },
];

const GOALS: Goal[] = ['interview', 'debate', 'story', 'pitch', 'daily'];

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useCadenceStore((s) => s.profile);
  const sessions = useCadenceStore((s) => s.sessions);
  const updateReminder = useCadenceStore((s) => s.updateReminder);
  const setEnemyWord = useCadenceStore((s) => s.setEnemyWord);
  const updateGoal = useCadenceStore((s) => s.updateGoal);
  const startPractice = useCadenceStore((s) => s.startPractice);
  const beginFluencyChain = useCadenceStore((s) => s.beginFluencyChain);
  const updateName = useCadenceStore((s) => s.updateName);
  const startTour = useCadenceStore((s) => s.startTour);
  const [pane, setPane] = useState<'practice' | 'setup'>('practice');
  const [saving, setSaving] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [customEnemy, setCustomEnemy] = useState('');

  const forYou = useMemo(() => getPersonalizedDrills(sessions, profile), [sessions, profile]);
  const lab = useMemo(() => getFluencyLab(profile), [profile]);

  const begin = (drill: CoachDrill) => {
    if (drill.id === 'lab-432') {
      beginFluencyChain({
        promptId: drill.id,
        promptText: drill.promptText,
        category: drill.category,
      });
    } else {
      startPractice({
        promptId: drill.id,
        promptText: drill.promptText,
        category: drill.category,
        prepMinutes: 0,
        maxSeconds: drill.maxSeconds,
      });
    }
    router.push('/record');
  };

  const saveReminder = async (hour: number, minute: number) => {
    updateReminder(hour, minute);
    setSaving(true);
    const result = await scheduleDailyReminder(hour, minute, profile.name);
    setSaving(false);
    if (Platform.OS === 'web') {
      Alert.alert(
        'Reminder saved',
        `We'll nudge you at ${formatReminderTime(hour, minute)}.`
      );
    } else if (!result.ok && result.reason === 'denied') {
      Alert.alert('Notifications off', 'Enable notifications in Settings so speac can remind you.');
    }
  };

  return (
    <LinearGradient colors={[colors.parchment, colors.parchmentDeep]} style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 124,
          paddingHorizontal: 28,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Coach</Text>
        <Text style={styles.sub}>Pick a drill.</Text>

        <View style={styles.switchRow}>
          <PressScale onPress={() => setPane('practice')} style={{ flex: 1 }}>
            <View style={[styles.switchBtn, pane === 'practice' && styles.switchOn]}>
              <Text style={[styles.switchText, pane === 'practice' && styles.switchTextOn]}>
                Practice
              </Text>
            </View>
          </PressScale>
          <PressScale onPress={() => setPane('setup')} style={{ flex: 1 }}>
            <View style={[styles.switchBtn, pane === 'setup' && styles.switchOn]}>
              <Text style={[styles.switchText, pane === 'setup' && styles.switchTextOn]}>Setup</Text>
            </View>
          </PressScale>
        </View>

        {pane === 'practice' ? (
          <>
            {forYou.length > 0 ? (
              <>
                <Text style={styles.block}>For you</Text>
                {forYou.map((d) => (
                  <DrillRow key={d.id} drill={d} onPress={() => begin(d)} />
                ))}
              </>
            ) : null}

            <Text style={styles.block}>Fluency lab</Text>
            {lab.map((d) => (
              <DrillRow key={d.id} drill={d} onPress={() => begin(d)} />
            ))}
          </>
        ) : (
          <>
            <Text style={styles.innerLabel}>Your name</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onEndEditing={() => updateName(nameDraft)}
              placeholder="Your name"
              placeholderTextColor={colors.mutedLight}
              style={styles.nameInput}
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                updateName(nameDraft);
              }}
            />

            <Text style={[styles.innerLabel, { marginTop: 18 }]}>Today’s prompt leans toward</Text>
            <View style={styles.chipGrid}>
              {GOALS.map((g) => {
                const active = profile.goal === g;
                return (
                  <PressScale key={g} onPress={() => updateGoal(g)}>
                    <View style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {GOAL_LABELS[g]}
                      </Text>
                    </View>
                  </PressScale>
                );
              })}
            </View>

            <Text style={[styles.innerLabel, { marginTop: 18 }]}>Word to ban</Text>
            <View style={styles.chipGrid}>
              {ENEMY_WORDS.map((w) => {
                const active = profile.enemyWord === w;
                return (
                  <PressScale key={w} onPress={() => setEnemyWord(w)}>
                    <View style={[styles.chip, active && styles.enemyActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{w}</Text>
                    </View>
                  </PressScale>
                );
              })}
            </View>
            <TextInput
              value={customEnemy}
              onChangeText={setCustomEnemy}
              placeholder="Or type your own…"
              placeholderTextColor={colors.mutedLight}
              style={[styles.nameInput, { marginTop: 10 }]}
              returnKeyType="done"
              autoCapitalize="none"
              onSubmitEditing={() => {
                const w = customEnemy.trim();
                if (!w) return;
                setEnemyWord(w);
                setCustomEnemy('');
                Keyboard.dismiss();
              }}
            />

            <Text style={[styles.innerLabel, { marginTop: 18 }]}>Daily reminder</Text>
            <Text style={styles.current}>
              {formatReminderTime(profile.reminderHour, profile.reminderMinute)}
              {saving ? '  ·  saving' : ''}
            </Text>
            <View style={styles.chipGrid}>
              {TIMES.map((t) => {
                const active =
                  t.hour === profile.reminderHour && t.minute === profile.reminderMinute;
                return (
                  <PressScale key={t.label} onPress={() => saveReminder(t.hour, t.minute)}>
                    <View style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
                    </View>
                  </PressScale>
                );
              })}
            </View>

            <View style={{ marginTop: 28, gap: 10 }}>
              <Button
                label="Replay tour"
                variant="secondary"
                onPress={() => {
                  startTour();
                  router.replace('/(tabs)');
                }}
              />
              <Button
                label="Privacy"
                variant="ghost"
                onPress={() => router.push('/privacy' as Href)}
              />
            </View>
            <Text style={styles.privacyNote}>
              Speech stays on this phone. Nothing is uploaded.
            </Text>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function DrillRow({ drill, onPress }: { drill: CoachDrill; onPress: () => void }) {
  const secs = drill.maxSeconds ?? 90;
  return (
    <PressScale onPress={onPress} style={styles.drill}>
      <View style={styles.drillTop}>
        <Text style={styles.drillTitle}>{drill.title}</Text>
        <Text style={styles.dur}>{secs}s</Text>
      </View>
      <Text style={styles.drillBody} numberOfLines={2}>
        {drill.body}
      </Text>
      <Text style={styles.drillCta}>Speak →</Text>
    </PressScale>
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
    fontSize: 16,
    color: colors.muted,
    marginBottom: 18,
    lineHeight: 22,
  },
  switchRow: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 4,
    marginBottom: 22,
    gap: 4,
  },
  switchBtn: {
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: colors.teal },
  switchText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.muted,
  },
  switchTextOn: { color: colors.cream, fontFamily: fonts.bodyBold },
  block: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 8,
    marginTop: 8,
  },
  labLead: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  innerLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 10,
  },
  current: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 12,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
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
  drill: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  drillTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  drillTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.ink,
    flex: 1,
  },
  dur: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  drillBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  why: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 6,
  },
  drillCta: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.copper,
    marginTop: 10,
  },
  nameInput: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
  },
  privacyNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
    marginTop: 12,
  },
});
