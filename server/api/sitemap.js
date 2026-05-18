import { getDb } from './_lib/mongodb.js';

const BASE = (process.env.SITE_BASE_URL || 'https://kadirdemir-nu.vercel.app').replace(/\/$/, '');

const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/hakkimda', changefreq: 'monthly', priority: '0.9' },
  { loc: '/videolar', changefreq: 'weekly', priority: '0.9' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.9' },
  { loc: '/setup', changefreq: 'monthly', priority: '0.8' },
  { loc: '/iletisim', changefreq: 'yearly', priority: '0.7' },
  { loc: '/kvkk', changefreq: 'yearly', priority: '0.3' },
  { loc: '/gizlilik', changefreq: 'yearly', priority: '0.3' },
  { loc: '/cerez-politikasi', changefreq: 'yearly', priority: '0.3' },
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const mod = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(BASE + loc)}</loc>${mod}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const db = await getDb();
    const now = new Date();
    const blogs = await db.collection('blogs').find({
      $or: [
        { publishAt: { $exists: false } },
        { publishAt: null },
        { publishAt: { $lte: now } },
      ],
    }, { projection: { slug: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray();

    const staticEntries = STATIC_PAGES.map(p => urlEntry(p)).join('\n');

    const blogEntries = blogs
      .filter(b => b.slug)
      .map(b => urlEntry({
        loc: `/blog/${b.slug}`,
        lastmod: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : undefined,
        changefreq: 'monthly',
        priority: '0.8',
      }))
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries}\n${blogEntries}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    return res.status(500).send('Sitemap generation failed');
  }
}
