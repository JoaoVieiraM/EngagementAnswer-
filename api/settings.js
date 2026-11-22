import { getSettings, saveSettings } from '../lib/db.js';
import { requireDashboardAuth } from '../lib/auth.js';
export default async function handler(req, res) {
  if (!requireDashboardAuth(req, res)) return;
  if (req.method === 'GET') return res.status(200).json(await getSettings());
  if (req.method === 'PUT') {
    if (!req.body?.keyword?.trim()) return res.status(422).json({ error: 'Informe uma palavra-chave.' });
    return res.status(200).json(await saveSettings(req.body));
  }
  res.setHeader('Allow', 'GET, PUT'); return res.status(405).end();
}
