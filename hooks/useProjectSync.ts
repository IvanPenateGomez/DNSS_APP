import { useEffect } from "react";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { eq } from "drizzle-orm";
import { objectTypes, attributes } from "@/db/schema";
import { ObjectItem, ValueType } from "@/components/new-project helper/form";

export function useProjectSync(
  projectId: number,
  objects: ObjectItem[],
  setObjects: (data: ObjectItem[]) => void
) {
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);

  // --- LOAD PROJECT DATA FROM DB ---
  useEffect(() => {
    if (!projectId || projectId === 0) return;

    const loadFromDatabase = async () => {
      try {
        console.log("📦 Loading project data for:", projectId);

        // 1️⃣ Fetch all object types
        const dbObjects = await db
          .select()
          .from(objectTypes)
          .where(eq(objectTypes.project_id, projectId))
          .orderBy(objectTypes.order_index);

        // 2️⃣ Fetch all attributes
        const dbAttributes = await db
          .select()
          .from(attributes)
          .orderBy(attributes.order_index);

        // 3️⃣ Map nested data structure
        const mapped: ObjectItem[] = dbObjects.map((obj) => ({
          id: obj.id,
          name: obj.name,
          color: obj.color ?? "#cccccc",
          attributes: dbAttributes
            .filter((a) => a.object_type_id === obj.id)
            .map((attr) => ({
              id: attr.id,
              name: attr.label,
              valueType: attr.type as ValueType,
              values: [],
            })),
        }));

        setObjects(mapped);
        console.log("✅ Loaded project:", projectId, mapped.length, "objects");
      } catch (err) {
        console.error("❌ Failed to load project data:", err);
      }
    };

    loadFromDatabase();
  }, [projectId]);

  // --- SAVE PROJECT DATA TO DB ---
  useEffect(() => {
    if (!projectId || projectId === 0) return;

    const saveToDatabase = async () => {
      try {
        console.log("💾 Saving project data for:", projectId);

        // 1️⃣ Delete old object types (cascade removes attributes)
        await db.delete(objectTypes).where(eq(objectTypes.project_id, projectId));

        // 2️⃣ Insert updated object structure
        for (const [i, obj] of objects.entries()) {
          const inserted = await db
            .insert(objectTypes)
            .values({
              project_id: projectId,
              name: obj.name,
              color: obj.color,
              order_index: i,
            })
            .returning({ id: objectTypes.id });

          const objectTypeId = inserted[0]?.id;
          if (!objectTypeId) continue;

          for (const [j, attr] of obj.attributes.entries()) {
            await db.insert(attributes).values({
              object_type_id: objectTypeId,
              label: attr.name,
              key: attr.name.toLowerCase().replace(/\s+/g, "_"),
              type: attr.valueType,
              required: false,
              order_index: j,
            });
          }
        }

        console.log("✅ Synced project data for:", projectId);
      } catch (err) {
        console.error("❌ Failed to save project data:", err);
      }
    };

    saveToDatabase();
  }, [objects, projectId]);
}
