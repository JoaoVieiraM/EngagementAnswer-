export function requireDashboardAuth(req, res) {
  const expected = process.env.DASHBOARD_API_KEY;
  if (!expected || req.headers.authorization === `Bearer ${expected}`) return true;
  res.status(401).json({ error: 'Não autorizado.' }); return false;
}
