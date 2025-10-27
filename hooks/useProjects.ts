import { projects } from "@/db/schema";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { drizzle, useLiveQuery } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync, useSQLiteContext } from "expo-sqlite";
import { desc } from "drizzle-orm"; // ✅ import desc()
import { DATABASE_NAME } from "@/app/_layout";

export function useProjects() {
  const expoDb = openDatabaseSync(DATABASE_NAME, {
    useNewConnection: true,
  });
  const db = drizzle(expoDb);

  const refreshDB = useRefreshDbStore((state) => state.refreshDB); // 👈 subscribe to counter

  // 🔁 Auto refresh whenever `refreshDB` changes
  return useLiveQuery(
    db.select().from(projects).orderBy(desc(projects.created_at)), // ✅ fixed here
    [refreshDB]
  );
}
