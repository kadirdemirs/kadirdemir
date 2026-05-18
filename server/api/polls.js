import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { stripHtml } from './_lib/sanitize.js';
import { z } from 'zod';

const createSchema = z.object({
  question: z.string().min(3).max(200),
  options: z.array(z.string().min(1).max(100)).min(2).max(8),
  active: z.boolean().optional(),
});

function visitorKey(req) {
  // Best-effort visitor identification for vote uniqueness (NOT secure auth)
  const ip = (req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '').toString().split(',')[0].trim();
  const ua = (req.headers?.['user-agent'] || '').toString().slice(0, 80);
  return `${ip}::${ua}`;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const db = await getDb();
  const col = db.collection('polls');
  const action = req.query?.action;

  if (req.method === 'GET') {
    // GET /api/polls — most recent active poll for embeds
    if (action === 'active' || !action) {
      const poll = await col.findOne({ active: true }, { sort: { createdAt: -1 } });
      if (!poll) return res.status(200).json(null);
      const voted = poll.voters?.includes(visitorKey(req)) || false;
      return res.status(200).json({
        _id: String(poll._id),
        question: poll.question,
        options: poll.options || [],
        totalVotes: (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0),
        voted,
        createdAt: poll.createdAt,
      });
    }

    // GET /api/polls?action=list (admin)
    if (action === 'list') {
      const session = requireAuth(req);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      const list = await col.find({}).sort({ createdAt: -1 }).limit(50).toArray();
      return res.status(200).json(list.map((p) => ({ ...p, _id: String(p._id) })));
    }
  }

  if (req.method === 'POST') {
    // POST /api/polls?action=vote  (public, rate-limited)
    if (action === 'vote') {
      const rl = await rateLimitCheck(req, { namespace: 'poll-vote', maxRequests: 20 });
      if (!rl.allowed) return res.status(429).json({ error: 'Too many votes' });

      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { pollId, optionIndex } = body || {};
      if (!pollId || typeof optionIndex !== 'number') return res.status(400).json({ error: 'pollId & optionIndex required' });

      const { ObjectId } = await import('mongodb');
      let pollObjId;
      try { pollObjId = new ObjectId(pollId); } catch { return res.status(400).json({ error: 'Invalid pollId' }); }

      const poll = await col.findOne({ _id: pollObjId, active: true });
      if (!poll) return res.status(404).json({ error: 'Poll not found or inactive' });
      if (optionIndex < 0 || optionIndex >= (poll.options || []).length) return res.status(400).json({ error: 'Invalid option' });

      const vKey = visitorKey(req);
      if ((poll.voters || []).includes(vKey)) return res.status(409).json({ error: 'Already voted' });

      const updatePath = `options.${optionIndex}.votes`;
      await col.updateOne(
        { _id: pollObjId },
        {
          $inc: { [updatePath]: 1 },
          $addToSet: { voters: vKey },
          $set: { updatedAt: new Date() },
        }
      );

      const updated = await col.findOne({ _id: pollObjId });
      return res.status(200).json({
        _id: String(updated._id),
        question: updated.question,
        options: updated.options,
        totalVotes: updated.options.reduce((s, o) => s + (o.votes || 0), 0),
        voted: true,
      });
    }

    // POST /api/polls  (admin: create)
    const session = requireAuth(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Invalid payload', details: parse.error.issues });
    const data = parse.data;
    if (data.active !== false) {
      // Deactivate previous active polls to keep one active at a time
      await col.updateMany({ active: true }, { $set: { active: false } });
    }
    const doc = {
      question: stripHtml(data.question, 200),
      options: data.options.map((label) => ({ label: stripHtml(label, 100), votes: 0 })),
      voters: [],
      active: data.active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const r = await col.insertOne(doc);
    return res.status(201).json({ _id: String(r.insertedId), ...doc });
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
