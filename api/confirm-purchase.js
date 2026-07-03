
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tigerhew@gmail.com';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw || '{}');
}

function htmlEmail(title, bodyText) {
  const safeBody = escapeHtml(bodyText).replace(/\n/g, '<br>');
  return `
  <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.65;color:#0f172a">
    <h2 style="margin:0 0 14px;color:#0f172a">${escapeHtml(title)}</h2>
    <div style="padding:16px;border:1px solid #dbeafe;border-radius:12px;background:#f8fafc">${safeBody}</div>
  </div>`;
}

async function sendResendEmail({ to, subject, text, attachments = [] }) {
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
  if (!process.env.FROM_EMAIL) throw new Error('Missing FROM_EMAIL');

  const payload = {
    from: process.env.FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html: htmlEmail(subject, text)
  };
  if (attachments.length) payload.attachments = attachments;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const body = await readJsonBody(req);
    const buyer = body.buyer || {};
    const orderText = body.orderText || '';
    const lang = body.lang || 'zh';

    if (!buyer.email) return res.status(400).json({ ok: false, error: 'Buyer email is required' });
    if (!buyer.name) return res.status(400).json({ ok: false, error: 'Buyer name is required' });
    if (!orderText) return res.status(400).json({ ok: false, error: 'Order text is required' });

    const proof = body.paymentProof;
    const attachments = [];
    if (proof && proof.contentBase64 && proof.filename) {
      attachments.push({ filename: proof.filename, content: proof.contentBase64 });
    }

    const subjectMap = {
      zh: '课堂游戏网站购买订单',
      en: 'Classroom Game Website Purchase Order',
      ms: 'Pesanan Pembelian Laman Permainan Kelas'
    };
    const buyerSubjectMap = {
      zh: '课堂游戏网站订单确认',
      en: 'Classroom Game Website Order Confirmation',
      ms: 'Pengesahan Pesanan Laman Permainan Kelas'
    };

    const adminText = `阿虎老师您好，以下是新的课堂游戏网站购买订单：\n\n${orderText}\n\n提交时间：${body.submittedAt || new Date().toISOString()}\n页面：${body.pageUrl || '-'}\n\n备注：WhatsApp 通知采用手动确认发送，购买者提交后会打开 WhatsApp 并需按 Send。`;

    const buyerTextMap = {
      zh: `谢谢您的购买，已完成购买程序，系统会在24小时内处理。请耐心等候。\n\n系统会通过电邮，发送游戏平台登入账号及密码。\n\n您的订单资料：\n${orderText}`,
      en: `Thank you for your purchase. The purchase process has been completed. The system will process it within 24 hours. Please wait patiently.\n\nThe game platform login account and password will be sent to you by email.\n\nYour order details:\n${orderText}`,
      ms: `Terima kasih atas pembelian anda. Proses pembelian telah selesai. Sistem akan memprosesnya dalam masa 24 jam. Sila tunggu dengan sabar.\n\nAkaun log masuk dan kata laluan platform permainan akan dihantar melalui e-mel.\n\nButiran pesanan anda:\n${orderText}`
    };

    const adminEmail = await sendResendEmail({
      to: ADMIN_EMAIL,
      subject: subjectMap[lang] || subjectMap.zh,
      text: adminText,
      attachments
    });

    const buyerEmail = await sendResendEmail({
      to: buyer.email,
      subject: buyerSubjectMap[lang] || buyerSubjectMap.zh,
      text: buyerTextMap[lang] || buyerTextMap.zh
    });

    return res.status(200).json({ ok: true, adminEmail, buyerEmail, whatsapp: { mode: 'manual_wa_me' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error.message || 'Server error' });
  }
};
