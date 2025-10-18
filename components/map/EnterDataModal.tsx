import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useProjectStore } from "@/zustand/projectId";
import { useProjectObjects } from "@/hooks/useProjectObjects";

type Step = "method" | "manual" | "object";

interface Props {
  visible: boolean;
  onClose: () => void;
  onContinue: (objectId: number, coords: { lat: number; lon: number }) => void;
}

export default function EnterDataModal({ visible, onClose, onContinue }: Props) {
  const [modalStep, setModalStep] = useState<Step>("method");
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // ✅ projectId from store
  const projectId = useProjectStore((state) => state.projectId);
  const { data: objects, loading } = useProjectObjects(projectId);

  const handleChooseCurrent = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCoords({ lat: latitude, lon: longitude });
      setModalStep("object");
    } catch {
      Alert.alert("Error", "Could not get current location");
    }
  };
  useEffect(() => {
    if (visible) {
      setModalStep("method");
      setManualLat("");
      setManualLon("");
      setSelectedObjectId(null);
      setCoords(null);
    }
  }, [visible]);
  const handleEnterManually = () => setModalStep("manual");

  const handleManualConfirm = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert("Invalid input", "Please enter valid numeric coordinates.");
      return;
    }
    setCoords({ lat, lon });
    setModalStep("object");
  };

  const handleContinue = () => {
    if (!selectedObjectId || !coords) {
      Alert.alert("Missing info", "Please select an object and location first.");
      return;
    }
    onContinue(selectedObjectId, coords);
    onClose();
    setModalStep("method");
    setSelectedObjectId(null);
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { paddingBottom: 30 }]}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#7a6161ff" />
          </TouchableOpacity>

          {modalStep === "method" && (
            <>
              <Text style={styles.modalTitle}>Select data entry method</Text>

              <TouchableOpacity style={styles.modalOption} onPress={handleChooseCurrent}>
                <MaterialIcons name="my-location" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.modalOptionText}>Use current location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: "#b89a9a" }]}
                onPress={handleEnterManually}
              >
                <MaterialIcons name="edit-location" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.modalOptionText}>Enter coordinates</Text>
              </TouchableOpacity>
            </>
          )}

          {modalStep === "manual" && (
            <>
              <Text style={styles.modalTitle}>Enter Coordinates</Text>

              <TextInput
                placeholder="Latitude"
                value={manualLat}
                onChangeText={setManualLat}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#aaa"
              />
              <TextInput
                placeholder="Longitude"
                value={manualLon}
                onChangeText={setManualLon}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#aaa"
              />

              <TouchableOpacity
                style={[styles.modalOption, { marginTop: 15, backgroundColor: "#7a6161ff" }]}
                onPress={handleManualConfirm}
              >
                <Text style={styles.modalOptionText}>Confirm</Text>
              </TouchableOpacity>
            </>
          )}

          {modalStep === "object" && (
            <>
              <Text style={styles.modalTitle}>Select an Object</Text>

              {coords && (
                <Text style={styles.coordText}>
                  Coordinates:{" "}
                  <Text style={{ fontWeight: "600" }}>
                    {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                  </Text>
                </Text>
              )}

              {loading ? (
                <ActivityIndicator size="small" color="#7a6161ff" />
              ) : objects.length === 0 ? (
                <Text style={styles.emptyText}>No objects found for this project.</Text>
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
                      <View style={[styles.colorCircle, { backgroundColor: obj.color }]} />
                      <Text style={styles.objectText}>{obj.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.modalOption, { marginTop: 20, backgroundColor: "#7a6161ff" }]}
                onPress={handleContinue}
              >
                <Text style={styles.modalOptionText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    width: "90%",
    fontSize: 15,
    color: "#333",
  },
  coordText: {
    color: "#555",
    fontSize: 14,
    marginBottom: 12,
  },
  emptyText: {
    color: "#777",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
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
