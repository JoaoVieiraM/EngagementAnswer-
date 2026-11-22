import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSettings, saveSettings } from './lib/db.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
loadEnv(path.join(root, '.env'));

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}
function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function validSignature(body, signature) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return process.env.DRY_RUN === 'true';
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  if (!signature || signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
function matchesKeyword(text, keyword) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .split(/\s+/).includes(keyword.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase());
}
async function deliverPrivateReply(commentId, message) {
  if (process.env.DRY_RUN !== 'false') {
    console.info('[SIMULAÇÃO] DM privada:', { commentId, message });
    return;
  }
  // Configure o endpoint oficial aplicável ao seu tipo de onboarding Meta após o App Review.
  // Esta proteção impede que a aplicação envie DMs reais com uma configuração incompleta.
  throw new Error('Envio real não configurado. Consulte README.md antes de desativar DRY_RUN.');
}
async function handleComment(comment) {
  const config = await getSettings();
  if (!config.enabled || !matchesKeyword(comment.text ?? '', config.keyword)) return;
  // Não há checagem pública e confiável de \"segue este perfil\" para contas individuais.
  // Logo, a aplicação nunca libera o material nesta etapa por suposição.
  const message = config.openingMessage + '\n\n' + config.notFollowerMessage;
  await deliverPrivateReply(comment.id, message);
}
async function handleWebhook(payload) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'comments') continue;
      const value = change.value ?? {};
      await handleComment({ id: value.id, text: value.text ?? value.message ?? '' });
    }
  }
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, dryRun: process.env.DRY_RUN !== 'false' });
  if (req.method === 'GET' && url.pathname === '/api/settings') return json(res, 200, await getSettings());
  if (req.method === 'PUT' && url.pathname === '/api/settings') {
    const next = JSON.parse((await rawBody(req)).toString('utf8'));
    if (!next.keyword?.trim()) return json(res, 422, { error: 'Informe uma palavra-chave.' });
    return json(res, 200, await saveSettings(next));
  }
  if (req.method === 'GET' && url.pathname === '/webhook') {
    if (url.searchParams.get('hub.verify_token') !== process.env.WEBHOOK_VERIFY_TOKEN) return res.writeHead(403).end();
    return res.end(url.searchParams.get('hub.challenge') ?? '');
  }
  if (req.method === 'POST' && url.pathname === '/webhook') {
    const body = await rawBody(req);
    if (!validSignature(body, req.headers['x-hub-signature-256'])) return res.writeHead(403).end();
    try { await handleWebhook(JSON.parse(body.toString('utf8'))); } catch (error) { console.error(error); }
    return res.writeHead(200).end('EVENT_RECEIVED');
  }
  if (req.method === 'GET' && url.pathname === '/') {
    return fs.createReadStream(path.join(publicDir, 'index.html')).pipe(res);
  }
  res.writeHead(404).end('Não encontrado');
});
server.listen(process.env.PORT || 3000, () => console.log('Painel em http://localhost:' + (process.env.PORT || 3000)));
