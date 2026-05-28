import { getDb } from './_lib/mongodb.js';

const BASE = (process.env.SITE_BASE_URL || 'https://kadirardademir.com').replace(/\/$/, '');

const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0', images: ['/icon-512.png'] },
  { loc: '/hakkimda', changefreq: 'monthly', priority: '0.9', images: ['/kadir.jpg'] },
  { loc: '/videolar', changefreq: 'weekly', priority: '0.9' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.9' },
  { loc: '/setup', changefreq: 'monthly', priority: '0.8' },
  { loc: '/iletisim', changefreq: 'yearly', priority: '0.7' },
  { loc: '/sponsor', changefreq: 'monthly', priority: '0.7' },
  { loc: '/medya-kit', changefreq: 'monthly', priority: '0.7' },
  { loc: '/sor', changefreq: 'weekly', priority: '0.6' },
  { loc: '/partnerler', changefreq: 'monthly', priority: '0.6' },
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

function absoluteUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${BASE}${value.startsWith('/') ? '' : '/'}${value}`;
}

function imageTag(src, caption, title) {
  if (!src) return '';
  return `    <image:image>\n      <image:loc>${escapeXml(absoluteUrl(src))}</image:loc>${
    title ? `\n      <image:title>${escapeXml(title)}</image:title>` : ''
  }${caption ? `\n      <image:caption>${escapeXml(caption)}</image:caption>` : ''}\n    </image:image>`;
}

function urlEntry({ loc, lastmod, changefreq, priority, images = [], imageMeta = [] }) {
  const mod = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  const imgs = images
    .map((src, idx) => imageTag(src, imageMeta[idx]?.caption, imageMeta[idx]?.title))
    .filter(Boolean)
    .join('\n');
  return `  <url>\n    <loc>${escapeXml(BASE + loc)}</loc>${mod}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>${imgs ? `\n${imgs}` : ''}\n  </url>`;
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
    }, { projection: { slug: 1, createdAt: 1, updatedAt: 1, coverImage: 1, image: 1, titleTr: 1, title: 1, excerptTr: 1, excerpt: 1 } }).sort({ createdAt: -1 }).toArray();

    const staticEntries = STATIC_PAGES.map(p => urlEntry(p)).join('\n');

    const blogEntries = blogs
      .filter(b => b.slug)
      .map(b => {
        const cover = b.coverImage || b.image;
        const lastmod = (b.updatedAt || b.createdAt)
          ? new Date(b.updatedAt || b.createdAt).toISOString().split('T')[0]
          : undefined;
        return urlEntry({
          loc: `/blog/${b.slug}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.8',
          images: cover ? [cover] : [],
          imageMeta: cover
            ? [{ title: b.titleTr || b.title || '', caption: b.excerptTr || b.excerpt || '' }]
            : [],
        });
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticEntries}
${blogEntries}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    return res.status(500).send('Sitemap generation failed');
  }
}
