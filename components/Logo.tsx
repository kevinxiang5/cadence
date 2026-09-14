import { Image, type ImageStyle, type StyleProp } from 'react-native';

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function Logo({ size = 48, style }: Props) {
  return (
    <Image
      source={require('../assets/images/logo.png')}
      style={[{ width: size, height: size, borderRadius: size * 0.28 }, style]}
      accessibilityLabel="speac"
    />
  );
}
