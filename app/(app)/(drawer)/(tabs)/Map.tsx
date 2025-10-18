import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawer } from "@/context/DrawerContext";
import EnterDataButton from "@/components/general/EnterDataButton";
import { useProjectObjects } from "@/hooks/useProjectObjects"; // ✅ import your live query hook

export default function Map({ projectId = 1 }: { projectId?: number }) {
  const [region, setRegion] = useState<Region | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showObjectSelect, setShowObjectSelect] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();

  const { data: objects, loading } = useProjectObjects(projectId);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location permission denied",
          "Showing default location: Enschede"
        );
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

  const handleMarkerPress = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      openDrawer();
    } catch (err) {
      Alert.alert("Error", "Could not fetch location");
    }
  };

  const handleEnterData = () => setShowPopup(true);

  const handleChooseCurrent = async () => {
    setShowPopup(false);
    try {
      const location = await Location.getCurrentPositionAsync({});
      console.log("📍 Using current location:", location.coords);
      // Open object selection modal
      setShowObjectSelect(true);
    } catch (err) {
      Alert.alert("Error", "Could not get your current location");
    }
  };

  const handleEnterManually = () => {
    setShowPopup(false);
    console.log("✏️ Enter coordinates manually");
  };

  const handleContinue = () => {
    if (!selectedObjectId) {
      Alert.alert("Please select an object first");
      return;
    }
    console.log("✅ Continue with object:", selectedObjectId);
    setShowObjectSelect(false);
    // Proceed to next screen or data entry form
  };

  if (!region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        provider="google"
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
      />

      {/* 📍 Marker Button */}
      <TouchableOpacity
        onPress={handleMarkerPress}
        activeOpacity={0.8}
        style={[styles.markerButton, { top: insets.top + 10 }]}
      >
        <Ionicons name="location-sharp" size={24} color="#fff" />
      </TouchableOpacity>

      {/* ✅ Enter Data Button */}
      <View style={[styles.enterDataWrapper, { bottom: insets.bottom + 100 }]}>
        <EnterDataButton onPress={handleEnterData} />
      </View>

      {/* 🪟 Data entry choice popup */}
      <Modal transparent visible={showPopup} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPopup(false)}
            >
              <Ionicons name="close" size={22} color="#7a6161ff" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Select data entry method</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleChooseCurrent}
            >
              <MaterialIcons
                name="my-location"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalOptionText}>Use current location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: "#b89a9a" }]}
              onPress={handleEnterManually}
            >
              <MaterialIcons
                name="edit-location"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalOptionText}>Enter coordinates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🧭 Object Selection Modal */}
      <Modal transparent visible={showObjectSelect} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { paddingBottom: 30 }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowObjectSelect(false)}
            >
              <Ionicons name="close" size={22} color="#7a6161ff" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Select an Object</Text>

            {loading ? (
              <ActivityIndicator size="small" color="#7a6161ff" />
            ) : (
              <ScrollView style={{ width: "100%", maxHeight: 250 }}>
                {objects.map((obj) => (
                  <TouchableOpacity
                    key={obj.id}
                    style={[
                      styles.objectCard,
                      selectedObjectId === obj.id && styles.objectCardSelected,
                    ]}
                    onPress={() => setSelectedObjectId(obj.id)}
                  >
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: obj.color },
                      ]}
                    />
                    <Text style={styles.objectText}>{obj.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[
                styles.modalOption,
                { marginTop: 20, backgroundColor: "#7a6161ff" },
              ]}
              onPress={handleContinue}
            >
              <Text style={styles.modalOptionText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markerButton: {
    position: "absolute",
    right: 20,
    backgroundColor: "#7a6161ff",
    padding: 12,
    borderRadius: 50,
    elevation: 5,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 14,
    width: "80%",
    alignItems: "center",
    elevation: 4,
  },
  closeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#7a6161ff",
    marginBottom: 20,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7a6161ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 6,
    width: "90%",
    justifyContent: "center",
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  objectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f2f0",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 5,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  objectCardSelected: {
    borderColor: "#7a6161ff",
    backgroundColor: "#f7ebe8",
  },
  colorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 10,
  },
  objectText: {
    fontSize: 15,
    color: "#333",
  },
});
