import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

type Props = {
  onPress?: () => void;
  style?: ViewStyle;
  label?: string;
};

export default function BackButton({ onPress, style, label }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) onPress();
    else router.back(); // ✅ Default goBack behavior
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
      <MaterialIcons name="chevron-left" size={28} color={"white"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#7a6161ff", // same as your primary color
    paddingVertical: 5,
    paddingHorizontal:5,
    borderRadius: 12,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
