import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { stripHtml } from './_lib/sanitize.js';
import { z } from 'zod';

const askSchema = z.object({
  question: z.string().min(5).max(500),
  author: z.string().max(60).optional().or(z.literal('')),
});

const answerSchema = z.object({
  answer: z.string().min(1).max(2000),
  published: z.boolean().optional(),
});

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const db = await getDb();
  const col = db.collection('ama_questions');
  const action = req.query?.action;

  // GET — public answered list
  if (req.method === 'GET') {
    if (action === 'pending') {
      const session = requireAuth(req);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      const list = await col.find({ answer: { $exists: false } }).sort({ createdAt: -1 }).limit(100).toArray();
      return res.status(200).json(list.map((q) => ({ ...q, _id: String(q._id) })));
    }

    const filter = { answer: { $exists: true, $ne: '' }, published: { $ne: false } };
    const list = await col.find(filter).sort({ answeredAt: -1, createdAt: -1 }).limit(50).toArray();
    return res.status(200).json(list.map((q) => ({
      _id: String(q._id),
      question: q.question,
      author: q.author || null,
      answer: q.answer,
      upvotes: q.upvotes || 0,
      askedAt: q.createdAt,
      answeredAt: q.answeredAt,
    })));
  }

  // POST — public ask OR upvote OR admin answer
  if (req.method === 'POST') {
    if (action === 'upvote') {
      const rl = await rateLimitCheck(req, { namespace: 'ama-upvote', maxRequests: 30 });
      if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { ObjectId } = await import('mongodb');
      let objId;
      try { objId = new ObjectId(id); } catch { return res.status(400).json({ error: 'Invalid id' }); }
      await col.updateOne({ _id: objId }, { $inc: { upvotes: 1 } });
      const doc = await col.findOne({ _id: objId });
      return res.status(200).json({ upvotes: doc?.upvotes || 0 });
    }

    if (action === 'ask') {
      const rl = await rateLimitCheck(req, { namespace: 'ama-ask', maxRequests: 5 });
      if (!rl.allowed) return res.status(429).json({ error: 'Çok fazla istek. Birazdan tekrar dene.' });
      const parse = askSchema.safeParse(req.body);
      if (!parse.success) return res.status(400).json({ error: 'Soru çok kısa veya çok uzun.' });
      const doc = {
        question: stripHtml(parse.data.question, 500),
        author: parse.data.author ? stripHtml(parse.data.author, 60) : 'Anonim',
        createdAt: new Date(),
      };
      await col.insertOne(doc);
      return res.status(201).json({ ok: true });
    }

    // Admin: answer
    const session = requireAuth(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: 'id required' });
    const parse = answerSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Invalid', details: parse.error.issues });
    const { ObjectId } = await import('mongodb');
    await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: {
        answer: stripHtml(parse.data.answer, 2000),
        published: parse.data.published !== false,
        answeredAt: new Date(),
      } }
    );
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
