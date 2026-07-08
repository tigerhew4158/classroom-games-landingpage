
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function jsonResponse(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function requireSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
}

function getHeader() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  };
}

function isAllowed(req, body = {}) {
  const headerPassword = req.headers['x-admin-password'];
  const queryPassword = new URL(req.url, 'http://localhost').searchParams.get('password');
  const password = headerPassword || body.password || queryPassword || '';
  return ADMIN_PASSWORD && password === ADMIN_PASSWORD;
}

async function listOrders() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=200`, {
    headers: getHeader()
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function updateOrder(id, payload) {
  const allowed = {};
  if ('status' in payload) allowed.status = payload.status;
  if ('admin_note' in payload) allowed.admin_note = payload.admin_note;
  if ('sent_account_at' in payload) allowed.sent_account_at = payload.sent_account_at;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      ...getHeader(),
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(allowed)
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return jsonResponse(res, 200, { ok: true });

  try {
    requireSupabase();

    if (req.method === 'GET') {
      if (!isAllowed(req)) return jsonResponse(res, 401, { ok: false, error: 'Unauthorized' });
      const orders = await listOrders();
      return jsonResponse(res, 200, { ok: true, orders });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!isAllowed(req, body)) return jsonResponse(res, 401, { ok: false, error: 'Unauthorized' });
      if (!body.id) return jsonResponse(res, 400, { ok: false, error: 'Missing order id' });
      const updated = await updateOrder(body.id, body);
      return jsonResponse(res, 200, { ok: true, order: Array.isArray(updated) ? updated[0] : updated });
    }

    return jsonResponse(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return jsonResponse(res, 500, { ok: false, error: error.message || 'Server error' });
  }
};
