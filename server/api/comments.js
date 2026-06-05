import crypto from 'crypto';
import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { stripHtml } from './_lib/sanitize.js';
import { z } from 'zod';

const createSchema = z.object({
  postSlug: z.string().min(1).max(200),
  author: z.string().min(1).max(60),
  body: z.string().min(2).max(1500),
  parentId: z.string().max(40).optional(),
});

function visitorKey(req) {
  const ip = (req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '').toString().split(',')[0].trim();
  const ua = (req.headers?.['user-agent'] || '').toString().slice(0, 80);
  // KVKK/GDPR: IP + UA ham olarak saklanmaz, tek-yönlü hash ile anonimleştirilir.
  return crypto.createHash('sha256').update(`${ip}::${ua}`).digest('hex').slice(0, 32);
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const db = await getDb();
  const col = db.collection('blog_comments');
  const action = req.query?.action;

  if (req.method === 'GET') {
    // Admin: list across slugs (optionally filter by approval state)
    if (action === 'admin') {
      const session = requireAuth(req);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      const filterParam = (req.query?.filter || 'all').toString();
      const query = filterParam === 'pending'
        ? { approved: false }
        : filterParam === 'approved'
          ? { approved: true }
          : {};
      const all = await col.find(query).sort({ createdAt: -1 }).limit(500).toArray();
      return res.status(200).json(all.map((c) => ({
        ...c,
        _id: String(c._id),
      })));
    }

    const slug = req.query?.slug;
    if (!slug) return res.status(400).json({ error: 'slug required' });

    // admin: list all incl. pending for one slug
    if (action === 'all') {
      const session = requireAuth(req);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      const all = await col.find({ postSlug: slug }).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(all.map((c) => ({ ...c, _id: String(c._id) })));
    }

    // public: approved only
    const list = await col.find({ postSlug: slug, approved: { $ne: false } }).sort({ createdAt: 1 }).limit(500).toArray();
    return res.status(200).json(list.map((c) => ({
      _id: String(c._id),
      author: c.author,
      body: c.body,
      parentId: c.parentId || null,
      createdAt: c.createdAt,
    })));
  }

  if (req.method === 'POST') {
    const rl = await rateLimitCheck(req, { namespace: 'comment-post', maxRequests: 5 });
    if (!rl.allowed) return res.status(429).json({ error: 'Çok fazla yorum.' });

    const parse = createSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Geçersiz yorum' });

    const data = parse.data;
    // Moderation mode: when COMMENTS_MODERATION=on, new comments are hidden until approved.
    const moderationOn = String(process.env.COMMENTS_MODERATION || '').toLowerCase() === 'on';
    const doc = {
      postSlug: data.postSlug,
      author: stripHtml(data.author, 60),
      body: stripHtml(data.body, 1500),
      parentId: data.parentId || null,
      approved: !moderationOn,
      visitor: visitorKey(req),
      createdAt: new Date(),
    };

    const r = await col.insertOne(doc);
    return res.status(201).json({
      _id: String(r.insertedId),
      author: doc.author,
      body: doc.body,
      parentId: doc.parentId,
      createdAt: doc.createdAt,
      approved: doc.approved,
      pending: !doc.approved,
    });
  }

  if (req.method === 'PATCH') {
    const session = requireAuth(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { approved } = req.body || {};
    const { ObjectId } = await import('mongodb');
    await col.updateOne({ _id: new ObjectId(id) }, { $set: { approved: !!approved, updatedAt: new Date() } });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const session = requireAuth(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { ObjectId } = await import('mongodb');
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
