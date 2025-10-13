import NewProjectComp from "@/components/project/NewProjectComp";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const index = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: 120 },
      ]}
    >
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
