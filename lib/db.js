import { neon } from '@neondatabase/serverless';

const defaults = { keyword: 'MATERIAL', materialUrl: '', openingMessage: 'Oi! Seu material está aqui:', enabled: false };
function sql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');
  return neon(process.env.DATABASE_URL);
}
async function initialize(db) {
  await db`CREATE TABLE IF NOT EXISTS automation_settings (id integer PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`;
}
export async function getSettings() {
  const db = sql(); await initialize(db);
  const rows = await db`SELECT value FROM automation_settings WHERE id = 1`;
  return { ...defaults, ...(rows[0]?.value ?? {}) };
}
export async function saveSettings(value) {
  const db = sql(); await initialize(db);
  const next = { ...defaults, ...value };
  await db`INSERT INTO automation_settings (id, value) VALUES (1, ${JSON.stringify(next)}::jsonb) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  return next;
}
