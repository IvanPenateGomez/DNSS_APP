import { useSQLiteContext } from "expo-sqlite";
import { drizzle, useLiveQuery } from "drizzle-orm/expo-sqlite";
import { desc, eq, and } from "drizzle-orm";
import { observations, objectTypes, surveySessions } from "@/db/schema";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";

export function useSavedObservations(projectId?: number) {
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);
  const refreshDB = useRefreshDbStore((state) => state.refreshDB);

  console.log("projectId: ", projectId)

  // ✅ Build one complete joined query
  const query = db
    .select({
      id: observations.id,
      sessionId: observations.session_id,
      objectTypeId: observations.object_type_id,
      latitude: observations.latitude,
      longitude: observations.longitude,
      capturedAt: observations.captured_at,
      notes: observations.notes,
      status: observations.status,
      objectName: objectTypes.name,
      color: objectTypes.color,
    })
    .from(observations)
    .leftJoin(objectTypes, eq(observations.object_type_id, objectTypes.id))
    .leftJoin(surveySessions, eq(observations.session_id, surveySessions.id))
    .where(
      projectId
        ? and(eq(objectTypes.project_id, projectId), eq(surveySessions.project_id, projectId))
        : undefined
    )
    .orderBy(desc(observations.captured_at));

  // ✅ Single reactive query
  return useLiveQuery(query, [projectId, refreshDB]);
}
