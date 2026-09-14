import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts } from '@/lib/theme';

const MARK = 148;

export function BootScreen() {
  const fade = useSharedValue(0);
  const outer = useSharedValue(0);
  const mid = useSharedValue(0);
  const inner = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 380 });
    outer.value = withRepeat(
      withTiming(360, { duration: 5200, easing: Easing.linear }),
      -1,
      false
    );
    mid.value = withRepeat(
      withTiming(-360, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );
    inner.value = withRepeat(
      withTiming(360, { duration: 1600, easing: Easing.linear }),
      -1,
      false
    );
  }, [fade, inner, mid, outer]);

  const wrap = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));
  const spinOuter = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outer.value}deg` }],
  }));
  const spinMid = useAnimatedStyle(() => ({
    transform: [{ rotate: `${mid.value}deg` }],
  }));
  const spinInner = useAnimatedStyle(() => ({
    transform: [{ rotate: `${inner.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.center, wrap]}>
        <View style={styles.mark} collapsable={false}>
          <Animated.Image
            source={require('../assets/images/ring-outer.png')}
            style={[styles.ring, spinOuter]}
          />
          <Animated.Image
            source={require('../assets/images/ring-mid.png')}
            style={[styles.ring, spinMid]}
          />
          <Animated.Image
            source={require('../assets/images/ring-inner.png')}
            style={[styles.ring, spinInner]}
          />
        </View>
        <Text style={styles.word}>speac</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.parchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: MARK,
    height: MARK,
    marginBottom: 18,
  },
  ring: {
    position: 'absolute',
    width: MARK,
    height: MARK,
    top: 0,
    left: 0,
  },
  word: {
    fontFamily: fonts.displayBold,
    fontSize: 42,
    color: colors.teal,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
});
