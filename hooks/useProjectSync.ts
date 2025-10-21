import { useEffect } from "react";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { eq } from "drizzle-orm";
import { objectTypes, attributes, attributeValues } from "@/db/schema";
import { ObjectItem, ValueType } from "@/components/new-project helper/form";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";

export function useProjectSync(
  projectId: number,
  objects: ObjectItem[],
  setObjects: (data: ObjectItem[]) => void
) {
  const sqliteDb = useSQLiteContext();

  // 🔎 Enable SQL logging
  const db = drizzle(sqliteDb, { logger: true });

  const debug = (label: string, data?: any) => {
    // Safer consistent logging
    if (data !== undefined) {
      console.log(`[SYNC] ${label}:`, JSON.parse(JSON.stringify(data)));
    } else {
      console.log(`[SYNC] ${label}`);
    }
  };

  // --- LOAD PROJECT DATA ---
  useEffect(() => {
    if (!projectId) return;

    const loadFromDatabase = async () => {
      try {
        debug("LOAD start", { projectId });

        const dbObjects = await db
          .select()
          .from(objectTypes)
          .where(eq(objectTypes.project_id, projectId))
          .orderBy(objectTypes.order_index);

        debug("LOAD objects.count", dbObjects.length);
        debug("LOAD objects", dbObjects);

        const dbAttributes = await db.select().from(attributes);
        debug("LOAD attributes.count", dbAttributes.length);

        const dbValues = await db.select().from(attributeValues);
        debug("LOAD attributeValues.count", dbValues.length);

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

        debug("LOAD mapped.objects.count", mapped.length);
        setObjects(mapped);

        useRefreshDbStore.getState().increment();
        debug("LOAD done");
      } catch (err) {
        console.error("[SYNC] LOAD error:", err);
      }
    };

    loadFromDatabase();
  }, [projectId]);

  // --- SAVE PROJECT DATA (UPSERT ONLY, NO DELETE) ---
  useEffect(() => {
    if (!projectId || projectId === 0) return;

    const saveToDatabase = async () => {
      try {
        debug("SAVE start", {
          projectId,
          stateObjectsCount: objects.length,
        });

        const existingObjects = await db
          .select()
          .from(objectTypes)
          .where(eq(objectTypes.project_id, projectId));

        debug("SAVE existingObjects.count", existingObjects.length);

        for (const [objIndex, obj] of objects.entries()) {
          debug("OBJ loop start", { objIndex, objStateId: obj.id, name: obj.name });

          // Try match by ID first, fallback to name
          const existing =
            existingObjects.find((o) => o.id === obj.id) ||
            existingObjects.find((o) => o.name === obj.name);

          let objectTypeId = existing?.id;

          if (existing) {
            debug("OBJ update", { existingId: existing.id });
            await db
              .update(objectTypes)
              .set({
                name: obj.name,
                color: obj.color,
                order_index: objIndex,
              })
              .where(eq(objectTypes.id, existing.id))
              .run();
          } else {
            debug("OBJ insert", { name: obj.name, color: obj.color, order_index: objIndex });
            const res = await db
              .insert(objectTypes)
              .values({
                project_id: projectId,
                name: obj.name,
                color: obj.color,
                order_index: objIndex,
              })
              .run();

            // ✅ Get ID from run() result (Expo SQLite)
            const newId = Number((res as any)?.lastInsertRowId ?? 0);
            debug("OBJ insert result", { insertId: newId, runResult: res });

            objectTypeId = newId || objectTypeId;
            if (objectTypeId) {
              obj.id = objectTypeId; // reflect back into state object
            }
          }

          if (!objectTypeId) {
            console.warn("[SYNC] OBJ missing objectTypeId, skipping attributes");
            continue;
          }

          // --- ATTRIBUTES ---
          const existingAttrs = await db
            .select()
            .from(attributes)
            .where(eq(attributes.object_type_id, objectTypeId));

          debug("ATTR existing.count", existingAttrs.length);

          for (const [attrIndex, attr] of obj.attributes.entries()) {
            debug("ATTR loop start", {
              attrIndex,
              attrStateId: attr.id,
              name: attr.name,
              valueType: attr.valueType,
            });

            const existingAttr =
              existingAttrs.find((a) => a.id === attr.id) ||
              existingAttrs.find((a) => a.label === attr.name);

            let attributeId = existingAttr?.id;

            if (existingAttr) {
              debug("ATTR update", { existingAttrId: existingAttr.id });
              await db
                .update(attributes)
                .set({
                  label: attr.name,
                  key: attr.name.toLowerCase().replace(/\s+/g, "_"),
                  type: attr.valueType,
                  order_index: attrIndex,
                })
                .where(eq(attributes.id, existingAttr.id))
                .run();
            } else {
              debug("ATTR insert", {
                object_type_id: objectTypeId,
                label: attr.name,
                type: attr.valueType,
                order_index: attrIndex,
              });
              const res = await db
                .insert(attributes)
                .values({
                  object_type_id: objectTypeId,
                  label: attr.name,
                  key: attr.name.toLowerCase().replace(/\s+/g, "_"),
                  type: attr.valueType,
                  required: false,
                  order_index: attrIndex,
                })
                .run();

              const newAttrId = Number((res as any)?.lastInsertRowId ?? 0);

              attributeId = newAttrId || attributeId;
              if (attributeId) {
                attr.id = attributeId; // reflect back into state
              }
            }

            if (!attributeId) {
              console.warn("[SYNC] ATTR missing attributeId, skipping values");
              continue;
            }

            // --- SELECT VALUES ---
            if (attr.valueType === "select") {
              const existingVals = await db
                .select()
                .from(attributeValues)
                .where(eq(attributeValues.attribute_id, attributeId));

              const existingNames = existingVals.map((v) => v.value_text ?? "");
              debug("VAL existing.count", existingVals.length);
              debug("VAL existing.names", existingNames);

              for (const val of attr.values) {
                if (!existingNames.includes(val.name)) {
                  debug("VAL insert", { attribute_id: attributeId, value_text: val.name });
                  const res = await db
                    .insert(attributeValues)
                    .values({
                      attribute_id: attributeId,
                      value_text: val.name,
                    })
                    .run();
                  const newValId = Number((res as any)?.lastInsertRowId ?? 0);
                  debug("VAL insert result", { insertId: newValId, runResult: res });
                } else {
                  debug("VAL skip (already exists)", { value_text: val.name });
                }
              }
            }

            debug("ATTR loop end", { attributeId });
          }

          debug("OBJ loop end", { objectTypeId });
        }

        useRefreshDbStore.getState().increment();
        debug("SAVE done");
      } catch (err) {
        console.error("[SYNC] SAVE error:", err);
      }
    };

    saveToDatabase();
  }, [objects, projectId]);
}
