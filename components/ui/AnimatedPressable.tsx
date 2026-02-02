import { ReactNode, useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: object;
  scaleValue?: number;
}

export default function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  scaleValue = 0.97,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  return (
    <AnimatedPress
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPress>
  );
}
