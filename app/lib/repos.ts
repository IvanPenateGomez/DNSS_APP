import { db } from './db';
import * as Crypto from 'expo-crypto';

const uuid = () => Crypto.randomUUID();

/* Projects */

export async function getOrCreateDefaultProject() {
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT * FROM projects ORDER BY created_at LIMIT 1'
  );
  if (rows.length > 0) return rows[0].id;
  return createProject('Default Project');
}

export async function createProject(name: string) {
  const id = uuid();
  await db.runAsync(
    'INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)',
    [id, name, Date.now()]
  );
  return id;
}

export async function listProjects() {
  return db.getAllAsync('SELECT * FROM projects ORDER BY created_at DESC');
}

/* Object Types (cards)*/

export async function addObjectType(projectId: string, name: string, color?: string) {
  const id = uuid();
  const nextOrder = (await db.getFirstAsync<{ n: number }>(
    'SELECT IFNULL(MAX(order_index), -1) + 1 AS n FROM object_types WHERE project_id = ?',
    [projectId]
  ))!.n;

  await db.runAsync(
    'INSERT INTO object_types (id, project_id, name, color, order_index) VALUES (?, ?, ?, ?, ?)',
    [id, projectId, name, color ?? null, nextOrder]
  );
  return id;
}

export async function listObjectTypes(projectId: string) {
  return db.getAllAsync(
    'SELECT * FROM object_types WHERE project_id = ? ORDER BY order_index ASC',
    [projectId]
  );
}

export async function deleteObjectType(objectTypeId: string) {
  await db.runAsync('DELETE FROM object_types WHERE id = ?', [objectTypeId]);
}

/* Attributes */

const toKey = (label: string) =>
  label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export async function addAttribute(
  objectTypeId: string,
  label: string,
  type: 'text' = 'text',
  key?: string
) {
  const id = uuid();
  const k = key ?? toKey(label);

  const nextOrder = (await db.getFirstAsync<{ n: number }>(
    'SELECT IFNULL(MAX(order_index), -1) + 1 AS n FROM attributes WHERE object_type_id = ?',
    [objectTypeId]
  ))!.n;

  await db.runAsync(
    'INSERT INTO attributes (id, object_type_id, label, key, type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [id, objectTypeId, label, k, type, nextOrder]
  );
  return id;
}

export async function listAttributes(objectTypeId: string) {
  return db.getAllAsync(
    'SELECT * FROM attributes WHERE object_type_id = ? ORDER BY order_index ASC',
    [objectTypeId]
  );
}

export async function deleteAttribute(attributeId: string) {
  await db.runAsync('DELETE FROM attributes WHERE id = ?', [attributeId]);
}

/* Survey sessions */

export async function startSession(projectId: string) {
  const id = uuid();
  await db.runAsync(
    'INSERT INTO survey_sessions (id, project_id, started_at) VALUES (?, ?, ?)',
    [id, projectId, Date.now()]
  );
  return id;
}

export async function endSession(sessionId: string) {
  await db.runAsync('UPDATE survey_sessions SET ended_at = ? WHERE id = ?', [
    Date.now(),
    sessionId,
  ]);
}

export async function listSessions(projectId: string) {
  return db.getAllAsync(
    'SELECT * FROM survey_sessions WHERE project_id = ? ORDER BY started_at DESC',
    [projectId]
  );
}

/* Observations */

type Geo = {
  latitude: number;
  longitude: number;
};

export async function createObservation(
  sessionId: string,
  objectTypeId: string,
  geo: Geo,
  notes?: string | null
) {
  const id = uuid();
  await db.runAsync(
    `INSERT INTO observations
     (id, session_id, object_type_id, latitude, longitude, captured_at, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
    [id, sessionId, objectTypeId, geo.latitude, geo.longitude, Date.now(), notes ?? null]
  );
  return id;
}

export async function updateObservationNotes(observationId: string, notes: string | null) {
  await db.runAsync('UPDATE observations SET notes = ? WHERE id = ?', [
    notes && notes.trim().length ? notes : null,
    observationId,
  ]);
}

export type ObservationStatus = 'draft' | 'finalized' | 'deleted';

export async function setObservationStatus(
  observationId: string,
  status: ObservationStatus
) {
  await db.runAsync('UPDATE observations SET status = ? WHERE id = ?', [
    status,
    observationId,
  ]);
}

export async function listObservations(
  sessionId: string,
  objectTypeId?: string
) {
  if (objectTypeId) {
    return db.getAllAsync(
      `SELECT * FROM observations
       WHERE session_id = ? AND object_type_id = ?
       ORDER BY captured_at DESC`,
      [sessionId, objectTypeId]
    );
  }
  return db.getAllAsync(
    'SELECT * FROM observations WHERE session_id = ? ORDER BY captured_at DESC',
    [sessionId]
  );
}

export async function getObservation(observationId: string) {
  return db.getFirstAsync('SELECT * FROM observations WHERE id = ?', [observationId]);
}

/* Attribute values */

export async function upsertAttributeValue(
  observationId: string,
  attributeId: string,
  valueText: string | null
) {
  const id = uuid();
  await db.runAsync(
    `INSERT INTO attribute_values (id, observation_id, attribute_id, value_text)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(observation_id, attribute_id)
     DO UPDATE SET value_text = excluded.value_text`,
    [id, observationId, attributeId, valueText]
  );
}

export async function getAttributeValues(observationId: string) {
  // joins with attribute metadata so you get label/key with the value
  return db.getAllAsync(
    `SELECT av.attribute_id, av.value_text, a.label, a.key
     FROM attribute_values av
     JOIN attributes a ON a.id = av.attribute_id
     WHERE av.observation_id = ?
     ORDER BY a.order_index ASC`,
    [observationId]
  );
}

/* Convenience: load form for an object type */

export async function getForm(objectTypeId: string) {
  const type = await db.getFirstAsync('SELECT * FROM object_types WHERE id = ?', [
    objectTypeId,
  ]);
  const fields = await listAttributes(objectTypeId);
  return { objectType: type, attributes: fields };
}

/* Convenience: observation + values as a flat object
   (handy for exports or editing screens) */

export async function getObservationWithValues(observationId: string) {
  const obs = await getObservation(observationId);
  if (!obs) return null;

  const rows = await getAttributeValues(observationId);
  const values: Record<string, string | null> = {};
  for (const r of rows as any[]) values[r.key] = r.value_text ?? null;

  return { observation: obs, values };
}

/* Dev helper: wipe everything */

export async function wipeAll() {
  await db.execAsync(`
    DELETE FROM attribute_values;
    DELETE FROM observations;
    DELETE FROM survey_sessions;
    DELETE FROM attributes;
    DELETE FROM object_types;
    DELETE FROM projects;
  `);
}