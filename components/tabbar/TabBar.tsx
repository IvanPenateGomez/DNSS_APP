import { GLOBAL_APP_COLOR, GLOBAL_TINT_COLOR } from "@/constants/GlobalStyles";
import { IconKeys } from "@assets/icons/TabbarIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import TabBarButton from "./TabBarButton";

const greyColor = "lightgrey";

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [dimensions, setDimensions] = useState({ height: 20, width: 100 });
  const buttonWidth = dimensions.width / state.routes.length;

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  const tabPositionX = useSharedValue(0);

  useEffect(() => {
    tabPositionX.value = withTiming(buttonWidth * state.index, {
      duration: 200,
    });
  }, [state.index, buttonWidth]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
    };
  });

  return (
    <View onLayout={onTabbarLayout} style={styles.tabbar}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            borderRadius: 30,
            marginHorizontal: 12,
            backgroundColor: "#7a6161ff",
            height: dimensions.height - 15,
            width: buttonWidth - 25,
            overflow: "hidden", // ✅ needed for gradient clipping
            zIndex: -19,
          },
        ]}
      ></Animated.View>

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;
        const onPress = () => {
          tabPositionX.value = withTiming(buttonWidth * index, {
            duration: 200,
          });

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name as IconKeys}
            color={isFocused ? "white" : "#333333"}
            label={label as string}
          />
        );
      })}
    </View>
  );
}

export default TabBar;

const styles = StyleSheet.create({
  tabbar: {
    borderWidth: 0,
    borderColor: "#2F323A",
    position: "absolute",
    bottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 60,
    paddingVertical: 15,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
    elevation: 6,
  },
});
