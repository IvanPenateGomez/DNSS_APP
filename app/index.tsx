import { useEffect } from "react";
import { router } from "expo-router";
import { View } from "react-native";

export default function Index() {
  useEffect(() => {
    console.log("IN HEERER!")
    router.replace("/(app)/(drawer)/(notabs)");
  }, []);

  return <View style={{ flex: 1, backgroundColor:"#f5f2f0" }} />;
}
