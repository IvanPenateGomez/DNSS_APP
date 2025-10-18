import { projects } from "@/db/schema";
import { useProjects } from "@/hooks/useProjects";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WelcomeScreen = () => {
  const router = useRouter();
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);
  const insets = useSafeAreaInsets();
  const refreshDb = useRefreshDbStore((s) => s.increment);

  const { data: projectList } = useProjects();
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
      refreshDb();

      router.push({
        pathname: "/(app)/(drawer)/(tabs)",
        params: { projectId: String(projectId), name },
      });
    } catch (e) {
      console.error("❌ Failed to create project:", e);
      Alert.alert("Error", "Failed to create project. Please try again.");
    }
  };

  const deleteProject = async (id: number, name: string) => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete “${name}”?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.delete(projects).where(eq(projects.id, id));
              refreshDb();
              console.log("🗑 Deleted project:", name);
            } catch (e) {
              console.error("❌ Failed to delete project:", e);
              Alert.alert("Error", "Could not delete project.");
            }
          },
        },
      ]
    );
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

  const handleImportProject = () => {};

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(300)}
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: 40 },
      ]}
    >
      <Text style={styles.title}>Your Projects</Text>
      <Text style={styles.subtitle}>
        Create a new project or open an existing one.
      </Text>

      {/* ✅ New Project Button */}
      <Animated.View
        style={{ width: "100%", alignItems: "center" }}
        entering={FadeInDown.duration(400).delay(500)}
      >
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handleNewProject}
        >
          <Text style={styles.buttonText}>+ New Project</Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View
        style={{ width: "100%", alignItems: "center" }}
        entering={FadeInDown.duration(400).delay(700)}
      >
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleImportProject}
        >
          <Text style={styles.buttonText}>Import Project</Text>
        </TouchableOpacity>
      </Animated.View>
      {/* ✅ Project List */}
      <FlatList
        data={projectList}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 80 }}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(300).delay(index * 100)}
            style={styles.projectCard}
          >
            <TouchableOpacity
              style={styles.projectInfo}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(drawer)/(tabs)",
                  params: { projectId: String(item.id), name: item.name },
                })
              }
            >
              <Text style={styles.projectName}>{item.name}</Text>
              <Text style={styles.projectDate}>
                {new Date(item.created_at).toLocaleDateString("en-GB")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteProject(item.id, item.name)}
            >
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No projects yet. Create one above!
          </Text>
        }
      />

      {/* ✅ Android Prompt Modal */}
      <Modal transparent visible={showPrompt} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Project</Text>
            <TextInput
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Enter project name"
              style={styles.input}
              placeholderTextColor="#888"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => {
                  setProjectName("");
                  setShowPrompt(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#7a6161ff" }]}
                onPress={async () => {
                  if (!projectName.trim()) return;
                  setShowPrompt(false);
                  await createProject(projectName);
                  setProjectName("");
                }}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f2f0",
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7a6161ff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#544141ff",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 25,
  },
  buttonPrimary: {
    backgroundColor: "#7a6161ff",
    paddingVertical: 14,
    borderRadius: 10,
    width: "85%",
    alignSelf: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginVertical: 6,
    marginHorizontal: 10,
    shadowColor: "#7a6161ff",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 0.8,
    borderColor: "lightgrey",
    // elevation: 2,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#544141ff",
  },
  projectDate: {
    fontSize: 13,
    color: "#7a6161cc",
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: "#b89a9aff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  deleteText: {
    fontSize: 16,
    color: "#fff",
  },
  emptyText: {
    textAlign: "center",
    color: "#54414188",
    marginTop: 40,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "#b89a9aff",
    paddingVertical: 15,
    borderRadius: 10,
    width: "85%",
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
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
