import { GLOBAL_APP_COLOR } from "@/constants/GlobalStyles";
import DrawerContextProvider, { useDrawer } from "@/context/DrawerContext";
import { Ionicons } from "@expo/vector-icons";
import Drawer from "expo-router/drawer";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const drawerWidth = 240;

const exampleItems = [
  { id: 1, label: "Tree", icon: "leaf-outline" },
  { id: 2, label: "Car", icon: "car-outline" },
  { id: 3, label: "Hospital", icon: "medical-outline" },
  { id: 4, label: "School", icon: "school-outline" },
  { id: 5, label: "Restaurant", icon: "restaurant-outline" },
  { id: 6, label: "Bus Stop", icon: "bus-outline" },
  { id: 7, label: "Park", icon: "walk-outline" },
];

export default function menuStack() {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height + insets.top;

  function customDrawerContent() {
    const { drawerData } = useDrawer();
    const [search, setSearch] = useState("");

    // 🔍 Filtered items (case-insensitive)
    const filteredItems = useMemo(() => {
      const query = search.trim().toLowerCase();
      if (!query) return exampleItems;
      return exampleItems.filter((i) => i.label.toLowerCase().includes(query));
    }, [search]);

    const renderItem = ({ item }: { item: (typeof exampleItems)[0] }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.itemContainer}
        onPress={() => console.log("Pressed:", item.label)}
      >
        <Ionicons
          name={item.icon as any}
          size={20}
          color={GLOBAL_APP_COLOR}
          style={{ marginRight: 10 }}
        />
        <Text style={styles.itemText}>{item.label}</Text>
      </TouchableOpacity>
    );

    const ListEmptyComponent = () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No attributes found</Text>
      </View>
    );

    return (
      <View style={{ width: drawerWidth, height: screenHeight }}>
        {/* 🔎 Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { marginTop: insets.top + 10, marginBottom: 10 },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color="#888"
            style={{ marginRight: 6 }}
          />
          <TextInput
            placeholder="Search attributes..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* 📋 List */}
        <FlatList
          bounces={false}
          ListFooterComponent={
            <View style={{ marginBottom: insets.bottom + 40 }} />
          }
          showsVerticalScrollIndicator={false}
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{
            paddingVertical: 10,
            gap: 10,
            backgroundColor: "white",
          }}
        />
      </View>
    );
  }

  return (
    <DrawerContextProvider>
      <Drawer
        //@ts-ignore
        id={"drawer"}
        drawerContent={customDrawerContent}
        screenOptions={{
          swipeEdgeWidth: 0,
          drawerType: "front",
          drawerPosition: "right",
          drawerHideStatusBarOnOpen: Platform.OS === "ios",
          drawerStyle: {
            width: drawerWidth,
          },
        }}
      >
        <Drawer.Screen name="(drawer)" options={{ headerShown: false }} />
      </Drawer>
    </DrawerContextProvider>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    marginHorizontal: 14,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  searchInput: {
    flex: 1,
    color: "#333",
    fontSize: 14,
    paddingVertical: 4,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  itemText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
});
