import crypto from 'node:crypto';
import { getSettings } from '../lib/db.js';

export const config = { api: { bodyParser: false } };
const read = req => new Promise((resolve, reject) => { const c=[]; req.on('data', x => c.push(x)); req.on('end', () => resolve(Buffer.concat(c))); req.on('error', reject); });
function signed(body, value) {
  const secret = process.env.META_APP_SECRET; if (!secret) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  return value?.length === expected.length && crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (req.query['hub.verify_token'] !== process.env.WEBHOOK_VERIFY_TOKEN) return res.status(403).end();
    return res.status(200).send(req.query['hub.challenge']);
  }
  if (req.method !== 'POST') return res.status(405).end();
  const body = await read(req);
  if (!signed(body, req.headers['x-hub-signature-256'])) return res.status(403).end();
  const campaign = await getSettings();
  const event = JSON.parse(body.toString());
  for (const entry of event.entry ?? []) for (const change of entry.changes ?? []) {
    const text = change.value?.text ?? change.value?.message ?? '';
    if (campaign.enabled && text.toLowerCase().split(/\s+/).includes(campaign.keyword.toLowerCase())) {
      console.info('Comentário elegível recebido', { commentId: change.value?.id, materialUrl: campaign.materialUrl });
    }
  }
  return res.status(200).send('EVENT_RECEIVED');
}
