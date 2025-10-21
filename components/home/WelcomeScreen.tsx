import {
  attributeCoordinateValues,
  attributes,
  attributeValues,
  objectTypes,
  observations,
  projects,
  surveySessions,
} from "@/db/schema";
import { useProjects } from "@/hooks/useProjects";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { useInitializeStore } from "@/zustand/useInitializeStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
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



  // ✅ 1. Get actual SQLite database path from context
  const dbPath = sqliteDb.databasePath;


  const { data: projectList } = useProjects();
  const [showPrompt, setShowPrompt] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [exportOptionsVisible, setExportOptionsVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{
    id: number;
    name: string;
  } | null>(null);

   const handleExport = async (
    projectId: number,
    name: string,
    type: "whole" | "locations"
  ) => {
    try {
      console.log(`📤 Exporting project (${type}) as CSV:`, projectId);
  
      let csv = "";
  
      // 🧩 Helper to convert any table data to CSV
      const toCSV = (data: any[], title: string) => {
        if (!data?.length) return `${title}\n(no data)\n\n`;
        const headers = Object.keys(data[0]);
        const rows = data.map((r) =>
          headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
        );
        return `${title}\n${headers.join(",")}\n${rows.join("\n")}\n\n`;
      };
  
      if (type === "whole") {
        // 🗂 Full project export
        const proj = await db.select().from(projects).where(eq(projects.id, projectId));
        const objs = await db
          .select()
          .from(objectTypes)
          .where(eq(objectTypes.project_id, projectId));
        const attrs = await db.select().from(attributes);
        const sessions = await db
          .select()
          .from(surveySessions)
          .where(eq(surveySessions.project_id, projectId));
        const obs = await db.select().from(observations);
        const vals = await db.select().from(attributeValues);
        const coordVals = await db.select().from(attributeCoordinateValues);
  
        csv =
          toCSV(proj, "PROJECTS") +
          toCSV(objs, "OBJECT_TYPES") +
          toCSV(attrs, "ATTRIBUTES") +
          toCSV(sessions, "SURVEY_SESSIONS") +
          toCSV(obs, "OBSERVATIONS") +
          toCSV(vals, "ATTRIBUTE_VALUES") +
          toCSV(coordVals, "ATTRIBUTE_COORDINATE_VALUES");
        } else {
          // 📍 Export location-based observations with flattened attributes
          const obs = await db
            .select({
              observation_id: observations.id,
              latitude: observations.latitude,
              longitude: observations.longitude,
              captured_at: observations.captured_at,
              notes: observations.notes,
              status: observations.status,
              object_type_id: observations.object_type_id,
              session_id: observations.session_id,
            })
            .from(observations)
            .innerJoin(surveySessions, eq(surveySessions.id, observations.session_id))
            .where(eq(surveySessions.project_id, projectId));
        
          if (!obs?.length) {
            Alert.alert("No data", "No observations found for export.");
            return;
          }
        
          // Load supporting data for joins
          const [objs, attrs, vals] = await Promise.all([
            db.select().from(objectTypes).where(eq(objectTypes.project_id, projectId)),
            db.select().from(attributes),
            db.select().from(attributeValues),
          ]);
        
          // Build lookup maps for faster join-like access
          const objectMap = Object.fromEntries(objs.map((o) => [o.id, o.name]));
          const attrMap = Object.fromEntries(attrs.map((a) => [a.id, a.label]));
        
          // Flatten rows
          const flattened: any[] = [];
        
          for (const o of obs) {
            const relatedVals = vals.filter((v) =>
              attrs.some(
                (a) => a.id === v.attribute_id && a.object_type_id === o.object_type_id
              )
            );
        
            if (relatedVals.length === 0) {
              // still include observation row with no attributes
              flattened.push({
                observation_id: o.observation_id,
                object_type: objectMap[o.object_type_id] ?? "",
                latitude: o.latitude,
                longitude: o.longitude,
                attribute_label: "",
                attribute_value: "",
                captured_at: o.captured_at,
               
              });
            } else {
              for (const v of relatedVals) {
                flattened.push({
                  observation_id: o.observation_id,
                  object_type: objectMap[o.object_type_id] ?? "",
                  latitude: o.latitude,
                  longitude: o.longitude,
                  attribute_label: attrMap[v.attribute_id] ?? "",
                  attribute_value: v.value_text ?? "",
                  captured_at: o.captured_at,
              
                });
              }
            }
          }
        
          // Convert to CSV
          const headers = Object.keys(flattened[0]);
          const rows = flattened.map((r) =>
            headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")
          );
          csv = `FLATTENED_OBSERVATIONS\n${headers.join(",")}\n${rows.join("\n")}\n\n`;
        }
        
      // 💾 Write CSV file
      const filePath = `${FileSystem.cacheDirectory}${name
        .replace(/\s+/g, "_")
        .toLowerCase()}_${type}_export.csv`;
  
      await FileSystem.writeAsStringAsync(filePath, csv, { encoding: "utf8" });
  
      // 📤 Share the file
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available on this device.");
        return;
      }
  
      await Sharing.shareAsync(filePath, {
        mimeType: "text/csv",
        dialogTitle: `Export ${
          type === "whole" ? "Full Project" : "Locations"
        } Data`,
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
      const result = await DocumentPicker.getDocumentAsync({});
  
      if (result.canceled || !result.assets?.[0]?.uri) return;
  
      const fileUri = result.assets[0].uri;
      console.log("📂 Importing project from:", fileUri);
  
      // ✅ Read file
      const fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: "utf8",
      });
  
      // ✅ Parse CSV sections
      const sections = fileData.split(/\n\s*\n/);
      const parsed: Record<string, any[]> = {};
  
      for (const section of sections) {
        const lines = section.trim().split("\n");
        const title = lines.shift()?.trim();
        if (!title || lines.length < 2) continue;
  
        const headers = lines[0].split(",").map((h) => h.trim());
        const rows = lines.slice(1).map((line) => {
          const values = line.split(",");
          return Object.fromEntries(
            headers.map((h, i) => [h, values[i]?.replace(/(^"|"$)/g, "")])
          );
        });
        parsed[title] = rows;
      }
  
      console.log("📊 Parsed CSV sections:", Object.keys(parsed));
  
      // ✅ Create new project
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
  
      // ✅ OBJECT TYPES
      const objMap = new Map<number, number>();
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
  
      // ✅ ATTRIBUTES
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
  
      // ✅ ATTRIBUTE VALUES (select options)
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
  
      // ✅ SURVEY SESSIONS
      const sessionMap = new Map<number, number>();
      if (parsed.SURVEY_SESSIONS) {
        for (const s of parsed.SURVEY_SESSIONS) {
          const res = await db
            .insert(surveySessions)
            .values({
              project_id: projectId,
              started_at: Number(s.started_at) || Date.now(),
              ended_at: s.ended_at ? Number(s.ended_at) : null,
            })
            .returning({ id: surveySessions.id });
          sessionMap.set(Number(s.id), res[0].id);
        }
      }
  
      // ✅ OBSERVATIONS
      const obsMap = new Map<number, number>();
      if (parsed.OBSERVATIONS) {
        for (const o of parsed.OBSERVATIONS) {
          const sessionId = sessionMap.get(Number(o.session_id));
          const objectId = objMap.get(Number(o.object_type_id));
          if (!sessionId || !objectId) continue;
  
          const res = await db
            .insert(observations)
            .values({
              session_id: sessionId,
              object_type_id: objectId,
              latitude: Number(o.latitude),
              longitude: Number(o.longitude),
              captured_at: Number(o.captured_at),
              notes: o.notes || null,
              status: o.status || "draft",
              mapVisible: o.mapVisible === "1" || o.mapVisible === "true",
            })
            .returning({ id: observations.id });
          obsMap.set(Number(o.id), res[0].id);
        }
      }
  
      // ✅ ATTRIBUTE COORDINATE VALUES
      if (parsed.ATTRIBUTE_COORDINATE_VALUES) {
        for (const v of parsed.ATTRIBUTE_COORDINATE_VALUES) {
          const obsId = obsMap.get(Number(v.observation_id));
          const attrId = attrMap.get(Number(v.attribute_id));
          if (!obsId || !attrId) continue;
          await db.insert(attributeCoordinateValues).values({
            observation_id: obsId,
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
        { paddingTop: insets.top + 20, paddingBottom: 0 },
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
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
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
                onPress={() => {
                  setSelectedProject({ id: item.id, name: item.name });
                  setExportOptionsVisible(true);
                }}
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
        ListFooterComponent={
          Platform.OS === "ios" ? (
            <>
              <View style={styles.resetContainer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    Alert.alert(
                      "Reset App Data",
                      "This will delete all local data (database + settings) and restart the app. Continue?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Reset",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              console.log("🧹 Starting full reset...");
        
                              if (dbPath) {
                                console.log("🗑 Deleting DB at:", dbPath);
                                await FileSystem.deleteAsync(dbPath, {
                                  idempotent: true,
                                });
                              } else {
                                console.warn("⚠️ No databasePath found in context");
                              }
        
                              // ✅ 2. Clear AsyncStorage
                              await AsyncStorage.clear();
                              console.log("🧽 Cleared AsyncStorage");
        
                              // ✅ 3. Refresh Zustand store & reload app
                              refreshDb();
                              useInitializeStore.getState().increment();
        
                              Alert.alert(
                                "✅ Reset Complete",
                                "All local data cleared. Restart the app to initialize."
                              );
                            } catch (err) {
                              console.error("❌ Reset failed:", err);
                              Alert.alert("Error", "Failed to reset app data.");
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.resetButtonText}>Reset App Data</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null
        }
      />

      {/* 🔄 Reset App Data Button */}
      

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

      {/* 📤 Export Options Modal */}
      {/* 📤 Export Options Modal */}
      <Modal transparent visible={exportOptionsVisible} animationType="fade">
        <View style={styles.exportOverlay}>
          <View style={styles.exportBox}>
            <Text style={styles.exportTitle}>📤 Export Options</Text>
            <Text style={styles.exportSubtitle}>
              What do you want to export?
            </Text>

            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: "#2E6EF0" }]}
              onPress={async () => {
                if (selectedProject) {
                  setExportOptionsVisible(false);
                  await handleExport(
                    selectedProject.id,
                    selectedProject.name,
                    "whole"
                  );
                }
              }}
            >
              <Text style={styles.exportButtonText}>📦 Whole Project</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: "#7a6161ff" }]}
              onPress={async () => {
                if (selectedProject) {
                  setExportOptionsVisible(false);
                  await handleExport(
                    selectedProject.id,
                    selectedProject.name,
                    "locations"
                  );
                }
              }}
            >
              <Text style={styles.exportButtonText}>📍 Locations Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: "#ccc" }]}
              onPress={() => setExportOptionsVisible(false)}
            >
              <Text style={[styles.exportButtonText, { color: "#333" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
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
  resetContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  resetButton: {
    backgroundColor: "#e4d7d7",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#b89a9aff",
  },
  resetButtonText: {
    color: "#7a6161ff",
    fontWeight: "700",
    fontSize: 14,
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
  exportOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  exportBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 25,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    alignItems: "center",
  },
  exportTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E6EF0",
    marginBottom: 8,
  },
  exportSubtitle: {
    fontSize: 15,
    color: "#555",
    marginBottom: 18,
    textAlign: "center",
  },
  exportButton: {
    width: "85%",
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: "center",
  },
  exportButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
