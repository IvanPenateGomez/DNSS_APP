import { openDatabaseSync, useSQLiteContext } from "expo-sqlite";
import { drizzle, useLiveQuery } from "drizzle-orm/expo-sqlite";
import { desc, eq, and } from "drizzle-orm";
import {
  observations,
  objectTypes,
  surveySessions,
  attributeCoordinateValues,
  attributes,
} from "@/db/schema";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { DATABASE_NAME } from "@/app/_layout";

export function useSavedObservations(projectId?: number) {
  const expoDb = openDatabaseSync(DATABASE_NAME, {
    useNewConnection: true,
  });
  const db = drizzle(expoDb);
  const refreshDB = useRefreshDbStore((state) => state.refreshDB);

  // ✅ Main observations query (only mapVisible = true)
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
      mapVisible: observations.mapVisible, // ✅ include field
      objectName: objectTypes.name,
      color: objectTypes.color,
    })
    .from(observations)
    .leftJoin(objectTypes, eq(observations.object_type_id, objectTypes.id))
    .leftJoin(surveySessions, eq(observations.session_id, surveySessions.id))
    .where(
      projectId
        ? and(
            eq(objectTypes.project_id, projectId),
            eq(surveySessions.project_id, projectId),
            eq(observations.mapVisible, true) // ✅ only visible ones
          )
        : eq(observations.mapVisible, true) // ✅ when no projectId
    )
    .orderBy(desc(observations.captured_at));

  // ✅ Live query for reactive updates
  const { data: baseObservations } = useLiveQuery(query, [projectId, refreshDB]);

  // ✅ Attribute values
  const { data: attributeValues } = useLiveQuery(
    db
      .select({
        observationId: attributeCoordinateValues.observation_id,
        attributeId: attributeCoordinateValues.attribute_id,
        valueText: attributeCoordinateValues.value_text,
        attributeName: attributes.label,
      })
      .from(attributeCoordinateValues)
      .leftJoin(attributes, eq(attributeCoordinateValues.attribute_id, attributes.id)),
    [refreshDB]
  );

  // ✅ Merge attributes with visible observations
  const merged = (baseObservations ?? []).map((obs) => ({
    ...obs,
    attributes: (attributeValues ?? [])
      .filter((val) => val.observationId === obs.id)
      .map((val) => ({
        id: val.attributeId,
        name: val.attributeName,
        value: val.valueText,
      })),
  }));

  return { data: merged, isLoading: !baseObservations };
}
