import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
};

export default function EnterDataButton({
  onPress,
  label = "Enter data",
  style,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name="edit" size={16} color="#3a3a3a" style={styles.icon} />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#63d391", // ✅ soft mint green
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6, // ✅ subtle rounded corners
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: "#3a3a3a", // ✅ dark gray text
    fontSize: 15,
    fontWeight: "500",
  },
});
