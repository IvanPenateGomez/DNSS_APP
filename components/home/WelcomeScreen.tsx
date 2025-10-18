import { attributes, attributeValues, objectTypes, observations, projects, surveySessions } from "@/db/schema";
import { useProjects } from "@/hooks/useProjects";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
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




  const handleExport = async (projectId: number, name: string) => {
    try {
      console.log("📤 Exporting project as CSV:", projectId);
  
      const proj = await db.select().from(projects).where(eq(projects.id, projectId));
      const objs = await db.select().from(objectTypes).where(eq(objectTypes.project_id, projectId));
      const attrs = await db.select().from(attributes);
      const sessions = await db.select().from(surveySessions).where(eq(surveySessions.project_id, projectId));
      const obs = await db.select().from(observations);
      const vals = await db.select().from(attributeValues);
  
      const toCSV = (data: any[], title: string) => {
        if (!data.length) return `${title}\n(no data)\n\n`;
        const headers = Object.keys(data[0]);
        const rows = data.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
        return `${title}\n${headers.join(",")}\n${rows.join("\n")}\n\n`;
      };
  
      const csv =
        toCSV(proj, "PROJECTS") +
        toCSV(objs, "OBJECT_TYPES") +
        toCSV(attrs, "ATTRIBUTES") +
        toCSV(sessions, "SURVEY_SESSIONS") +
        toCSV(obs, "OBSERVATIONS") +
        toCSV(vals, "ATTRIBUTE_VALUES");
  
      // ✅ Safe path
      const filePath = `${(FileSystem as any).cacheDirectory}${name.replace(/\s+/g, "_")}_export.csv`;
  
      // ✅ FIX: use "utf8" directly
      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: "utf8",
      });
  
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available on this device.");
        return;
      }
  
      await Sharing.shareAsync(filePath, {
        mimeType: "text/csv",
        dialogTitle: "Export Project Data",
        UTI: "public.comma-separated-values-text",
      });
  
      console.log("✅ CSV shared successfully:", filePath);
    } catch (err) {
      console.error("❌ Export failed:", err);
      Alert.alert("Error", "Failed to export CSV.");
    }
  };
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


  const handleImportProject = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
   
      });
  
      if (result.canceled || !result.assets?.[0]?.uri) return;
  
      const fileUri = result.assets[0].uri;
      console.log("📂 Importing project from:", fileUri);
  
      // ✅ Read file
      const fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: "utf8",
      });
  
      // ✅ Parse CSV sections (split by blank lines)
      const sections = fileData.split(/\n\s*\n/);
      const parsed: Record<string, any[]> = {};
  
      for (const section of sections) {
        const lines = section.trim().split("\n");
        const title = lines.shift()?.trim();
        if (!title || lines.length < 2) continue;
  
        const headers = lines[0].split(",").map((h) => h.trim());
        const rows = lines.slice(1).map((line) => {
          const values = line.split(",");
          return Object.fromEntries(headers.map((h, i) => [h, values[i]?.replace(/(^"|"$)/g, "")]));
        });
        parsed[title] = rows;
      }
  
      console.log("📊 Parsed CSV sections:", Object.keys(parsed));
  
      // ✅ Create new project (copy name)
      const importedName =
        parsed.PROJECTS?.[0]?.name || `Imported_${Date.now()}`;
      const insertedProject = await db
        .insert(projects)
        .values({
          name: importedName,
          created_at: Date.now(),
        })
        .returning({ id: projects.id });
  
      const projectId = insertedProject[0]?.id;
      if (!projectId) throw new Error("Failed to insert project");
      console.log("🆕 Created imported project:", importedName);
  
      // ✅ Insert object types
      const objMap = new Map<number, number>(); // oldId -> newId
      if (parsed.OBJECT_TYPES) {
        for (const [i, o] of parsed.OBJECT_TYPES.entries()) {
          const res = await db
            .insert(objectTypes)
            .values({
              project_id: projectId,
              name: o.name,
              color: o.color || "#7a6161ff",
              order_index: i,
            })
            .returning({ id: objectTypes.id });
          objMap.set(Number(o.id), res[0].id);
        }
      }
  
      // ✅ Insert attributes
      const attrMap = new Map<number, number>();
      if (parsed.ATTRIBUTES) {
        for (const [i, a] of parsed.ATTRIBUTES.entries()) {
          const objId = objMap.get(Number(a.object_type_id));
          if (!objId) continue;
          const res = await db
            .insert(attributes)
            .values({
              object_type_id: objId,
              label: a.label,
              key: a.key,
              type: a.type,
              required: a.required === "1" || a.required === "true",
              order_index: i,
            })
            .returning({ id: attributes.id });
          attrMap.set(Number(a.id), res[0].id);
        }
      }
  
      // ✅ Insert select values
      if (parsed.ATTRIBUTE_VALUES) {
        for (const v of parsed.ATTRIBUTE_VALUES) {
          const attrId = attrMap.get(Number(v.attribute_id));
          if (!attrId) continue;
          await db.insert(attributeValues).values({
            attribute_id: attrId,
            value_text: v.value_text,
          });
        }
      }
  
      refreshDb();
      Alert.alert("✅ Import Successful", `Project “${importedName}” added.`);
      console.log("🎉 Project imported successfully!");
    } catch (err) {
      console.error("❌ Import failed:", err);
      Alert.alert("Error", "Failed to import project.");
    }
  };

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

            <View style={styles.actionButtons}>
              {/* 🗑 Delete */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#b89a9aff" }]}
                onPress={() => deleteProject(item.id, item.name)}
              >
                <Text style={styles.actionText}>🗑</Text>
              </TouchableOpacity>

              {/* 📤 Export */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#2E6EF0" }]}
                onPress={() => handleExport(item.id, item.name)}
              >
                <Text style={styles.actionText}>⬇️</Text>
              </TouchableOpacity>
            </View>
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
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
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
