import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EnterDataButton from "@/components/general/EnterDataButton";
import { useDrawer } from "@/context/DrawerContext";
import EnterDataModal from "@/components/map/EnterDataModal";

export default function Map() {
  const [region, setRegion] = useState<Region | null>(null);
  const [showModal, setShowModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();

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
    } catch {
      Alert.alert("Error", "Could not fetch location");
    }
  };

  const handleContinue = (objectId: number, coords: { lat: number; lon: number }) => {
    console.log("✅ Continue with:", { objectId, coords });
    // TODO: open observation creation screen
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
      />

      <TouchableOpacity
        onPress={handleMarkerPress}
        activeOpacity={0.8}
        style={[styles.markerButton, { top: insets.top + 10 }]}
      >
        <Ionicons name="location-sharp" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={[styles.enterDataWrapper, { bottom: insets.bottom + 100 }]}>
        <EnterDataButton onPress={() => setShowModal(true)} />
      </View>

      <EnterDataModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onContinue={handleContinue}
      />
    </View>
  );
}

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
});
