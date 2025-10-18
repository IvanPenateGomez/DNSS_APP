import BackButton from "@/components/general/BackButton";
import NewProjectComp from "@/components/project/NewProjectComp";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Index = () => {
  const insets = useSafeAreaInsets();
  const { projectId, name } = useLocalSearchParams(); // ✅ get params from route

  console.log("🧭 Received params:", projectId, name);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 15 }]}>
      <View
        style={{
          position: "absolute",
          top: insets.top + 25,
          zIndex: 50,
          left: 10,
          right: 10
        }}
      >
        <BackButton
          label={name as string}
          onPress={() => {
            router.replace("/(app)/(drawer)/(notabs)");
          }}
        />
      </View>

      {/* ✅ Pass the params to your component */}
      <NewProjectComp projectId={projectId} projectName={name} />
    </View>
  );
};

export default Index;

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
