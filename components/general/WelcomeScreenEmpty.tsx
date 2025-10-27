import { DATABASE_NAME } from "@/app/_layout";
import { projects } from "@/db/schema";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { openDatabaseSync } from "expo-sqlite";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WelcomeScreenEmpty = () => {
  const router = useRouter();
  const expoDb = openDatabaseSync(DATABASE_NAME, {
    useNewConnection: true,
  });
  const db = drizzle(expoDb);
  const insets = useSafeAreaInsets();

  const [showPrompt, setShowPrompt] = useState(false);
  const [projectName, setProjectName] = useState("");

  const createProject = async (name: string) => {
    try {
      const result = await db
        .insert(projects)
        .values({ name: name.trim(), created_at: Date.now() })
        .returning({ id: projects.id });

      const projectId = result[0]?.id;
      if (!projectId) throw new Error("Insert failed");

      console.log("✅ Created project:", projectId, name);

      router.push({
        pathname: "/(app)/(drawer)/(tabs)",
        params: { projectId: String(projectId), name },
      });
    } catch (e) {
      console.error("❌ Failed to create project:", e);
      Alert.alert("Error", "Failed to create project. Please try again.");
    }
  };

  const handleNewProject = () => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "New Project",
        "Enter a name for your project:",
        async (name) => {
          if (!name || name.trim().length === 0) return;
          await createProject(name);
        },
        "plain-text",
        ""
      );
    } else {
      setShowPrompt(true);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(300)}
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: 120 },
      ]}
    >
      <Text style={styles.title}>Welcome to Survey App</Text>
      <Text style={styles.subtitle}>
        Get started by creating a new project or importing an existing one.
      </Text>

      <View style={styles.listContainer}>
        <ProjectListItem
          title="New Project"
          color="#7a6161ff"
          onPress={handleNewProject}
          delay={500}
        />
        <ProjectListItem
          title="Import Project"
          color="#b89a9aff"
          onPress={() => console.log("Import Project pressed")}
          delay={700}
        />
      </View>

      {/* ✅ Android custom prompt modal */}
      <Modal transparent visible={showPrompt} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Project</Text>
            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Enter project name"
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <ProjectListItem
                title="Cancel"
                color="#ccc"
                onPress={() => {
                  setProjectName("");
                  setShowPrompt(false);
                }}
                style={{ width: "48%" }}
              />
              <ProjectListItem
                title="Create"
                color="#7a6161ff"
                onPress={async () => {
                  if (!projectName.trim()) return;
                  setShowPrompt(false);
                  await createProject(projectName);
                  setProjectName("");
                }}
                style={{ width: "48%" }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

export default WelcomeScreenEmpty;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f2f0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#7a6161ff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#544141ff",
    textAlign: "center",
    marginBottom: 40,
  },
  listContainer: {
    width: "100%",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
