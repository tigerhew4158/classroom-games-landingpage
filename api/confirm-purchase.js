
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'payment-proofs';

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

function safeName(value = '') {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'file';
}

function extractTemplateCodes(orderText = '') {
  const codes = Array.from(new Set(String(orderText).match(/\b[SPH]\d{3}\b/gi) || []));
  if (/ALL\s*\/|全站模板|All templates|Semua templat/i.test(orderText) && codes.length === 0) return ['ALL'];
  return codes.map(code => code.toUpperCase());
}

function extractPlan(orderText = '') {
  const m = String(orderText).match(/(?:购买方案|Plan|Pakej)\s*[:：]\s*(.+)/i);
  return m ? m[1].trim() : '';
}

function extractAmount(orderText = '', labelRegex) {
  const m = String(orderText).match(labelRegex);
  return m ? Number(m[1]) || 0 : 0;
}

function parseOrderMeta(orderText = '') {
  const original_price = extractAmount(orderText, /(?:原价|Original price|Harga asal)\s*[:：]\s*RM\s*(\d+(?:\.\d+)?)/i);
  const final_price = extractAmount(orderText, /(?:预估总额|Estimated total|Jumlah anggaran)\s*[:：]\s*RM\s*(\d+(?:\.\d+)?)/i)
    || extractAmount(orderText, /(?:配套特价|Special price|Harga promosi)\s*[:：]\s*RM\s*(\d+(?:\.\d+)?)/i);
  const discount_amount = extractAmount(orderText, /(?:优惠|Savings|Penjimatan)\s*[:：]\s*RM\s*(\d+(?:\.\d+)?)/i);
  return {
    plan: extractPlan(orderText),
    selected_templates: extractTemplateCodes(orderText),
    original_price,
    final_price,
    discount_amount
  };
}

async function uploadPaymentProof(paymentProof, orderId) {
  if (!paymentProof || !paymentProof.contentBase64) return { url: '', path: '' };

  const filename = safeName(paymentProof.filename || 'payment-proof');
  const mimeType = paymentProof.mimeType || 'application/octet-stream';
  const ext = filename.includes('.') ? filename.split('.').pop() : 'bin';
  const objectPath = `${orderId}/${Date.now()}_${safeName(filename)}`;
  const buffer = Buffer.from(paymentProof.contentBase64, 'base64');

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${objectPath}`;
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      ...getHeader(),
      'Content-Type': mimeType,
      'x-upsert': 'true'
    },
    body: buffer
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase Storage upload failed: ${response.status} ${detail}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${objectPath}`;
  return { url: publicUrl, path: objectPath };
}

async function insertOrder(order) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      ...getHeader(),
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(order)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase order insert failed: ${response.status} ${detail}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function updateOrderProof(id, proof) {
  if (!id) return;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      ...getHeader(),
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      payment_proof_url: proof.url,
      payment_proof_path: proof.path
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase proof update failed: ${response.status} ${detail}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return jsonResponse(res, 200, { ok: true });
  if (req.method !== 'POST') return jsonResponse(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    requireSupabase();
    const data = await readJsonBody(req);
    const buyer = data.buyer || {};
    const orderText = data.orderText || '';
    const meta = parseOrderMeta(orderText);

    if (!buyer.name || !buyer.email) {
      return jsonResponse(res, 400, { ok: false, error: 'Missing buyer name or email' });
    }

    const orderPayload = {
      buyer_name: buyer.name || '',
      buyer_phone: buyer.phone || '',
      buyer_email: buyer.email || '',
      plan: meta.plan || '',
      selected_templates: meta.selected_templates || [],
      original_price: meta.original_price || 0,
      final_price: meta.final_price || 0,
      discount_amount: meta.discount_amount || 0,
      payment_proof_url: '',
      payment_proof_path: '',
      status: 'pending',
      admin_note: '',
      lang: data.lang || 'zh',
      order_text: orderText,
      raw: data
    };

    const inserted = await insertOrder(orderPayload);
    let proof = { url: '', path: '' };

    if (data.paymentProof && inserted && inserted.id) {
      proof = await uploadPaymentProof(data.paymentProof, inserted.id);
      await updateOrderProof(inserted.id, proof);
    }

    return jsonResponse(res, 200, {
      ok: true,
      message: 'Order saved to Supabase',
      orderId: inserted && inserted.id,
      paymentProofUrl: proof.url
    });
  } catch (error) {
    console.error(error);
    return jsonResponse(res, 500, {
      ok: false,
      error: error.message || 'Server error'
    });
  }
};
