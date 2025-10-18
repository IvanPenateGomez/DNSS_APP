import DrawerProvider from "@/context/DrawerContext";
import { router, Stack } from "expo-router";
import React, { useEffect } from "react";
export default function _userLayout() {

  return (
    <DrawerProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(notabs)" options={{ headerShown: false }} />
      </Stack>
    </DrawerProvider>
  );
}
