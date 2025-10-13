import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawer } from "@/context/DrawerContext"; // ✅ import your context hook

export default function Map() {
  const [region, setRegion] = useState<Region | null>(null);
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer(); // ✅ access drawer control

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
      // ✅ Open drawer when pressed
      openDrawer();
    } catch (err) {
      Alert.alert("Error", "Could not fetch location");
    }
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

      {/* 📍 Marker Button — top right */}
      <TouchableOpacity
        onPress={handleMarkerPress}
        activeOpacity={0.8}
        style={[
          styles.markerButton,
          { top: insets.top + 10 }, // respect safe area
        ]}
      >
        <Ionicons name="location-sharp" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markerButton: {
    position: "absolute",
    right: 20,
    backgroundColor: "#7a6161ff", // match your app color
    padding: 12,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
