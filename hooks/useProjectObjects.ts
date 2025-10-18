import { useEffect, useState } from "react";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { eq, asc } from "drizzle-orm";
import { objectTypes, attributes, attributeValues } from "@/db/schema";
import { useRefreshDbStore } from "@/zustand/refreshDbStore";
import { ObjectItem, ValueType } from "@/components/new-project helper/form";

/**
 * Custom live-like query hook that loads all object types, attributes, and select values
 * for a specific projectId and refreshes whenever `refreshDB` changes.
 */
export function useProjectObjects(projectId: number) {
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);

  const refreshDB = useRefreshDbStore((state) => state.refreshDB);
  const [data, setData] = useState<ObjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || projectId === 0) {
      setData([]);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        console.log("🔄 Loading project objects for:", projectId);

        // 1️⃣ Fetch base data
        const dbObjects = await db
          .select()
          .from(objectTypes)
          .where(eq(objectTypes.project_id, projectId))
          .orderBy(asc(objectTypes.order_index));

        const dbAttributes = await db.select().from(attributes).orderBy(asc(attributes.order_index));
        const dbValues = await db.select().from(attributeValues);

        // 2️⃣ Map nested structure
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

        setData(mapped);
        console.log("✅ Loaded project objects:", mapped.length);
      } catch (err) {
        console.error("❌ Failed to load project objects:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, refreshDB]);

  return { data, loading };
}
