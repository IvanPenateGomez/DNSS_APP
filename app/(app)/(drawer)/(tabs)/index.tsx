import BackButton from "@/components/general/BackButton";
import NewProjectComp from "@/components/project/NewProjectComp";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { SlideInLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const index = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 15 }]}>
      <View
        style={{
          position: "absolute",
          top: insets.top + 25,
          zIndex: 50,
          left: 10,
        }}
      >
        <BackButton
          onPress={() => {
            router.replace("/(app)/(drawer)/(notabs)");
          }}
        />
      </View>
      <NewProjectComp />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f2f0",
  },
  text: {
    fontSize: 18,
    color: "#333",
  },
});
