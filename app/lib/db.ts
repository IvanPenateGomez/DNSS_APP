import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('gnss.db');

export async function migrate() {
  await db.execAsync(`PRAGMA foreign_keys=ON;`);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS object_types (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      UNIQUE(project_id, name)
    );

    CREATE TABLE IF NOT EXISTS attributes (
      id TEXT PRIMARY KEY,
      object_type_id TEXT NOT NULL REFERENCES object_types(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      key TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      required INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      UNIQUE(object_type_id, key)
    );

    CREATE TABLE IF NOT EXISTS survey_sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES survey_sessions(id) ON DELETE CASCADE,
      object_type_id TEXT NOT NULL REFERENCES object_types(id) ON DELETE CASCADE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      captured_at INTEGER NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS attribute_values (
      id TEXT PRIMARY KEY,
      observation_id TEXT NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
      attribute_id TEXT NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
      value_text TEXT,
      UNIQUE(observation_id, attribute_id)
    );
  `);
}

export async function debugDb() {
  const tables = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master
     WHERE type='table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name`
  );
  console.log('DB CHECK → tables:', tables.map(t => t.name));
}