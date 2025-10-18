import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  onPress?: () => void;
  style?: ViewStyle;
  label?: string | null | undefined;
};

export default function BackButton({ onPress, style, label }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) onPress();
    else router.back();
  };

  return (
    <View style={[styles.headerContainer, style]}>
      {/* Left: Back button */}
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <MaterialIcons name="chevron-left" size={28} color={"#fff"} />
      </TouchableOpacity>

      {/* Middle: Optional label */}
      {label ? (
        <View style={styles.centerLabelContainer}>
          <Text style={styles.centerLabelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "relative",
  },
  button: {
    position: "absolute",
    left: 10,
    backgroundColor: "#7a6161ff", // your signature brownish accent
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 12,
    zIndex: 30,
    shadowColor: "#7a6161ff",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 4,
  },
  centerLabelContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabelText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7a6161ff", // matches main accent
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
