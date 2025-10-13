import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WelcomeScreen = () => {
  const router = useRouter();
  const db = useSQLiteContext();
  useEffect(() => {
    const loadData = async () => {
      //Will output local db path to console
      console.log(db.databasePath);
    };

    loadData();
  }, []);

  const handleNewProject = () => {
    // TODO: navigate to new project setup page
    router.push("/(tabs)");
    console.log("New Project pressed");
  };

  const handleImportProject = () => {
    // TODO: navigate to import project flow
    console.log("Import Project pressed");
  };
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: 120 },
      ]}
    >
      <Text style={styles.title}>Welcome to Survey App</Text>
      <Text style={styles.subtitle}>
        Get started by creating a new project or importing an existing one.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handleNewProject}
        >
          <Text style={styles.buttonText}>New Project</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleImportProject}
        >
          <Text style={styles.buttonText}>Import Project</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  tabBarStyle: {
    display: "none",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f2f0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#7a6161ff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#544141ff",
    textAlign: "center",
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#7a6161ff",
    paddingVertical: 15,
    borderRadius: 10,
    width: "80%",
    marginBottom: 15,
  },
  buttonSecondary: {
    backgroundColor: "#b89a9aff",
    paddingVertical: 15,
    borderRadius: 10,
    width: "80%",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
