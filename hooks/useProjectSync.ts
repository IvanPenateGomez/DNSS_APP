import { useEffect } from "react";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { eq } from "drizzle-orm";
import { objectTypes, attributes, attributeValues } from "@/db/schema";
import { ObjectItem, ValueType } from "@/components/new-project helper/form";

export function useProjectSync(
  projectId: number,
  objects: ObjectItem[],
  setObjects: (data: ObjectItem[]) => void
) {
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);

  // --- LOAD PROJECT DATA ---
  useEffect(() => {
    if (!projectId || projectId === 0) return;

    const loadFromDatabase = async () => {
      try {
        console.log("📦 Loading project data for:", projectId);

        // 1️⃣ Fetch all objects and attributes
        const dbObjects = await db
          .select()
          .from(objectTypes)
          .where(eq(objectTypes.project_id, projectId))
          .orderBy(objectTypes.order_index);

        const dbAttributes = await db
          .select()
          .from(attributes)
          .orderBy(attributes.order_index);

        const dbValues = await db
          .select()
          .from(attributeValues);

        // 2️⃣ Map to nested structure
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
              values: dbValues
                .filter((val) => val.attribute_id === attr.id)
                .map((v) => ({
                  id: v.id,
                  name: v.value_text ?? "",
                  valueType: attr.type as ValueType,
                })),
            })),
        }));

        setObjects(mapped);
        console.log("✅ Loaded project data with select values:", projectId);
      } catch (err) {
        console.error("❌ Failed to load project data:", err);
      }
    };

    loadFromDatabase();
  }, [projectId]);

  // --- SAVE PROJECT DATA ---
  useEffect(() => {
    if (!projectId || projectId === 0) return;

    const saveToDatabase = async () => {
      try {
        console.log("💾 Syncing project data for project:", projectId);

        // 1️⃣ Clear existing data (cascade removes attributes + values)
        await db.delete(objectTypes).where(eq(objectTypes.project_id, projectId));

        // 2️⃣ Re-insert all object types
        for (const [objIndex, obj] of objects.entries()) {
          const insertedObject = await db
            .insert(objectTypes)
            .values({
              project_id: projectId,
              name: obj.name,
              color: obj.color,
              order_index: objIndex,
            })
            .returning({ id: objectTypes.id });

          const objectTypeId = insertedObject[0]?.id;
          if (!objectTypeId) continue;

          // 3️⃣ Insert all attributes
          for (const [attrIndex, attr] of obj.attributes.entries()) {
            const insertedAttr = await db
              .insert(attributes)
              .values({
                object_type_id: objectTypeId,
                label: attr.name,
                key: attr.name.toLowerCase().replace(/\s+/g, "_"),
                type: attr.valueType,
                required: false,
                order_index: attrIndex,
              })
              .returning({ id: attributes.id });

            const attributeId = insertedAttr[0]?.id;
            if (!attributeId) continue;

            // 4️⃣ Insert select values if type === "select"
            if (attr.valueType === "select" && attr.values?.length > 0) {
              for (const val of attr.values) {
                await db.insert(attributeValues).values({
                  attribute_id: attributeId,
                  value_text: val.name,
                });
              }
            }
          }
        }

        console.log("✅ Saved project data including select values:", projectId);
      } catch (err) {
        console.error("❌ Failed to sync project data:", err);
      }
    };

    saveToDatabase();
  }, [objects, projectId]);
}
