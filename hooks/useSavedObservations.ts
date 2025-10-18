import { useSQLiteContext } from "expo-sqlite";
import { drizzle, useLiveQuery } from "drizzle-orm/expo-sqlite";
import { desc, eq } from "drizzle-orm";
import { observations, objectTypes } from "@/db/schema";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";

export function useSavedObservations(projectId?: number) {
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);
  const refreshDB = useRefreshDbStore((state) => state.refreshDB);

  // ✅ Proper join to include object type name + color
  const baseQuery = db
    .select({
      id: observations.id,
      sessionId: observations.session_id,
      objectTypeId: observations.object_type_id,
      latitude: observations.latitude,
      longitude: observations.longitude,
      capturedAt: observations.captured_at,
      notes: observations.notes,
      status: observations.status,

      // 🟢 Join + alias as `objectName` and `color`
      objectName: objectTypes.name,
      color: objectTypes.color,
    })
    .from(observations)
    .leftJoin(objectTypes, eq(observations.object_type_id, objectTypes.id))
    .orderBy(desc(observations.captured_at));

  // ✅ Optional project filter
  const query = projectId
    ? baseQuery.where(eq(objectTypes.project_id, projectId))
    : baseQuery;

  // ✅ Auto-refresh when DB changes
  return useLiveQuery(query, [refreshDB, projectId]);
}
