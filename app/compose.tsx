import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { PressScale } from '@/components/PressScale';
import { GOAL_LABELS, type Goal } from '@/lib/prompts';
import { colors, fonts, layout, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

const GOALS: Goal[] = ['interview', 'debate', 'story', 'pitch', 'daily'];

export default function ComposeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const addCustomPrompt = useCadenceStore((s) => s.addCustomPrompt);
  const startPractice = useCadenceStore((s) => s.startPractice);

  const [text, setText] = useState('');
  const [goal, setGoal] = useState<Goal>('daily');
  const [beat1, setBeat1] = useState('');
  const [beat2, setBeat2] = useState('');
  const [beat3, setBeat3] = useState('');

  const ready = text.trim().length > 8;

  const launch = (prepMinutes: 0 | 2) => {
    if (!ready) return;
    Keyboard.dismiss();
    const beats = [beat1, beat2, beat3].map((b) => b.trim()).filter(Boolean);
    const prompt = addCustomPrompt(text, goal);
    if (beats.length && prompt) {
      // hints live on the saved prompt object already; stash beats into notes via start
    }
    startPractice({
      promptId: prompt.id,
      promptText: text.trim(),
      category: goal,
      prepMinutes,
    });
    if (beats.length) {
      useCadenceStore.getState().setNotes(beats.map((b) => `· ${b}`).join('\n'));
    }
    router.replace(prepMinutes === 2 ? '/prep' : '/record');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            router.back();
          }}
          hitSlop={12}
        >
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPad,
          paddingBottom: insets.bottom + 32,
          gap: layout.stackGap,
        }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.kicker}>Your prompt</Text>
          <Text style={styles.title}>Write what you want to practice</Text>
          <Text style={styles.sub}>
            A real question, a toast, a pitch, a hard conversation — then speak it.
          </Text>
        </View>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="e.g. Convince my manager to let me lead the next demo."
          placeholderTextColor={colors.mutedLight}
          style={styles.promptBox}
          multiline
          textAlignVertical="top"
        />

        <View>
          <Text style={styles.section}>Treat it as</Text>
          <View style={styles.chipRow}>
            {GOALS.map((g) => {
              const on = goal === g;
              return (
                <PressScale key={g} onPress={() => setGoal(g)}>
                  <View style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{GOAL_LABELS[g]}</Text>
                  </View>
                </PressScale>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.section}>Optional beats</Text>
          <Text style={styles.hint}>Three notes you can glance at before you talk.</Text>
          <TextInput
            value={beat1}
            onChangeText={setBeat1}
            placeholder="Open with…"
            placeholderTextColor={colors.mutedLight}
            style={styles.beat}
            returnKeyType="next"
          />
          <TextInput
            value={beat2}
            onChangeText={setBeat2}
            placeholder="One concrete detail…"
            placeholderTextColor={colors.mutedLight}
            style={styles.beat}
            returnKeyType="next"
          />
          <TextInput
            value={beat3}
            onChangeText={setBeat3}
            placeholder="Close on…"
            placeholderTextColor={colors.mutedLight}
            style={styles.beat}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>

        <View style={styles.actions}>
          <Button label="Speak this now" onPress={() => launch(0)} disabled={!ready} />
          <Button
            label="Prep for 2 minutes"
            variant="secondary"
            onPress={() => launch(2)}
            disabled={!ready}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  header: {
    paddingHorizontal: layout.screenPad,
    marginBottom: 12,
  },
  back: { fontFamily: fonts.bodyMedium, color: colors.muted, fontSize: 16 },
  kicker: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 40,
    color: colors.ink,
    marginBottom: 10,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
  promptBox: {
    minHeight: 160,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: layout.cardPad,
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
  },
  section: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 10,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 20,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipOn: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.inkSoft },
  chipTextOn: { color: colors.cream },
  beat: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 10,
  },
  actions: { gap: 12, marginTop: 8 },
});
