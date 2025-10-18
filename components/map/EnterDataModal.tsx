import React, { useState, useEffect } from "react";
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
type ValueType = "select" | "boolean" | "text";

interface Props {
  visible: boolean;
  onClose: () => void;
  onContinue: (objectId: number, coords: { lat: number; lon: number }) => void;
}

export default function EnterDataModal({ visible, onClose, onContinue }: Props) {
  const [modalStep, setModalStep] = useState<Step>("method");
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [expandedObjectId, setExpandedObjectId] = useState<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<Record<number, any>>({}); // attrId -> value(s)
  const projectId = useProjectStore((s) => s.projectId);
  const { data: objects, loading } = useProjectObjects(projectId);

  // Reset when opening modal
  useEffect(() => {
    if (visible) {
      setModalStep("method");
      setManualLat("");
      setManualLon("");
      setCoords(null);
      setExpandedObjectId(null);
      setSelectedValues({});
    }
  }, [visible]);

  // ------------------ Step 1: Location handling ------------------
  const handleChooseCurrent = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCoords({ lat: latitude, lon: longitude });
      setModalStep("object");
    } catch {
      Alert.alert("Error", "Could not get your current location");
    }
  };

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

  // ------------------ Step 2: Object & Attribute Logic ------------------

  const toggleExpand = (objectId: number) => {
    setExpandedObjectId((prev) => (prev === objectId ? null : objectId));
  };

  const handleValueToggle = (attrId: number, value: string, valueType: ValueType) => {
    setSelectedValues((prev) => {
      const current = prev[attrId] ?? (valueType === "select" ? [] : null);

      if (valueType === "boolean") {
        return { ...prev, [attrId]: value }; // single true/false
      }

      if (Array.isArray(current)) {
        const exists = current.includes(value);
        return { ...prev, [attrId]: exists ? current.filter((v) => v !== value) : [...current, value] };
      }

      return prev;
    });
  };

  const handleContinue = () => {
    if (!coords) {
      Alert.alert("Missing info", "Please select a location first.");
      return;
    }

    console.log("✅ Final selection:");
    console.log("Coordinates:", coords);
    console.log("Selected attribute values:", selectedValues);

    onContinue(expandedObjectId ?? 0, coords);
    onClose();
  };

  // ------------------ Render ------------------
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
                <ScrollView style={{ width: "100%", maxHeight: 380 }}>
                  {objects.map((obj) => {
                    const expanded = expandedObjectId === obj.id;
                    return (
                      <View key={obj.id}>
                        {/* Object Header */}
                        <TouchableOpacity
                          style={[
                            styles.objectCard,
                            { backgroundColor: expanded ? "#e5f5e0" : "#f5f2f0" },
                          ]}
                          onPress={() => toggleExpand(obj.id)}
                        >
                          <Text style={[styles.objectText, { color: "#333", fontWeight: "600" }]}>
                            {obj.name}
                          </Text>
                        </TouchableOpacity>

                        {/* Expanded Attributes */}
                        {expanded && (
                          <View style={styles.attrContainer}>
                            {obj.attributes.map((attr) => (
                              <View key={attr.id} style={styles.attrBlock}>
                                <Text style={styles.attrTitle}>{attr.name}</Text>

                                {/* SELECT TYPE */}
                                {attr.valueType === "select" && (
                                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {attr.values.map((val) => {
                                      const selected = selectedValues[attr.id]?.includes(val.name);
                                      return (
                                        <TouchableOpacity
                                          key={val.id}
                                          style={[
                                            styles.valueChip,
                                            selected && styles.valueChipSelected,
                                          ]}
                                          onPress={() =>
                                            handleValueToggle(attr.id, val.name, attr.valueType)
                                          }
                                        >
                                          <Text
                                            style={{
                                              color: selected ? "#fff" : "#333",
                                              fontWeight: "500",
                                            }}
                                          >
                                            {val.name}
                                          </Text>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </ScrollView>
                                )}

                                {/* BOOLEAN TYPE */}
                                {attr.valueType === "boolean" && (
                                  <View style={styles.booleanRow}>
                                    {["True", "False"].map((opt) => {
                                      const selected = selectedValues[attr.id] === opt;
                                      return (
                                        <TouchableOpacity
                                          key={opt}
                                          style={[
                                            styles.boolButton,
                                            selected &&
                                              (opt === "True"
                                                ? styles.boolTrue
                                                : styles.boolFalse),
                                          ]}
                                          onPress={() =>
                                            handleValueToggle(attr.id, opt, attr.valueType)
                                          }
                                        >
                                          <Text
                                            style={{
                                              color: selected ? "#fff" : "#333",
                                              fontWeight: "500",
                                            }}
                                          >
                                            {opt}
                                          </Text>
                                        </TouchableOpacity>
                                      );
                                    })}
                                  </View>
                                )}
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
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

// ---------------- STYLES ----------------
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
    width: "85%",
    alignItems: "center",
    elevation: 4,
  },
  closeButton: { position: "absolute", right: 12, top: 12, padding: 4 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#7a6161ff",
    marginBottom: 15,
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
  modalOptionText: { color: "#fff", fontSize: 15, fontWeight: "500" },
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
  coordText: { color: "#555", fontSize: 14, marginBottom: 12 },
  emptyText: { color: "#777", fontSize: 14, textAlign: "center", marginVertical: 20 },
  objectCard: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 5,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  objectText: { fontSize: 16 },
  attrContainer: {
    marginLeft: 12,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 8,
  },
  attrBlock: { marginVertical: 5 },
  attrTitle: { fontSize: 15, fontWeight: "500", color: "#555", marginBottom: 4 },
  valueChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e6e6e6",
    borderRadius: 20,
    marginRight: 8,
  },
  valueChipSelected: { backgroundColor: "#7a6161ff" },
  booleanRow: { flexDirection: "row", gap: 10 },
  boolButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  boolTrue: { backgroundColor: "#7ac77a" },
  boolFalse: { backgroundColor: "#de6d6d" },
});
