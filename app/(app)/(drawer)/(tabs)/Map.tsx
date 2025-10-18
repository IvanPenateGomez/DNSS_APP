import EnterDataButton from "@/components/general/EnterDataButton";
import EnterDataModal from "@/components/map/EnterDataModal";
import { useDrawer } from "@/context/DrawerContext";
import { observations } from "@/db/schema";
import { useSavedObservations } from "@/hooks/useSavedObservations";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as Location from "expo-location";
import { useSQLiteContext } from "expo-sqlite";
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
  const [region, setRegion] = useState<Region | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedObs, setSelectedObs] = useState<any | null>(null);
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();

  // 🔹 Hooks
  const { data: observationsData } = useSavedObservations();

  console.log("observationsData: ", observationsData);
  const isLoading = !observationsData;
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);

  // -----------------------------
  // 📍 Initial map setup
  // -----------------------------
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Showing default location: Enschede");
        setRegion({
          latitude: 52.2215,
          longitude: 6.8937,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
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
      <Modal visible={!!selectedObs} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          {/* guard render */}
          {selectedObs ? (
            <View style={styles.popupBox}>
              {/* title */}
              <Text style={styles.popupTitle}>
                {selectedObs.objectName || "Unknown Object"}
              </Text>
              {/* coords safe render */}
              {typeof selectedObs.latitude === "number" &&
              typeof selectedObs.longitude === "number" ? (
                <Text style={styles.popupCoords}>
                  {selectedObs.latitude.toFixed(5)},{" "}
                  {selectedObs.longitude.toFixed(5)}
                </Text>
              ) : (
                <Text style={styles.popupCoords}>No coordinates</Text>
              )}

              {/* timestamp safe render */}
              {selectedObs.capturedAt ? (
                <Text style={styles.popupTime}>
                  {new Date(selectedObs.capturedAt).toLocaleString()}
                </Text>
              ) : null}

              {/* delete */}
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  { backgroundColor: selectedObs.color || "#7a6161ff" },
                ]}
                onPress={() => handleDelete(selectedObs.id)}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>

              {/* close */}
              <TouchableOpacity
                style={styles.closeButtonPopup}
                onPress={() => setSelectedObs(null)}
              >
                <Ionicons name="close" size={20} color="#7a6161ff" />
              </TouchableOpacity>
            </View>
          ) : (
            // fallback render when null
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
    shadowOpacity: 0.2,
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
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "75%",
    alignItems: "center",
    elevation: 5,
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  popupCoords: {
    fontSize: 14,
    color: "#555",
  },
  popupTime: {
    fontSize: 13,
    color: "#777",
    marginVertical: 6,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  deleteText: { color: "#fff", fontWeight: "500" },
  closeButtonPopup: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 4,
  },
});
