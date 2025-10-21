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

// 📍 Example Enschede coordinates
const enschedePoints = [
  { lat: 52.2215, lon: 6.8937 },
  { lat: 52.2248, lon: 6.8871 },
  { lat: 52.2189, lon: 6.9022 },
  { lat: 52.2161, lon: 6.8953 },
  { lat: 52.2285, lon: 6.9049 },
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
        .values({ name: "DemoProject", created_at: Date.now() })
        .returning({ id: projects.id })
        .execute();

      const projectId = insertedProject?.[0]?.id;
      if (!projectId) throw new Error("Failed to create DemoProject");

      // 2️⃣ Create demo session
      const insertedSession = await tx
        .insert(surveySessions)
        .values({ project_id: projectId, started_at: Date.now() })
        .returning({ id: surveySessions.id })
        .execute();

      const sessionId = insertedSession?.[0]?.id;
      const objectIdMap: Record<string, number> = {};

      // 3️⃣ Insert all default objects + attributes
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
              .values(attr.values.map((v) => ({ attribute_id: attrId, value_text: v })))
              .execute();
          }
        }
      }

      console.log("✅ Default demo objects inserted successfully!");

      // 4️⃣ Insert sample observations for Enschede
      console.log("📍 Adding sample observations in Enschede...");
      const now = Date.now();

      for (const point of enschedePoints) {
        // 🌳 Tree
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
            { observation_id: treeId, attribute_id: 1, value_text: "Oak" },
            { observation_id: treeId, attribute_id: 2, value_text: "Good" },
          ]);
        }

        // 🚗 Car
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
            { observation_id: carId, attribute_id: 3, value_text: "true" },
            { observation_id: carId, attribute_id: 4, value_text: "Blue" },
          ]);
        }

        // 🐦 Bird
        const birdObs = await tx
          .insert(observations)
          .values({
            session_id: sessionId!,
            object_type_id: objectIdMap["Bird"],
            latitude: point.lat + 0.002 * Math.random(),
            longitude: point.lon + 0.002 * Math.random(),
            captured_at: now,
            status: "draft",
            mapVisible: true,
          })
          .returning({ id: observations.id })
          .execute();

        const birdId = birdObs?.[0]?.id;
        if (birdId) {
          const species = ["Crow", "Sparrow", "Parrot", "Eagle"][
            Math.floor(Math.random() * 4)
          ];
          const canFly = Math.random() > 0.2 ? "true" : "false";
          await tx.insert(attributeCoordinateValues).values([
            { observation_id: birdId, attribute_id: 5, value_text: species },
            { observation_id: birdId, attribute_id: 6, value_text: canFly },
          ]);
        }
      }

      console.log("🌳🚗🐦 Demo observations added successfully!");
    });

    await AsyncStorage.setItem(seedKey, "true");
    console.log("🎉 Demo project + observations seeding completed.");
  } catch (error: any) {
    console.error("❌ Failed to insert demo data:", error);
  }
};
