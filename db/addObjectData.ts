import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq } from "drizzle-orm";
import {
  projects,
  objectTypes,
  attributes,
  attributeValues,
} from "@/db/schema";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";

// 🌳 Default demo objects
const defaultObjects = [
  {
    name: "Tree",
    color: "#7FD87F",
    attributes: [
      { name: "Type", type: "select", values: ["Oak", "Birch", "Fern", "Pine"] },
      { name: "Condition", type: "select", values: ["Good", "Medium", "Bad"] },
    ],
  },
  {
    name: "Car",
    color: "#6A9FFB",
    attributes: [
      { name: "Parked Legal", type: "boolean", values: [] },
      { name: "Color", type: "select", values: ["Red", "Blue", "Black", "White"] },
    ],
  },
  {
    name: "Bird",
    color: "#F7C95F",
    attributes: [
      { name: "Species", type: "select", values: ["Crow", "Sparrow", "Parrot", "Eagle"] },
      { name: "Can Fly", type: "boolean", values: [] },
    ],
  },
];

// 🧠 Helper
const makeKey = (label: string) => label.toLowerCase().replace(/\s+/g, "_");

// 🧩 Seeder function (fully async version)
export const addObjectData = async (db: ExpoSQLiteDatabase) => {
  const seedKey = "demoProjectInitialized";
  const alreadyInitialized = await AsyncStorage.getItem(seedKey);
  if (alreadyInitialized) {
    console.log("✅ Demo project already seeded — skipping.");
    return;
  }

  console.log("📥 Creating DemoProject and inserting default data...");

  try {
    await db.transaction(async (tx) => {
      // 1️⃣ Create DemoProject
      const insertedProject = await tx
        .insert(projects)
        .values({
          name: "DemoProject",
          created_at: Date.now(),
        })
        .returning({ id: projects.id })
        .execute();

      const projectId = insertedProject?.[0]?.id;
      if (!projectId) throw new Error("Failed to create DemoProject");
      console.log("🌱 DemoProject created:", projectId);

      // 2️⃣ Insert all default objects
      for (const [objIndex, obj] of defaultObjects.entries()) {
        const insertedObject = await tx
          .insert(objectTypes)
          .values({
            project_id: projectId,
            name: obj.name,
            color: obj.color,
            order_index: objIndex,
          })
          .returning({ id: objectTypes.id })
          .execute();

        const objectId = insertedObject?.[0]?.id;
        if (!objectId) continue;

        // 3️⃣ Attributes
        for (const [attrIndex, attr] of obj.attributes.entries()) {
          const insertedAttr = await tx
            .insert(attributes)
            .values({
              object_type_id: objectId,
              label: attr.name,
              key: makeKey(attr.name),
              type: attr.type,
              order_index: attrIndex,
              required: false,
            })
            .returning({ id: attributes.id })
            .execute();

          const attrId = insertedAttr?.[0]?.id;
          if (!attrId) continue;

          // 4️⃣ Select values
          if (attr.type === "select" && attr.values?.length > 0) {
            await tx
              .insert(attributeValues)
              .values(
                attr.values.map((v) => ({
                  attribute_id: attrId,
                  value_text: v,
                }))
              )
              .execute();
          }
        }
      }

      console.log("✅ Default demo objects inserted successfully!");
    });

    await AsyncStorage.setItem(seedKey, "true");
    console.log("🎉 Demo project seeding completed.");
  } catch (error: any) {
    console.error("❌ Failed to insert demo object data:", error);
  }
};
