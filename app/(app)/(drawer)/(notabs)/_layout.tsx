import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function noTabBarLayout() {
  //Todo look into
  // if (!authState?.token) {
  //   return <Redirect href="/" />;
  // }

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />

      </Stack>
    </View>
  );
}
