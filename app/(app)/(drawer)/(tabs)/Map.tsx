import { DATABASE_NAME } from "@/app/_layout";
import EnterDataButton from "@/components/general/EnterDataButton";
import EnterDataModal from "@/components/map/EnterDataModal";
import { useDrawer } from "@/context/DrawerContext";
import { observations } from "@/db/schema";
import { useSavedObservations } from "@/hooks/useSavedObservations";
import { useProjectStore } from "@/zustand/projectId";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as Location from "expo-location";
import { openDatabaseSync, useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Map() {
  const [region, setRegion] = useState<Region | null>({
    latitude: 52.2215,
    longitude: 6.8937,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedObs, setSelectedObs] = useState<any | null>(null);
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();

  const projectId = useProjectStore((s) => s.projectId);
  const { data: observationsData } = useSavedObservations(projectId);

  const isLoading = !observationsData;
   const expoDb = openDatabaseSync(DATABASE_NAME, {
      useNewConnection: true,
    });
    const db = drizzle(expoDb);

  // -----------------------------
  // 📍 Initial map setup
  // -----------------------------
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
     
        return;
      }
    
    })();
  }, []);

  // -----------------------------
  // 🗑 Delete observation
  // -----------------------------
  const handleDelete = async (id: number) => {
    Alert.alert(
      "Delete Observation",
      "Are you sure you want to delete this observation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.delete(observations).where(eq(observations.id, id));

              // ✅ Immediately refresh data
              useRefreshDbStore.getState().increment();

              // ✅ Close modal
              setSelectedObs(null);

              Alert.alert("Deleted", "Observation removed successfully.");
            } catch (err) {
              console.error("❌ Failed to delete observation:", err);
              Alert.alert("Error", "Could not delete this observation.");
            } finally {
            }
          },
        },
      ]
    );
  };

  // -----------------------------
  // ➕ Add new observation
  // -----------------------------
  const handleContinue = (
    objectId: number,
    coords: { lat: number; lon: number }
  ) => {
    console.log("✅ Continue with:", { objectId, coords });
  };

  if (!region)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <MapView
        provider="google"
        style={styles.map}
        region={region}
        showsUserLocation
        showsCompass={false}
        rotateEnabled={false}
      >
        {/* 🟢 Render markers */}
        {!isLoading &&
          observationsData.map((obs) => (
            <Marker
              key={obs.id}
              coordinate={{
                latitude: obs.latitude,
                longitude: obs.longitude,
              }}
              onPress={() => setSelectedObs(obs)}
            >
              <View
                style={[
                  styles.markerCircle,
                  { backgroundColor: obs.color || "#7a6161ff" },
                ]}
              />
            </Marker>
          ))}
      </MapView>

      {/* 📍 Center map button */}
      <TouchableOpacity
        onPress={async () => {
          try {
            const location = await Location.getCurrentPositionAsync({});
            setRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
            openDrawer();
          } catch {
            Alert.alert("Error", "Could not fetch location");
          }
        }}
        activeOpacity={0.8}
        style={[styles.markerButton, { top: insets.top + 10 }]}
      >
        <Ionicons name="location-sharp" size={24} color="#fff" />
      </TouchableOpacity>

      {/* ➕ Enter Data Button */}
      <View style={[styles.enterDataWrapper, { bottom: insets.bottom + 150 }]}>
        <EnterDataButton onPress={() => setShowModal(true)} />
      </View>

      {/* 🧭 Modal for data entry */}
      <EnterDataModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onContinue={handleContinue}
      />

      {/* 🪟 Popup for selected observation */}
      {/* 🪟 Popup for selected observation */}
      <Modal visible={!!selectedObs} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          {selectedObs ? (
            <View
              style={[
                styles.popupBox,
                { borderTopColor: selectedObs.color || "#7a6161ff" },
              ]}
            >
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButtonPopup}
                onPress={() => setSelectedObs(null)}
              >
                <Ionicons name="close" size={22} color="#7a6161ff" />
              </TouchableOpacity>

              {/* Header */}
              <Text style={styles.popupTitle}>
                {selectedObs.objectName || "Unknown Object"}
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Coordinates */}
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#7a6161ff" />
                {typeof selectedObs.latitude === "number" &&
                typeof selectedObs.longitude === "number" ? (
                  <Text style={styles.popupCoords}>
                    {selectedObs.latitude.toFixed(5)},{" "}
                    {selectedObs.longitude.toFixed(5)}
                  </Text>
                ) : (
                  <Text style={styles.popupCoords}>No coordinates</Text>
                )}
              </View>

              {/* Timestamp */}
              {selectedObs.capturedAt && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#7a6161ff" />
                  <Text style={styles.popupTime}>
                    {new Date(selectedObs.capturedAt).toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Recorded values */}
              {selectedObs.attributes && selectedObs.attributes.length > 0 && (
                <View style={styles.attrSection}>
                  <Text style={styles.attrHeader}>Recorded Values</Text>
                  {selectedObs.attributes.map((attr: any) => (
                    <View key={attr.id} style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{attr.name}</Text>
                      {attr.value?.toLowerCase() === "true" ||
                      attr.value?.toLowerCase() === "false" ? (
                        <View
                          style={[
                            styles.valueBadge,
                            attr.value?.toLowerCase() === "true"
                              ? styles.valueBadgeTrue
                              : styles.valueBadgeFalse,
                          ]}
                        >
                          <Text style={styles.valueBadgeText}>
                            {attr.value?.charAt(0).toUpperCase() +
                              attr.value?.slice(1).toLowerCase()}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.attrValue}>{attr.value}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Delete button */}
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  { backgroundColor: selectedObs.color || "#7a6161ff" },
                ]}
                onPress={() => handleDelete(selectedObs.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View />
          )}
        </View>
      </Modal>
    </View>
  );
}

// -----------------------------
// 💅 Styles
// -----------------------------
const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  markerButton: {
    position: "absolute",
    right: 20,
    backgroundColor: "#7a6161ff",
    padding: 12,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  enterDataWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },

  markerCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // -----------------------------
  // Popup Styling
  // -----------------------------
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupBox: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 14,
    width: "80%",
    alignItems: "flex-start",
    elevation: 8,
    borderTopWidth: 4,
    borderTopColor: "#7a6161ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  valueBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignSelf: "flex-end",
  },
  valueBadgeTrue: {
    backgroundColor: "#7ac77a33", // light green tint
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  valueBadgeFalse: {
    backgroundColor: "#ff7c7c33", // light red tint
    borderWidth: 1,
    borderColor: "#e53935",
  },
  valueBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  closeButtonPopup: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 4,
  },

  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c2c2c",
    alignSelf: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    width: "100%",
    marginVertical: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  popupCoords: {
    fontSize: 14,
    color: "#444",
    marginLeft: 6,
  },
  popupTime: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },

  // -----------------------------
  // Attributes Section
  // -----------------------------
  attrSection: {
    width: "100%",
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  attrHeader: {
    fontWeight: "600",
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  attrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  attrLabel: {
    fontSize: 13,
    color: "#555",
    flex: 1,
  },
  attrValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flexShrink: 1,
    textAlign: "right",
  },

  // -----------------------------
  // Delete Button
  // -----------------------------
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 18,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});
