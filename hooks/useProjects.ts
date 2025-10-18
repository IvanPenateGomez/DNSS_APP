import { projects } from "@/db/schema";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { drizzle, useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { desc } from "drizzle-orm"; // ✅ import desc()

export function useProjects() {
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);

  const refreshDB = useRefreshDbStore((state) => state.refreshDB); // 👈 subscribe to counter

  // 🔁 Auto refresh whenever `refreshDB` changes
  return useLiveQuery(
    db.select().from(projects).orderBy(desc(projects.created_at)), // ✅ fixed here
    [refreshDB]
  );
}
