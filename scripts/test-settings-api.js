import handler from '../api/settings.js';

function response() {
  return {
    statusCode: 200, body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
    setHeader() { return this; }
  };
}

const req = { method: 'GET', headers: { authorization: `Bearer ${process.env.DASHBOARD_API_KEY}` } };
const res = response();
await handler(req, res);
if (res.statusCode !== 200 || !res.body?.keyword) throw new Error(`Endpoint falhou: ${res.statusCode}`);
console.log('Endpoint /api/settings conectado ao Neon.', res.body);
