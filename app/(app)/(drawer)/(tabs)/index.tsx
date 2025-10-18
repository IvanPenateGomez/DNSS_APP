import BackButton from "@/components/general/BackButton";
import NewProjectComp from "@/components/project/NewProjectComp";
import { useProjectStore } from "@/zustand/projectId";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Index = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const setProjectId = useProjectStore((state) => state.setProjectId); // ✅ setter from store

  // ✅ Extract and sanitize params
  const rawProjectId = params.projectId;
  const rawName = params.name;

  // Parse projectId to number (fallback 0 if missing or invalid)
  const projectId =
    typeof rawProjectId === "string"
      ? Number(rawProjectId)
      : Array.isArray(rawProjectId)
      ? Number(rawProjectId[0])
      : 0;

  // Normalize name to string
  const projectName =
    typeof rawName === "string"
      ? rawName
      : Array.isArray(rawName)
      ? rawName[0]
      : undefined;

  console.log("🧭 Received params:", projectId, projectName);

  // ✅ Update global projectId when screen mounts or projectId changes
  useEffect(() => {
    if (projectId && projectId > 0) {
      setProjectId(projectId);
      console.log("📦 Set global projectId:", projectId);
      useRefreshDbStore.getState().increment();

    }
  }, [projectId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 15 }]}>
      <View
        style={{
          position: "absolute",
          top: insets.top + 25,
          zIndex: 50,
          left: 10,
          right: 10,
        }}
      >
        <BackButton
          label={projectName}
          onPress={() => {
            router.replace("/(app)/(drawer)/(notabs)");
          }}
        />
      </View>

      {/* ✅ Safe & typed props */}
      <NewProjectComp projectId={projectId} projectName={projectName} />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f2f0",
  },
});
