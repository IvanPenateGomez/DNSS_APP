import migrations from "@/drizzle/migrations";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { openDatabaseSync, SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { Suspense, useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export const DATABASE_NAME = "GNSS_db";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const expoDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(expoDb);
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success) {
      // addIntialData(db);
    }
  }, [success, error]);
  const insets = useSafeAreaInsets();
  return (
    <Suspense
      fallback={
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
          }}
        >
          <ActivityIndicator size={"large"} />
        </View>
      }
    >
      <SQLiteProvider databaseName={DATABASE_NAME} useSuspense>
        <View
          style={{
            flex: 1,
            paddingBottom: Platform.OS == "android" ? insets.bottom : 0,
            paddingTop: 0,
          }}
        >
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </View>
      </SQLiteProvider>
    </Suspense>
  );
}
