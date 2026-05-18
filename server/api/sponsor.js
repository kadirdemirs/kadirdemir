import { getDb } from './_lib/mongodb.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { stripHtml } from './_lib/sanitize.js';
import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const schema = z.object({
  company: z.string().min(1).max(120),
  contactName: z.string().min(1).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional().or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
  campaignType: z.enum(['video', 'shorts', 'live-stream', 'long-term', 'event', 'product-review', 'other']).default('other'),
  budget: z.enum(['<5k', '5k-15k', '15k-50k', '50k-100k', '100k+', 'open']).default('open'),
  deadline: z.string().max(40).optional().or(z.literal('')),
  message: z.string().min(10).max(2000),
});

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = await rateLimitCheck(req, { namespace: 'sponsor-submit', maxRequests: 3 });
  if (!rl.allowed) return res.status(429).json({ error: `Çok fazla istek. ${rl.retryAfter} dakika sonra tekrar deneyin.` });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const parse = schema.safeParse(body);
  if (!parse.success) {
    const issue = parse.error.issues?.[0];
    return res.status(400).json({ error: issue?.message || 'Geçersiz form verisi' });
  }
  const data = parse.data;
  if (!EMAIL_RE.test(data.email)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });

  try {
    const db = await getDb();
    const doc = {
      company: stripHtml(data.company, 120),
      contactName: stripHtml(data.contactName, 120),
      email: data.email.toLowerCase(),
      phone: data.phone ? stripHtml(data.phone, 40) : '',
      website: data.website || '',
      campaignType: data.campaignType,
      budget: data.budget,
      deadline: data.deadline ? stripHtml(data.deadline, 40) : '',
      message: stripHtml(data.message, 2000),
      status: 'new',
      createdAt: new Date(),
    };
    await db.collection('sponsor_inquiries').insertOne(doc);

    // Best-effort notification
    try {
      const { sendNotification } = await import('./_lib/notify.js');
      if (typeof sendNotification === 'function') {
        await sendNotification({
          subject: `Yeni sponsor başvurusu: ${doc.company}`,
          html: `<p><strong>${doc.company}</strong> (${doc.contactName})</p>
                 <p>Email: ${doc.email}<br/>Telefon: ${doc.phone || '-'}<br/>Web: ${doc.website || '-'}</p>
                 <p>Kampanya: ${doc.campaignType} | Bütçe: ${doc.budget} | Deadline: ${doc.deadline || '-'}</p>
                 <hr/><p>${doc.message.replace(/\n/g, '<br/>')}</p>`,
        });
      }
    } catch { /* swallow notification errors */ }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Sunucu hatası' });
  }
}
