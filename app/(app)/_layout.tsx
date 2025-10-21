import { GLOBAL_APP_COLOR } from "@/constants/GlobalStyles";
import DrawerContextProvider, { useDrawer } from "@/context/DrawerContext";
import { Ionicons } from "@expo/vector-icons";
import { useSavedObservationsGrouped } from "@/hooks/useSavedObservationsGrouped";
import { useProjectStore } from "@/zustand/projectId";
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
import { drizzle } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";
import { useSQLiteContext } from "expo-sqlite";
import { observations } from "@/db/schema";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";

const drawerWidth = 260;

export default function MenuStack() {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height + insets.top;

  function CustomDrawerContent() {
    const { drawerData } = useDrawer();
    const [search, setSearch] = useState("");
    const projectId = useProjectStore((s) => s.projectId);
    const { data: groupedData, isLoading } = useSavedObservationsGrouped(projectId);
    const sqliteDb = useSQLiteContext();
    const db = drizzle(sqliteDb);
    const refreshDB = useRefreshDbStore((s) => s.increment);

    // Flatten grouped data into headers + items
    const flatData = useMemo(() => {
      if (!groupedData) return [];
      return groupedData.flatMap((group) => [
        { type: "header", ...group },
        ...group.items.map((obs) => ({
          type: "item",
          ...obs,
          parentColor: group.color,
          parentId: group.objectTypeId,
        })),
      ]);
    }, [groupedData]);

    // Filter search
    const filteredItems = useMemo(() => {
      const query = search.trim().toLowerCase();
      if (!query) return flatData;
      return flatData.filter((item) =>
        item.type === "header"
          ? item.objectName?.toLowerCase().includes(query)
          : item.objectName?.toLowerCase().includes(query) ||
            item.attributes?.some((a) => a.name.toLowerCase().includes(query))
      );
    }, [search, flatData]);

    // 🟩 Toggle one observation
    const toggleObservationVisible = async (id: number, current: boolean) => {
      try {
        console.log("settign...", current.valueOf)
        await db
          .update(observations)
          .set({ mapVisible: !current })
          .where(eq(observations.id, id))
          .execute();
        refreshDB();
      } catch (err) {
        console.error("Failed to toggle mapVisible:", err);
      }
    };

    // 🟩 Toggle all observations in a group
    const toggleGroupVisible = async (objectTypeId: number, newValue: boolean) => {
      try {
        await db
          .update(observations)
          .set({ mapVisible: newValue })
          .where(eq(observations.object_type_id, objectTypeId))
          .execute();
        refreshDB();
      } catch (err) {
        console.error("Failed to toggle group mapVisible:", err);
      }
    };

    // 🎨 Render each row
    const renderItem = ({ item }: { item: any }) => {
      // ───── HEADER ─────
      if (item.type === "header") {
        const allVisible = item.items.every((i) => i.mapVisible);
        const color = item.color || GLOBAL_APP_COLOR;

        return (
          <View
            style={[
              styles.sectionHeader,
              { borderLeftColor: color },
            ]}
          >
            <TouchableOpacity
              onPress={() => toggleGroupVisible(item.objectTypeId, !allVisible)}
              style={styles.checkboxContainer}
              activeOpacity={0.8}
            >
              <Ionicons
                name={allVisible ? "checkbox" : "square-outline"}
                size={20}
                color={color}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.sectionTitle, { color }]}>{item.objectName}</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // ───── ITEM ─────
      const color = item.parentColor || GLOBAL_APP_COLOR;
      const hasAnswers = item.attributes && item.attributes.length > 0;
      const isVisible = item.mapVisible;

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.itemContainer,
            { borderLeftColor: color, borderLeftWidth: 4 },
          ]}
          onPress={() => toggleObservationVisible(item.id, isVisible)}
        >
          <Ionicons
            name={isVisible ? "checkbox" : "square-outline"}
            size={20}
            color={color}
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemText}>Observation #{item.id}</Text>
            <Text style={styles.subText}>
              {hasAnswers
                ? `${item.attributes.length} ${
                    item.attributes.length === 1 ? "value" : "values"
                  } recorded`
                : "No data yet"}
            </Text>
          </View>
          {hasAnswers && (
            <Ionicons name="checkmark-circle" size={20} color={color} />
          )}
        </TouchableOpacity>
      );
    };

    // Empty state
    const ListEmptyComponent = () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {isLoading ? "Loading observations..." : "No observations found"}
        </Text>
      </View>
    );

    return (
      <View style={{ width: drawerWidth, height: screenHeight }}>
        {/* 🔍 Search Bar */}
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
            placeholder="Search objects or attributes..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* 📋 List */}
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.type}-${item.id ?? index}`}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 10,
            gap: 8,
            backgroundColor: "white",
            paddingBottom: insets.bottom + 40,
          }}
        />
      </View>
    );
  }

  return (
    <DrawerContextProvider>
      <Drawer
        id="drawer"
        drawerContent={CustomDrawerContent}
        screenOptions={{
          swipeEdgeWidth: 0,
          drawerType: "front",
          drawerPosition: "right",
          drawerHideStatusBarOnOpen: Platform.OS === "ios",
          drawerStyle: { width: drawerWidth },
        }}
      >
        <Drawer.Screen name="(drawer)" options={{ headerShown: false }} />
      </Drawer>
    </DrawerContextProvider>
  );
}

// -----------------------------
// 💅 Styles
// -----------------------------
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
  sectionHeader: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderLeftWidth: 5,
    borderRadius: 6,
    backgroundColor: "#f8f8f8",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  itemText: {
    fontSize: 14.5,
    color: "#222",
    fontWeight: "600",
  },
  subText: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
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
