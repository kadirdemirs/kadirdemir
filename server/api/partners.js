import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { z } from 'zod';
import { stripHtml } from './_lib/sanitize.js';

const partnerSchema = z.object({
  name: z.string().min(1).max(120),
  logo: z.string().url().max(500).optional().or(z.literal('')),
  url: z.string().url().max(500).optional().or(z.literal('')),
  description: z.string().max(600).optional().or(z.literal('')),
  tier: z.enum(['gold', 'silver', 'bronze', 'partner']).default('partner'),
  order: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const db = await getDb();
  const col = db.collection('partners');

  if (req.method === 'GET') {
    const list = await col
      .find({ $or: [{ active: true }, { active: { $exists: false } }] })
      .sort({ tier: 1, order: 1, name: 1 })
      .toArray();
    return res.status(200).json(list.map((p) => ({
      _id: String(p._id),
      name: p.name,
      logo: p.logo || '',
      url: p.url || '',
      description: p.description || '',
      tier: p.tier || 'partner',
      order: typeof p.order === 'number' ? p.order : 999,
    })));
  }

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const session = requireAuth(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const parse = partnerSchema.safeParse(req.body);
      if (!parse.success) return res.status(400).json({ error: 'Invalid partner payload', details: parse.error.issues });
      const doc = {
        ...parse.data,
        name: stripHtml(parse.data.name),
        description: stripHtml(parse.data.description || ''),
        active: parse.data.active !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const r = await col.insertOne(doc);
      return res.status(201).json({ _id: String(r.insertedId), ...doc });
    }

    if (req.method === 'PUT') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const parse = partnerSchema.partial().safeParse(req.body);
      if (!parse.success) return res.status(400).json({ error: 'Invalid', details: parse.error.issues });
      const update = { ...parse.data, updatedAt: new Date() };
      if (update.name) update.name = stripHtml(update.name);
      if (update.description) update.description = stripHtml(update.description);
      const { ObjectId } = await import('mongodb');
      await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { ObjectId } = await import('mongodb');
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
