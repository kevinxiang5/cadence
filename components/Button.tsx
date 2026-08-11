import { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { colors, fonts, radii } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'copper';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: ReactNode;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  textStyle,
  icon,
}: Props) {
  const handle = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'copper' ? colors.cream : colors.teal} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, styles[`${variant}Label` as const], textStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radii.md,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: colors.teal,
  },
  secondary: {
    backgroundColor: colors.cream,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  copper: {
    backgroundColor: colors.copper,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  primaryLabel: { color: colors.cream },
  secondaryLabel: { color: colors.teal },
  ghostLabel: { color: colors.tealMid },
  copperLabel: { color: colors.cream },
});
