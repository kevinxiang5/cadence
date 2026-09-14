import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, layout } from '@/lib/theme';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backWrap}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: layout.screenPad,
          paddingBottom: insets.bottom + 32,
          gap: 16,
        }}
      >
        <Text style={styles.title}>Privacy</Text>
        <Text style={styles.body}>
          No account. No cloud. No ads.
        </Text>
        <Text style={styles.h}>On this phone</Text>
        <Text style={styles.body}>
          Apple transcribes on-device. Scores stay in the app.
        </Text>
        <Text style={styles.h}>What we don’t do</Text>
        <Text style={styles.body}>
          We don’t upload your voice. We don’t sell data.
        </Text>
        <Text style={styles.h}>Delete</Text>
        <Text style={styles.body}>
          Delete the app to erase sessions and prompts.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.parchment },
  backWrap: { paddingHorizontal: layout.screenPad, marginBottom: 12 },
  back: { fontFamily: fonts.bodyMedium, color: colors.muted, fontSize: 16 },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: colors.ink,
  },
  h: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.teal,
    marginTop: 8,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkSoft,
  },
});
