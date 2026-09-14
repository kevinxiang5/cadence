import { ReactNode } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handle = () => {
    if (disabled || loading) return;
    Keyboard.dismiss();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      onPressIn={() => {
        if (disabled || loading) return;
        scale.value = withSpring(0.96, { damping: 16, stiffness: 420 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
    >
      <Animated.View
        style={[
          styles.base,
          styles[variant],
          (disabled || loading) && styles.disabled,
          style,
          anim,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' || variant === 'copper' ? colors.cream : colors.teal}
          />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, styles[`${variant}Label` as const], textStyle]}>{label}</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radii.md,
    paddingHorizontal: 24,
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
