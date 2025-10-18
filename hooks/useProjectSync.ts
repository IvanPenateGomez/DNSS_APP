import { useEffect } from "react";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { objectTypes, attributes, attributeValues } from "@/db/schema";
import { ObjectItem, ValueType } from "@/components/new-project helper/form";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";

export function useProjectSync(
  projectId: number,
  objects: ObjectItem[],
  setObjects: (data: ObjectItem[]) => void
) {
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);

  // --- LOAD PROJECT DATA ---
  useEffect(() => {
    if (!projectId) return;

    const loadFromDatabase = async () => {
      try {
        console.log("📦 Loading project data for:", projectId);

        const dbObjects = await db
          .select()
          .from(objectTypes)
          .where(eq(objectTypes.project_id, projectId))
          .orderBy(objectTypes.order_index);

        const dbAttributes = await db
          .select()
          .from(attributes)
          .orderBy(attributes.order_index);

        const dbValues = await db.select().from(attributeValues);

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
        useRefreshDbStore.getState().increment();

        console.log("✅ Loaded project data with select values:", projectId);
      } catch (err) {
        console.error("❌ Failed to load project data:", err);
      }
    };

    loadFromDatabase();
  }, [projectId]);

  // --- SAVE PROJECT DATA (UPDATE / UPSERT) ---
  useEffect(() => {
    if (!projectId || projectId === 0) return;

    const saveToDatabase = async () => {
      try {
        console.log("💾 Syncing project data for project:", projectId);

        // 🔹 1. Fetch all existing DB objects
        const existingObjects = await db
          .select()
          .from(objectTypes)
          .where(eq(objectTypes.project_id, projectId));

        const existingIds = existingObjects.map((o) => o.id);
        const newIds = objects.map((o) => o.id).filter(Boolean);

        // 🔹 2. Delete objects that no longer exist in state
        if (existingIds.length > 0) {
          const idsToDelete = existingIds.filter((id) => !newIds.includes(id));
          if (idsToDelete.length > 0) {
            await db
              .delete(objectTypes)
              .where(inArray(objectTypes.id, idsToDelete));
          }
        }

        // 🔹 3. Upsert each object
        for (const [objIndex, obj] of objects.entries()) {
          const existing = existingObjects.find((o) => o.id === obj.id);

          let objectTypeId = obj.id;

          if (existing) {
            // UPDATE existing
            await db
              .update(objectTypes)
              .set({
                name: obj.name,
                color: obj.color,
                order_index: objIndex,
              })
              .where(eq(objectTypes.id, obj.id));
          } else {
            // INSERT new
            const inserted = await db
              .insert(objectTypes)
              .values({
                project_id: projectId,
                name: obj.name,
                color: obj.color,
                order_index: objIndex,
              })
              .returning({ id: objectTypes.id });
            objectTypeId = inserted[0]?.id;
          }

          if (!objectTypeId) continue;

          // 🔹 4. Sync attributes (delete missing, update existing, insert new)
          const existingAttrs = await db
            .select()
            .from(attributes)
            .where(eq(attributes.object_type_id, objectTypeId));

          const existingAttrIds = existingAttrs.map((a) => a.id);
          const newAttrIds = obj.attributes.map((a) => a.id).filter(Boolean);

          const attrsToDelete = existingAttrIds.filter(
            (id) => !newAttrIds.includes(id)
          );
          if (attrsToDelete.length > 0) {
            await db
              .delete(attributes)
              .where(inArray(attributes.id, attrsToDelete));
          }

          for (const [attrIndex, attr] of obj.attributes.entries()) {
            const existingAttr = existingAttrs.find((a) => a.id === attr.id);

            let attributeId = attr.id;

            if (existingAttr) {
              await db
                .update(attributes)
                .set({
                  label: attr.name,
                  key: attr.name.toLowerCase().replace(/\s+/g, "_"),
                  type: attr.valueType,
                  order_index: attrIndex,
                })
                .where(eq(attributes.id, attr.id));
            } else {
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

              attributeId = insertedAttr[0]?.id;
            }

            if (!attributeId) continue;

            // 🔹 5. Sync select values if applicable
            if (attr.valueType === "select") {
              const existingVals = await db
                .select()
                .from(attributeValues)
                .where(eq(attributeValues.attribute_id, attributeId));

              const existingValIds = existingVals.map((v) => v.id);
              const newValNames = attr.values.map((v) => v.name);

              // Delete values not in new list
              const valsToDelete = existingVals.filter(
                (v) => !newValNames.includes(v.value_text ?? "")
              );
              if (valsToDelete.length > 0) {
                await db
                  .delete(attributeValues)
                  .where(
                    inArray(
                      attributeValues.id,
                      valsToDelete.map((v) => v.id)
                    )
                  );
              }

              // Insert new values
              const existingNames = existingVals.map((v) => v.value_text);
              for (const val of attr.values) {
                if (!existingNames.includes(val.name)) {
                  await db.insert(attributeValues).values({
                    attribute_id: attributeId,
                    value_text: val.name,
                  });
                }
              }
            }
          }
        }

        useRefreshDbStore.getState().increment();
        console.log("✅ Synced project data:", projectId);
      } catch (err) {
        console.error("❌ Failed to sync project data:", err);
      }
    };

    saveToDatabase();
  }, [objects, projectId]);
}
