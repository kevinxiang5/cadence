import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale } from '@/components/PressScale';
import {
  GOAL_LABELS,
  getPromptsByCategory,
  type Goal,
  type Prompt,
} from '@/lib/prompts';
import { colors, fonts, layout, radii } from '@/lib/theme';
import { useCadenceStore } from '@/store/useCadenceStore';

type Filter = Goal | 'all' | 'favorites' | 'mine';

const FILTERS: Filter[] = ['all', 'favorites', 'mine', 'interview', 'debate', 'story', 'pitch', 'daily'];

function filterLabel(f: Filter) {
  if (f === 'all') return 'All';
  if (f === 'favorites') return 'Starred';
  if (f === 'mine') return 'Mine';
  return GOAL_LABELS[f];
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const startPractice = useCadenceStore((s) => s.startPractice);
  const customPrompts = useCadenceStore((s) => s.customPrompts) ?? [];
  const favoritePromptIds = useCadenceStore((s) => s.favoritePromptIds) ?? [];
  const toggleFavorite = useCadenceStore((s) => s.toggleFavorite);
  const removeCustomPrompt = useCadenceStore((s) => s.removeCustomPrompt);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const prompts = useMemo(() => {
    let list: Prompt[] =
      filter === 'favorites'
        ? getPromptsByCategory('all', customPrompts).filter((p) => favoritePromptIds.includes(p.id))
        : filter === 'mine'
          ? customPrompts
          : getPromptsByCategory(filter, customPrompts);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.text.toLowerCase().includes(q));
    return list;
  }, [filter, customPrompts, favoritePromptIds, query]);

  const practice = (p: { id: string; text: string; category: Goal }) => {
    Keyboard.dismiss();
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
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + layout.tabClearance,
          paddingHorizontal: layout.screenPad,
          gap: 8,
        }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Library</Text>
        <Text style={styles.sub}>Tap a prompt.</Text>

        <PressScale onPress={() => router.push('/compose')} style={styles.writeCard}>
          <Text style={styles.writeKicker}>Your prompt</Text>
          <Text style={styles.writeTitle}>Write your own</Text>
          <Text style={styles.writeBody}>Say it out loud.</Text>
        </PressScale>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search prompts"
          placeholderTextColor={colors.mutedLight}
          style={styles.search}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

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
                  {filterLabel(f)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {prompts.length === 0 ? (
          <Text style={styles.empty}>
            {filter === 'favorites'
              ? 'Star a prompt and it will live here.'
              : filter === 'mine'
                ? 'Write your own prompt above.'
                : 'No prompts match that search.'}
          </Text>
        ) : (
          prompts.map((p) => {
            const starred = favoritePromptIds.includes(p.id);
            const mine = p.id.startsWith('custom-');
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cat}>{GOAL_LABELS[p.category]}</Text>
                  <View style={styles.cardBtns}>
                    {mine ? (
                      <Pressable onPress={() => removeCustomPrompt(p.id)} hitSlop={8}>
                        <Text style={styles.remove}>Remove</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => toggleFavorite(p.id)} hitSlop={8}>
                      <Text style={[styles.star, starred && styles.starOn]}>{starred ? '★' : '☆'}</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable onPress={() => practice(p)}>
                  <Text style={styles.prompt}>{p.text}</Text>
                  <Text style={styles.cta}>Practice →</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: colors.teal,
    marginBottom: 4,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  writeCard: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: layout.cardPad,
    borderWidth: 1.5,
    borderColor: colors.copperSoft,
    marginBottom: 16,
    marginTop: 8,
  },
  writeKicker: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.copper,
    marginBottom: 8,
  },
  writeTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    marginBottom: 6,
  },
  writeBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  search: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 14,
  },
  filters: { gap: 8, paddingRight: 8 },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  block: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 12,
    marginTop: 6,
  },
  recent: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recentText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: layout.cardPad,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cat: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.tealLight,
  },
  star: { fontSize: 20, color: colors.mutedLight },
  starOn: { color: colors.copper },
  remove: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.coral },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 28,
    color: colors.ink,
    marginBottom: 14,
  },
  cta: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.copper,
  },
});
