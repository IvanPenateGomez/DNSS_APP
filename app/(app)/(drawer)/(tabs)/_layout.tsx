import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import TabBar from "@/components/tabbar/TabBar";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
 
      <Tabs.Screen
        name="newProject"
        options={{
          title: "New Project",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />     <Tabs.Screen
      name="Map"
      options={{
        title: "Map",
        tabBarIcon: ({ color }) => (
          <IconSymbol size={28} name="paperplane.fill" color={color} />
        ),
      }}
    />

    </Tabs>
  );
}
