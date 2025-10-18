import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  created_at: integer("created_at").notNull(), // timestamp (ms)
});

export const objectTypes = sqliteTable("object_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  order_index: integer("order_index").notNull().default(0),
});

export const attributes = sqliteTable("attributes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  object_type_id: integer("object_type_id")
    .notNull()
    .references(() => objectTypes.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  key: text("key").notNull(),
  type: text("type").notNull().default("text"), // "text", "number", "boolean", etc.
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  order_index: integer("order_index").notNull().default(0),
});

export const surveySessions = sqliteTable("survey_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  started_at: integer("started_at").notNull(),
  ended_at: integer("ended_at"),
});

export const observations = sqliteTable("observations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  session_id: integer("session_id")
    .notNull()
    .references(() => surveySessions.id, { onDelete: "cascade" }),
  object_type_id: integer("object_type_id")
    .notNull()
    .references(() => objectTypes.id, { onDelete: "cascade" }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  captured_at: integer("captured_at").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("draft"),
});

export const attributeValues = sqliteTable("attribute_values", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 👇 now optional
  observation_id: integer("observation_id")
    .references(() => observations.id, { onDelete: "cascade" }),

  attribute_id: integer("attribute_id")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),

  value_text: text("value_text"),
});