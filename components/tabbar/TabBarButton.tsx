import { IconKeys, icons } from "@assets/icons/TabbarIcons";
import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type TabBarButtonProps = {
  isFocused: boolean;
  label: string;
  routeName: IconKeys;
  color: string;
  onPress: () => void;
  onLongPress: () => void;
};

const TabBarButton = ({
  isFocused,
  label,
  routeName,
  color,
  onPress,
  onLongPress,
}: TabBarButtonProps) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, {
      duration: 350,
    });
  }, [scale, isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2]);
    const top = interpolate(scale.value, [0, 1], [0, 9]);

    return {
      transform: [{ scale: scaleValue }],
      top,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);
    return { opacity };
  });
console.log("icons[routeName]: ", routeName)
  //GOOD
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.tabbarItem,
        {
          opacity: pressed ? 0.5 : 1, // 👈 lower opacity when pressed
        },
      ]}
    >
      <Animated.View style={[animatedIconStyle]}>
        {
          //@ts-ignore
          icons[routeName]({
            color,
          })
        }
      </Animated.View>
      <Animated.Text
        style={[
          animatedTextStyle,
          {
            color: isFocused ? "black" : "#808080",
            fontSize: 12,
            zIndex: 50,
            fontFamily: "Inter_400Regular",
            includeFontPadding: false,
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tabbarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    zIndex: 20,
  },
});

export default TabBarButton;
