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

export function useSavedObservationsGrouped(projectId?: number) {
  const expoDb = openDatabaseSync(DATABASE_NAME, {
    useNewConnection: true,
  });
  const db = drizzle(expoDb);
  const refreshDB = useRefreshDbStore((state) => state.refreshDB);

  // ✅ Query all observations + object info
  const { data: baseObservations } = useLiveQuery(
    db
      .select({
        id: observations.id,
        sessionId: observations.session_id,
        objectTypeId: observations.object_type_id,
        latitude: observations.latitude,
        longitude: observations.longitude,
        capturedAt: observations.captured_at,
        notes: observations.notes,
        status: observations.status,
        mapVisible: observations.mapVisible, 
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
              eq(surveySessions.project_id, projectId)
            )
          : undefined
      )
      .orderBy(desc(observations.captured_at)),
    [projectId, refreshDB]
  );

  // ✅ Query all attribute coordinate values
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

  // ✅ Merge attributes into each observation
  const merged = (baseObservations ?? []).map((obs) => ({
    ...obs,
    attributes: (attributeValues ?? [])
      .filter((v) => v.observationId === obs.id)
      .map((v) => ({
        id: v.attributeId,
        name: v.attributeName,
        value: v.valueText,
      })),
  }));

  // ✅ Group by object type
  const grouped = merged.reduce((acc, obs) => {
    const existingGroup = acc.find((g) => g.objectTypeId === obs.objectTypeId);
    if (existingGroup) {
      existingGroup.items.push(obs);
    } else {
      acc.push({
        objectTypeId: obs.objectTypeId,
        objectName: obs.objectName,
        color: obs.color,
        items: [obs],
      });
    }
    return acc;
  }, [] as {
    objectTypeId: number;
    objectName: string | null;
    color: string | null;
    items: typeof merged;
  }[]);

  return { data: grouped, isLoading: !baseObservations };
}
