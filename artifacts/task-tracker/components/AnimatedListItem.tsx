import React from "react";
import Animated, { FadeInRight } from "react-native-reanimated";

interface Props {
  index: number;
  children: React.ReactNode;
}

export default function AnimatedListItem({ index, children }: Props) {
  return (
    <Animated.View entering={FadeInRight.delay(Math.min(index * 55, 400)).springify().damping(18).stiffness(120)}>
      {children}
    </Animated.View>
  );
}
