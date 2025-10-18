import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import {
  surveySessions,
  observations,
  attributeValues,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function saveObservation(
  db: ExpoSQLiteDatabase,
  projectId: number,
  objectId: number,
  coords: { lat: number; lon: number },
  selectedValues: Record<number, string | string[]>
) {
  if (!projectId || !objectId) {
    console.warn("⚠️ Missing projectId or objectId in saveObservation");
    return;
  }

  const now = Date.now();

  await db.transaction(async (tx) => {
    // 1️⃣ Ensure session exists (or create one)
    let sessionId: number | undefined;

    const existingSession = await tx
      .select({ id: surveySessions.id })
      .from(surveySessions)
      .where(eq(surveySessions.project_id, projectId))
      .limit(1)
      .execute();

    if (existingSession.length > 0) {
      sessionId = existingSession[0].id;
    } else {
      const insertedSession = await tx
        .insert(surveySessions)
        .values({
          project_id: projectId,
          started_at: now,
        })
        .returning({ id: surveySessions.id })
        .execute();

      sessionId = insertedSession?.[0]?.id;
    }

    if (!sessionId) throw new Error("Failed to get or create session");

    // 2️⃣ Create new observation
    const insertedObs = await tx
      .insert(observations)
      .values({
        session_id: sessionId,
        object_type_id: objectId,
        latitude: coords.lat,
        longitude: coords.lon,
        captured_at: now,
        status: "draft",
      })
      .returning({ id: observations.id })
      .execute();

    const observationId = insertedObs?.[0]?.id;
    if (!observationId) throw new Error("Failed to create observation");

    // 3️⃣ Save attribute values
    for (const [attrId, val] of Object.entries(selectedValues)) {
      if (!val) continue;

      if (Array.isArray(val)) {
        // select (multi)
        for (const v of val) {
          await tx
            .insert(attributeValues)
            .values({
              observation_id: observationId,
              attribute_id: Number(attrId),
              value_text: v,
            })
            .execute();
        }
      } else {
        // boolean or text
        await tx
          .insert(attributeValues)
          .values({
            observation_id: observationId,
            attribute_id: Number(attrId),
            value_text: val,
          })
          .execute();
      }
    }

    console.log("✅ Observation + attribute values saved:", observationId);
  });
}
