import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import jwt from 'jsonwebtoken';

// ── GA4 helpers (kept in this file to stay within Vercel 12-function limit) ──
let _ga4Token = null;
let _ga4Exp = 0;

async function ga4Token() {
  const email = process.env.GA4_CLIENT_EMAIL;
  const key = (process.env.GA4_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) return null;
  if (_ga4Token && Date.now() < _ga4Exp - 60000) return _ga4Token;
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 },
    key, { algorithm: 'RS256' }
  );
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });
  if (!r.ok) { console.error('GA4 token error:', await r.text()); return null; }
  const d = await r.json();
  _ga4Token = d.access_token;
  _ga4Exp = Date.now() + d.expires_in * 1000;
  return _ga4Token;
}

async function ga4Report(propId, token, body) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propId}:runReport`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { console.error('GA4 report error:', await r.text()); return null; }
  return r.json();
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query?.action;

  // ── Heartbeat (POST /api/content?action=heartbeat) — no auth ──
  // Tracks active visitor sessions. Frontend sends every ~30s while tab is visible.
  if (action === 'heartbeat' && req.method === 'POST') {
    try {
      const db = await getDb();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { sessionId: rawSid, path: rawPath } = body || {};
      const sessionId = typeof rawSid === 'string' ? rawSid.slice(0, 64) : null;
      if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
      const path = typeof rawPath === 'string' ? rawPath.slice(0, 200) : '/';
      await db.collection('visitor_sessions').updateOne(
        { sessionId },
        { $set: { sessionId, lastSeen: new Date(), path } },
        { upsert: true }
      );
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Heartbeat error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Active visitors count (GET /api/content?action=active-visitors) — public ──
  // Counts sessions seen in the last 2 minutes. No auth: safe public metric.
  if (action === 'active-visitors' && req.method === 'GET') {
    try {
      const db = await getDb();
      const cutoff = new Date(Date.now() - 45 * 1000);
      const count = await db.collection('visitor_sessions').countDocuments({ lastSeen: { $gte: cutoff } });
      // Opportunistic cleanup: remove sessions older than 1 hour
      const purge = new Date(Date.now() - 60 * 60 * 1000);
      db.collection('visitor_sessions').deleteMany({ lastSeen: { $lt: purge } }).catch(() => {});
      return res.status(200).json({ activeUsers: count });
    } catch (err) {
      console.error('Active visitors error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── AI usage stats (GET /api/content?action=ai-usage) — auth required ──
  if (action === 'ai-usage' && req.method === 'GET') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });
    try {
      const db = await getDb();
      const col = db.collection('ai_usage');
      const now = Date.now();
      const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
      const startOfMinute = new Date(now - 60 * 1000);
      const startOf30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const [todayCount, lastMinute, total30d, tokenAgg] = await Promise.all([
        col.countDocuments({ createdAt: { $gte: startOfDay } }),
        col.countDocuments({ createdAt: { $gte: startOfMinute } }),
        col.countDocuments({ createdAt: { $gte: startOf30d } }),
        col.aggregate([
          { $match: { createdAt: { $gte: startOfDay } } },
          { $group: { _id: null, totalTokens: { $sum: '$totalTokens' } } },
        ]).toArray(),
      ]);

      return res.status(200).json({
        today: todayCount,
        lastMinute,
        last30Days: total30d,
        tokensToday: tokenAgg?.[0]?.totalTokens || 0,
        limits: { rpm: 10, rpd: 250, tier: 'free' },
      });
    } catch (err) {
      console.error('AI usage error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Pageview tracking (POST /api/content?action=pageview) — no auth ──
  if (action === 'pageview' && req.method === 'POST') {
    try {
      const db = await getDb();
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { path: rawPath, referrer: rawReferrer } = body || {};
      const path = typeof rawPath === 'string' ? rawPath.slice(0, 200) : '/';
      const referrer = typeof rawReferrer === 'string' ? rawReferrer.slice(0, 500) : '';
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      // Increment daily counter for this path
      await db.collection('pageviews').updateOne(
        { date: today, path: path || '/' },
        {
          $inc: { count: 1 },
          $setOnInsert: { date: today, path: path || '/' },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );

      // Track referrer source with platform-level detail
      let source = 'direct';
      let sourceDetail = null;
      const ref = (referrer || '').toLowerCase();

      if (ref.trim()) {
        if (ref.includes('google.') || ref.includes('/search?') && ref.includes('google')) { source = 'organic'; sourceDetail = 'google'; }
        else if (ref.includes('bing.com')) { source = 'organic'; sourceDetail = 'bing'; }
        else if (ref.includes('yahoo.com')) { source = 'organic'; sourceDetail = 'yahoo'; }
        else if (ref.includes('yandex.')) { source = 'organic'; sourceDetail = 'yandex'; }
        else if (ref.includes('duckduckgo.com')) { source = 'organic'; sourceDetail = 'duckduckgo'; }
        else if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) { source = 'social'; sourceDetail = 'instagram'; }
        else if (ref.includes('tiktok.com') || ref.includes('vm.tiktok.com')) { source = 'social'; sourceDetail = 'tiktok'; }
        else if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('m.facebook.com')) { source = 'social'; sourceDetail = 'facebook'; }
        else if (ref.includes('linkedin.com')) { source = 'social'; sourceDetail = 'linkedin'; }
        else if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) { source = 'social'; sourceDetail = 'twitter'; }
        else if (ref.includes('youtube.com') || ref.includes('youtu.be')) { source = 'social'; sourceDetail = 'youtube'; }
        else if (ref.includes('whatsapp.com') || ref.includes('wa.me')) { source = 'social'; sourceDetail = 'whatsapp'; }
        else {
          source = 'referral';
          try {
            const u = new URL(referrer.startsWith('http') ? referrer : `https://${referrer}`);
            sourceDetail = u.hostname.replace(/^www\./, '');
          } catch { sourceDetail = referrer.slice(0, 100); }
        }
      }

      await db.collection('traffic_sources').updateOne(
        { date: today, source, detail: sourceDetail },
        { $inc: { count: 1 }, $setOnInsert: { date: today, source, detail: sourceDetail } },
        { upsert: true }
      );

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Pageview error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Analytics summary (GET /api/content?action=analytics) — auth required ──
  if (action === 'analytics' && req.method === 'GET') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      const db = await getDb();
      const period = req.query?.period || 'week';

      // Build date range
      const now = new Date();
      const days = period === 'quarter' ? 90 : period === 'month' ? 30 : 7;
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }
      const startDate = dates[0];

      // Daily totals
      const dailyRaw = await db.collection('pageviews')
        .aggregate([
          { $match: { date: { $gte: startDate } } },
          { $group: { _id: '$date', total: { $sum: '$count' } } },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const dailyMap = {};
      dailyRaw.forEach(d => { dailyMap[d._id] = d.total; });
      const dailyData = dates.map(d => ({ date: d, count: dailyMap[d] || 0 }));

      // Total visits in period
      const totalVisits = dailyData.reduce((s, d) => s + d.count, 0);

      // Page breakdown
      const pageRaw = await db.collection('pageviews')
        .aggregate([
          { $match: { date: { $gte: startDate } } },
          { $group: { _id: '$path', total: { $sum: '$count' } } },
          { $sort: { total: -1 } },
          { $limit: 8 },
        ])
        .toArray();

      // Traffic sources — grouped with platform-level detail
      const sourceRaw = await db.collection('traffic_sources')
        .aggregate([
          { $match: { date: { $gte: startDate } } },
          { $group: { _id: { source: '$source', detail: '$detail' }, total: { $sum: '$count' } } },
          { $sort: { total: -1 } },
        ])
        .toArray();

      // Group by source, collect details
      const srcGroups = {};
      for (const r of sourceRaw) {
        const src = r._id.source || 'direct';
        const det = r._id.detail || null;
        if (!srcGroups[src]) srcGroups[src] = { total: 0, details: {} };
        srcGroups[src].total += r.total;
        if (det) {
          srcGroups[src].details[det] = (srcGroups[src].details[det] || 0) + r.total;
        }
      }

      const SOURCE_NAMES = { organic: 'Organik Arama', social: 'Sosyal Medya', direct: 'Direkt', referral: 'Referans' };
      const totalSource = Object.values(srcGroups).reduce((s, g) => s + g.total, 0) || 1;

      const sources = Object.entries(srcGroups)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([key, group]) => ({
          name: SOURCE_NAMES[key] || key,
          key,
          count: group.total,
          value: Math.round((group.total / totalSource) * 100),
          details: Object.entries(group.details)
            .sort((a, b) => b[1] - a[1])
            .map(([det, cnt]) => ({ key: det, name: det, count: cnt })),
        }));

      const maxPage = pageRaw[0]?.total || 1;
      const pages = pageRaw.map(p => ({
        path: p._id,
        views: p.total,
        percent: Math.round((p.total / maxPage) * 100),
      }));

      // Previous period for comparison
      const prevStart = new Date(now);
      prevStart.setDate(prevStart.getDate() - days * 2);
      const prevEnd = new Date(now);
      prevEnd.setDate(prevEnd.getDate() - days);
      const prevStartStr = prevStart.toISOString().slice(0, 10);
      const prevEndStr = prevEnd.toISOString().slice(0, 10);

      const prevRaw = await db.collection('pageviews')
        .aggregate([
          { $match: { date: { $gte: prevStartStr, $lt: prevEndStr } } },
          { $group: { _id: null, total: { $sum: '$count' } } },
        ])
        .toArray();
      const prevTotal = prevRaw[0]?.total || 0;
      const growth = prevTotal > 0 ? Math.round(((totalVisits - prevTotal) / prevTotal) * 100) : null;

      return res.status(200).json({ dailyData, totalVisits, growth, pages, sources, period });
    } catch (err) {
      console.error('Analytics error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── GA4 Data API (GET /api/content?action=ga4) — auth required ──
  if (action === 'ga4' && req.method === 'GET') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId || !process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) {
      return res.status(200).json({ configured: false, error: 'GA4 yapılandırılmamış' });
    }
    try {
      const token = await ga4Token();
      if (!token) return res.status(200).json({ configured: false, error: 'GA4 token alınamadı' });

      const period = req.query?.period || 'week';
      const days = period === 'quarter' ? 90 : period === 'month' ? 30 : 7;
      const startDate = `${days}daysAgo`;

      const [dailyReport, pageReport, sourceReport, prevReport, activeReport] = await Promise.all([
        ga4Report(propertyId, token, { dateRanges: [{ startDate, endDate: 'today' }], dimensions: [{ name: 'date' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: 'date' } }] }),
        ga4Report(propertyId, token, { dateRanges: [{ startDate, endDate: 'today' }], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 8 }),
        ga4Report(propertyId, token, { dateRanges: [{ startDate, endDate: 'today' }], dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
        ga4Report(propertyId, token, { dateRanges: [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }], metrics: [{ name: 'screenPageViews' }] }),
        ga4Report(propertyId, token, { dateRanges: [{ startDate: 'today', endDate: 'today' }], metrics: [{ name: 'activeUsers' }] }),
      ]);

      const dailyData = (dailyReport?.rows || []).map(r => ({ date: r.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), count: parseInt(r.metricValues[0].value, 10) || 0 }));
      const totalVisits = dailyData.reduce((s, d) => s + d.count, 0);
      const maxPV = parseInt(pageReport?.rows?.[0]?.metricValues?.[0]?.value || '1', 10) || 1;
      const pages = (pageReport?.rows || []).map(r => ({ path: r.dimensionValues[0].value, views: parseInt(r.metricValues[0].value, 10) || 0, percent: Math.round((parseInt(r.metricValues[0].value, 10) / maxPV) * 100) }));
      const srcMap = { 'Organic Search': 'organic', 'Organic Social': 'social', Direct: 'direct', Referral: 'referral', 'Paid Search': 'paid', 'Paid Social': 'paid_social' };
      const srcNames = { organic: 'Organik Arama', social: 'Sosyal Medya', direct: 'Direkt', referral: 'Referans', paid: 'Ücretli Arama', paid_social: 'Ücretli Sosyal' };
      const totalSess = (sourceReport?.rows || []).reduce((s, r) => s + (parseInt(r.metricValues[0].value, 10) || 0), 0) || 1;
      const sources = (sourceReport?.rows || []).map(r => { const n = r.dimensionValues[0].value; const k = srcMap[n] || n.toLowerCase().replace(/\s+/g, '_'); const c = parseInt(r.metricValues[0].value, 10) || 0; return { name: srcNames[k] || n, key: k, count: c, value: Math.round((c / totalSess) * 100) }; });
      const prevTotal = parseInt(prevReport?.rows?.[0]?.metricValues?.[0]?.value || '0', 10);
      const growth = prevTotal > 0 ? Math.round(((totalVisits - prevTotal) / prevTotal) * 100) : null;
      const activeUsers = parseInt(activeReport?.rows?.[0]?.metricValues?.[0]?.value || '0', 10);

      return res.status(200).json({ configured: true, source: 'google_analytics', dailyData, totalVisits, growth, pages, sources, activeUsers, period });
    } catch (err) {
      console.error('GA4 error:', err);
      return res.status(500).json({ error: 'GA4 verisi alınamadı.' });
    }
  }

  // ── Dynamic sitemap (GET /api/content?action=sitemap) — no auth ──
  if (action === 'sitemap' && req.method === 'GET') {
    try {
      const db2 = await getDb();
      const [ytCache, settingsDoc, blogsList] = await Promise.all([
        db2.collection('siteContent').findOne({ section: 'youtube-cache' }).catch(() => null),
        db2.collection('siteContent').findOne({ section: 'site-settings' }).catch(() => null),
        db2.collection('blogs').find({ published: { $ne: false } }, { projection: { slug: 1, updatedAt: 1, createdAt: 1 } }).toArray().catch(() => []),
      ]);
      const settingsData = (settingsDoc?.data) || {};
      const ytVideos = (ytCache?.data?.videos) || [];

      const base = (settingsData.baseUrl || process.env.SITE_BASE_URL || 'https://kadirdemir-nu.vercel.app').replace(/\/$/, '');
      const today = new Date().toISOString().slice(0, 10);
      const staticUrls = [
        { loc: '/', priority: '1.0', freq: 'weekly' },
        { loc: '/hakkimda', priority: '0.9', freq: 'monthly' },
        { loc: '/videolar', priority: '0.95', freq: 'daily' },
        { loc: '/blog', priority: '0.9', freq: 'weekly' },
        { loc: '/setup', priority: '0.8', freq: 'monthly' },
        { loc: '/iletisim', priority: '0.8', freq: 'yearly' },
        { loc: '/kvkk', priority: '0.3', freq: 'yearly' },
        { loc: '/gizlilik', priority: '0.3', freq: 'yearly' },
        { loc: '/cerez-politikasi', priority: '0.3', freq: 'yearly' },
      ];

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

      for (const u of staticUrls) {
        xml += `  <url>\n    <loc>${base}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
      }

      for (const b of blogsList) {
        if (!b.slug) continue;
        const lastmod = (b.updatedAt || b.createdAt || new Date()).toISOString().slice(0, 10);
        xml += `  <url>\n    <loc>${base}/blog/${b.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }

      // Add VideoObject entries from YouTube cache so videos can be indexed
      for (const v of ytVideos.slice(0, 50)) {
        if (!v.youtubeId) continue;
        const watchUrl = `https://www.youtube.com/watch?v=${v.youtubeId}`;
        const lastmod = (v.publishedAt ? new Date(v.publishedAt) : new Date()).toISOString().slice(0, 10);
        const escapedTitle = (v.title || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
        const escapedDesc = (v.description || v.title || '').slice(0, 300).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
        xml += `  <url>\n    <loc>${base}/videolar</loc>\n    <lastmod>${lastmod}</lastmod>\n    <video:video>\n      <video:thumbnail_loc>${v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}</video:thumbnail_loc>\n      <video:title>${escapedTitle}</video:title>\n      <video:description>${escapedDesc || escapedTitle}</video:description>\n      <video:player_loc>https://www.youtube.com/embed/${v.youtubeId}</video:player_loc>\n      <video:content_loc>${watchUrl}</video:content_loc>\n    </video:video>\n  </url>\n`;
      }

      xml += '</urlset>';
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(xml);
    } catch (err) {
      console.error('Sitemap error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  const db = await getDb();
  const collection = db.collection('siteContent');

  // ── YouTube videos (GET /api/content?action=youtube-videos) — public ──
  // Reads cached videos from siteContent. Cache is populated by youtube-refresh.
  if (action === 'youtube-videos' && req.method === 'GET') {
    try {
      const cache = await collection.findOne({ section: 'youtube-cache' });
      const videos = cache?.data?.videos || [];
      const updatedAt = cache?.updatedAt || null;
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).json({ videos, updatedAt });
    } catch (err) {
      console.error('YouTube videos GET error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── YouTube refresh (POST /api/content?action=youtube-refresh) — auth required ──
  // Fetches latest uploads from YouTube Data API v3 and caches them.
  if (action === 'youtube-refresh' && req.method === 'POST') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      const settingsDoc = await collection.findOne({ section: 'site-settings' });
      const settings = settingsDoc?.data || {};
      const apiKey = settings.youtubeApiKey || process.env.YOUTUBE_API_KEY;
      let channelId = settings.youtubeChannelId || process.env.YOUTUBE_CHANNEL_ID;
      const handle = (settings.youtubeHandle || '').replace(/^@/, '');

      if (!apiKey) {
        return res.status(400).json({ error: 'YouTube API anahtarı tanımlı değil. Site Ayarları > SEO bölümünden ekleyin.' });
      }

      // Resolve channel ID from handle if not directly provided
      if (!channelId && handle) {
        const search = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=1&key=${apiKey}`
        );
        if (search.ok) {
          const data = await search.json();
          channelId = data?.items?.[0]?.id?.channelId || data?.items?.[0]?.snippet?.channelId;
        }
      }

      if (!channelId) {
        return res.status(400).json({ error: 'YouTube kanal ID bulunamadı. Site Ayarları > SEO bölümünden ekleyin.' });
      }

      // Get the channel's uploads playlist
      const chRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet,statistics&id=${channelId}&key=${apiKey}`
      );
      if (!chRes.ok) {
        const errText = await chRes.text();
        console.error('YouTube channel error:', errText);
        return res.status(502).json({ error: 'YouTube kanal verisi alınamadı.' });
      }
      const chData = await chRes.json();
      const channel = chData?.items?.[0];
      if (!channel) return res.status(404).json({ error: 'YouTube kanalı bulunamadı.' });

      const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads;
      const channelTitle = channel.snippet?.title;
      const subscriberCount = channel.statistics?.subscriberCount;
      const videoCount = channel.statistics?.videoCount;
      const viewCount = channel.statistics?.viewCount;

      // Fetch up to 50 latest items
      const plRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylist}&maxResults=50&key=${apiKey}`
      );
      if (!plRes.ok) {
        const errText = await plRes.text();
        console.error('YouTube playlistItems error:', errText);
        return res.status(502).json({ error: 'YouTube video listesi alınamadı.' });
      }
      const plData = await plRes.json();
      const items = plData?.items || [];
      const videoIds = items.map(i => i.contentDetails?.videoId).filter(Boolean);

      // Fetch statistics & duration for each video
      let statsMap = {};
      if (videoIds.length > 0) {
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`
        );
        if (vRes.ok) {
          const vData = await vRes.json();
          for (const v of vData?.items || []) {
            statsMap[v.id] = {
              views: v.statistics?.viewCount,
              likes: v.statistics?.likeCount,
              duration: v.contentDetails?.duration,
            };
          }
        }
      }

      const videos = items.map(i => {
        const vid = i.contentDetails?.videoId;
        const sn = i.snippet || {};
        const t = sn.thumbnails || {};
        return {
          youtubeId: vid,
          title: sn.title,
          description: sn.description || '',
          publishedAt: sn.publishedAt,
          thumbnail: t.maxres?.url || t.high?.url || t.medium?.url || t.default?.url,
          views: statsMap[vid]?.views || null,
          likes: statsMap[vid]?.likes || null,
          duration: statsMap[vid]?.duration || null,
        };
      });

      await collection.updateOne(
        { section: 'youtube-cache' },
        {
          $set: {
            section: 'youtube-cache',
            data: {
              videos,
              channel: {
                id: channelId,
                title: channelTitle,
                subscriberCount,
                videoCount,
                viewCount,
              },
            },
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

      return res.status(200).json({
        message: 'YouTube videoları güncellendi.',
        count: videos.length,
        channel: { id: channelId, title: channelTitle, subscriberCount, videoCount, viewCount },
      });
    } catch (err) {
      console.error('YouTube refresh error:', err);
      return res.status(500).json({ error: 'YouTube güncellemesi başarısız: ' + err.message });
    }
  }

  // GET - Get site content (public)
  if (req.method === 'GET') {
    try {
      const section = req.query.section;
      if (section) {
        const content = await collection.findOne({ section });
        return res.status(200).json(content || { section, data: {} });
      }
      const allContent = await collection.find({}).toArray();
      return res.status(200).json(allContent);
    } catch (error) {
      console.error('Content GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update site content (requires auth)
  if (req.method === 'PUT') {
    const user = requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const { section, data } = req.body;

      if (!section || !data) {
        return res.status(400).json({ error: 'Section ve data gerekli' });
      }

      await collection.updateOne(
        { section },
        {
          $set: {
            section,
            data,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      return res.status(200).json({ message: 'İçerik güncellendi' });
    } catch (error) {
      console.error('Content PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
