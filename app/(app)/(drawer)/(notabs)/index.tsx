import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import WelcomeScreen from "@/components/home/WelcomeScreen";

const index = () => {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();


  useEffect(() => {
    const loadData = async () => {
      console.log("📂 Database path2:", db.databasePath);
    };
    loadData();
  }, [db]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: 120 },
      ]}
    >
      <WelcomeScreen />
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f2f0",
  },
});
