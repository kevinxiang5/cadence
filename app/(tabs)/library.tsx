import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GOAL_LABELS,
  getPromptsByCategory,
  type Goal,
  type Prompt,
} from '@/lib/prompts';
import { colors, fonts, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

const FILTERS: Array<Goal | 'all'> = ['all', 'interview', 'debate', 'story', 'pitch', 'daily'];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startPractice = useCadenceStore((s) => s.startPractice);
  const [filter, setFilter] = useState<Goal | 'all'>('all');

  const prompts = useMemo(() => getPromptsByCategory(filter), [filter]);

  const practice = (p: Prompt) => {
    startPractice({
      promptId: p.id,
      promptText: p.text,
      category: p.category,
      prepMinutes: 0,
    });
    router.push('/record');
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
        <Text style={styles.title}>Library</Text>
        <Text style={styles.sub}>Tap any prompt. Extra reps welcome.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          style={{ marginBottom: 18 }}
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filter, active && styles.filterActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f === 'all' ? 'All' : GOAL_LABELS[f]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {prompts.map((p) => (
          <Pressable key={p.id} style={styles.card} onPress={() => practice(p)}>
            <Text style={styles.cat}>{GOAL_LABELS[p.category]}</Text>
            <Text style={styles.prompt}>{p.text}</Text>
            <Text style={styles.cta}>Practice →</Text>
          </Pressable>
        ))}
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
    marginBottom: 18,
  },
  filters: { gap: 8, paddingRight: 8 },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  filterText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkSoft,
  },
  filterTextActive: { color: colors.cream },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cat: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.tealLight,
    marginBottom: 8,
  },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink,
    marginBottom: 12,
  },
  cta: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.copper,
  },
});
