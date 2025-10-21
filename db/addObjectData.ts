import AsyncStorage from "@react-native-async-storage/async-storage";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import {
  projects,
  objectTypes,
  attributes,
  attributeValues,
  surveySessions,
  observations,
  attributeCoordinateValues,
} from "@/db/schema";
import { eq } from "drizzle-orm";

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

// 📍 Example Enschede coordinates (random sample)
const enschedePoints = [
  { lat: 52.2215, lon: 6.8937 }, // Center
  { lat: 52.2248, lon: 6.8871 }, // University area
  { lat: 52.2189, lon: 6.9022 }, // City center east
  { lat: 52.2161, lon: 6.8953 }, // Market area
  { lat: 52.2285, lon: 6.9049 }, // North park
];

// 🧠 Helper
const makeKey = (label: string) => label.toLowerCase().replace(/\s+/g, "_");

// 🧩 Seeder function
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

      // 2️⃣ Create demo session
      const insertedSession = await tx
        .insert(surveySessions)
        .values({
          project_id: projectId,
          started_at: Date.now(),
        })
        .returning({ id: surveySessions.id })
        .execute();
      const sessionId = insertedSession?.[0]?.id;

      // 3️⃣ Insert all default objects + attributes
      const objectIdMap: Record<string, number> = {};

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
        objectIdMap[obj.name] = objectId;

        // Attributes
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

      // 4️⃣ Insert sample observations for Enschede
      console.log("📍 Adding sample observations in Enschede...");

      const now = Date.now();
      for (const point of enschedePoints) {
        // Tree observation
        const treeObs = await tx
          .insert(observations)
          .values({
            session_id: sessionId!,
            object_type_id: objectIdMap["Tree"],
            latitude: point.lat,
            longitude: point.lon,
            captured_at: now,
            status: "draft",
            mapVisible: true,
          })
          .returning({ id: observations.id })
          .execute();

        const treeId = treeObs?.[0]?.id;
        if (treeId) {
          await tx.insert(attributeCoordinateValues).values([
            {
              observation_id: treeId,
              attribute_id: 1, // Type (example)
              value_text: "Oak",
            },
            {
              observation_id: treeId,
              attribute_id: 2, // Condition
              value_text: "Good",
            },
          ]);
        }

        // Car observation
        const carObs = await tx
          .insert(observations)
          .values({
            session_id: sessionId!,
            object_type_id: objectIdMap["Car"],
            latitude: point.lat + 0.001 * Math.random(),
            longitude: point.lon + 0.001 * Math.random(),
            captured_at: now,
            status: "draft",
            mapVisible: true,
          })
          .returning({ id: observations.id })
          .execute();

        const carId = carObs?.[0]?.id;
        if (carId) {
          await tx.insert(attributeCoordinateValues).values([
            {
              observation_id: carId,
              attribute_id: 3, // Parked Legal
              value_text: "true",
            },
            {
              observation_id: carId,
              attribute_id: 4, // Color
              value_text: "Blue",
            },
          ]);
        }
      }

      console.log("🚗🌳 Demo observations added successfully!");
    });

    await AsyncStorage.setItem(seedKey, "true");
    console.log("🎉 Demo project + observations seeding completed.");
  } catch (error: any) {
    console.error("❌ Failed to insert demo data:", error);
  }
};
