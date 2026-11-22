import { closeDatabase, getSettings } from '../lib/db.js';

try {
  const settings = await getSettings();
  console.log('Neon conectado; tabela automation_settings pronta.', settings);
} finally {
  await closeDatabase();
}
