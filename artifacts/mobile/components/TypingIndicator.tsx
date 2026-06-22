import React, { memo, useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const USE_NATIVE = Platform.OS !== "web";

function TypingIndicatorInner() {
  const colors = useColors();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makePulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 320,
            useNativeDriver: USE_NATIVE,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 320,
            useNativeDriver: USE_NATIVE,
          }),
          Animated.delay(320),
        ])
      );

    const a1 = makePulse(dot1, 0);
    const a2 = makePulse(dot2, 150);
    const a3 = makePulse(dot3, 300);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    };
  }, [dot1, dot2, dot3]);

  const dotAnimStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
    ],
  });

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: colors.coral }]} />
      <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { backgroundColor: colors.sage }, dotAnimStyle(d)]}
          />
        ))}
      </View>
    </View>
  );
}

export const TypingIndicator = memo(TypingIndicatorInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginHorizontal: 12,
    marginVertical: 4,
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    flexShrink: 0,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
