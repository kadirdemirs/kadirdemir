import { getDb } from './_lib/mongodb.js';

const BASE = (process.env.SITE_BASE_URL || 'https://kadirardademir.com').replace(/\/$/, '');
const SITE_TITLE = 'Kadir Demir';
const SITE_DESC = 'İstanbul\'dan yayın yapan YouTube içerik üreticisi. Oyun, vlog ve eğlence videoları, blog yazıları.';

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(s) {
  return `<![CDATA[${String(s || '').replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

function toRFC822(date) {
  const d = date ? new Date(date) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function buildItem(post) {
  const slug = post.slug;
  const url = `${BASE}/blog/${slug}`;
  const title = post.titleTr || post.titleEn || post.title || 'Untitled';
  const desc = post.excerptTr || post.excerptEn || post.excerpt || '';
  const content = post.contentTr || post.contentEn || post.content || desc;
  const cat = post.category || post.categoryEn || '';
  const pubDate = toRFC822(post.publishAt || post.date || post.createdAt);
  return [
    '<item>',
    `<title>${escapeXml(title)}</title>`,
    `<link>${escapeXml(url)}</link>`,
    `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
    `<pubDate>${pubDate}</pubDate>`,
    cat ? `<category>${escapeXml(cat)}</category>` : '',
    `<description>${cdata(desc)}</description>`,
    `<content:encoded>${cdata(content)}</content:encoded>`,
    '</item>',
  ].filter(Boolean).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    let posts = [];
    try {
      const db = await getDb();
      const now = new Date();
      posts = await db.collection('blogs').find({
        $or: [
          { publishAt: { $exists: false } },
          { publishAt: null },
          { publishAt: { $lte: now } },
        ],
      }).sort({ createdAt: -1, publishAt: -1 }).limit(40).toArray();
    } catch {
      posts = []
    }

    const lastBuild = toRFC822(posts[0]?.createdAt || posts[0]?.publishAt || posts[0]?.date);

    const items = posts.map(buildItem).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${escapeXml(BASE)}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>tr-TR</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${escapeXml(BASE + '/api/rss')}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('RSS error:', err);
    return res.status(500).send('RSS generation failed');
  }
}
