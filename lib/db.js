import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';

const defaults = { keyword: 'MATERIAL', materialUrl: '', openingMessage: 'Oi! Seu material está aqui:', enabled: false };
let pool;
function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    attachDatabasePool(pool);
  }
  return pool;
}
async function initialize(db) {
  await db.query('CREATE TABLE IF NOT EXISTS automation_settings (id integer PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
}
export async function getSettings() {
  const db = database(); await initialize(db);
  const result = await db.query('SELECT value FROM automation_settings WHERE id = 1');
  return { ...defaults, ...(result.rows[0]?.value ?? {}) };
}
export async function saveSettings(value) {
  const db = database(); await initialize(db);
  const next = { ...defaults, ...value };
  await db.query('INSERT INTO automation_settings (id, value) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = now()', [JSON.stringify(next)]);
  return next;
}
export async function closeDatabase() { if (pool) await pool.end(); }
