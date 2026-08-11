import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radii } from '@/lib/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function Card({ children, style, padded = true }: Props) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function ScorePill({
  label,
  value,
  invert,
}: {
  label: string;
  value: number;
  /** When true, lower numbers are better (e.g. filler count). */
  invert?: boolean;
}) {
  let tone = colors.tealMid;
  if (invert) {
    tone = value === 0 ? colors.success : value <= 3 ? colors.tealMid : colors.copper;
  } else if (value >= 80) {
    tone = colors.success;
  } else if (value >= 60) {
    tone = colors.tealMid;
  } else {
    tone = colors.copper;
  }
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  padded: {
    padding: 18,
  },
  section: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 10,
  },
  pill: {
    backgroundColor: colors.parchment,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 88,
    alignItems: 'center',
  },
  pillLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pillValue: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
  },
});
