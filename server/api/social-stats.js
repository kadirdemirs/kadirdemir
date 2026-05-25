import { getDb } from './_lib/mongodb.js';
import { cors } from './_lib/cors.js';
import { requireAuth } from './_lib/auth.js';

const CACHE_TTL = 15 * 60 * 1000; // 15 dakika
const FETCH_TIMEOUT = 8000;

const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

function extractUsername(input, host) {
  if (!input) return '';
  let s = String(input).trim();
  if (host && s.includes(host)) {
    s = s.replace(/^https?:\/\/(www\.)?[^/]+\//, '');
  }
  s = s.replace(/^@/, '').replace(/\/+$/, '').split(/[?#/]/)[0];
  return s;
}

function parseShortNumber(str) {
  if (str == null) return null;
  if (typeof str === 'number') return str;
  const m = String(str).trim().match(/^([\d.,]+)\s*([KMB])?/i);
  if (!m) return null;
  let num = parseFloat(m[1].replace(/,/g, ''));
  if (!Number.isFinite(num)) return null;
  const suffix = (m[2] || '').toUpperCase();
  if (suffix === 'K') num *= 1e3;
  else if (suffix === 'M') num *= 1e6;
  else if (suffix === 'B') num *= 1e9;
  return Math.round(num);
}

function formatShort(num) {
  if (num == null || !Number.isFinite(Number(num))) return null;
  const n = Number(num);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// ── YouTube (resmi API) ──
async function fetchYouTube(apiKey, channelId, handle) {
  if (!apiKey) return null;
  let id = channelId;
  try {
    if (!id && handle) {
      const h = handle.replace(/^@/, '');
      const r = await withTimeout(
        fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@${encodeURIComponent(h)}&key=${apiKey}`),
        FETCH_TIMEOUT
      );
      if (r.ok) {
        const j = await r.json();
        id = j.items?.[0]?.id;
      }
    }
    if (!id) return null;
    const r = await withTimeout(
      fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${id}&key=${apiKey}`),
      FETCH_TIMEOUT
    );
    if (!r.ok) return null;
    const j = await r.json();
    const ch = j.items?.[0];
    if (!ch) return null;
    return {
      platform: 'youtube',
      handle: ch.snippet?.customUrl || handle || '',
      title: ch.snippet?.title || '',
      followers: Number(ch.statistics?.subscriberCount || 0),
      followersDisplay: formatShort(Number(ch.statistics?.subscriberCount || 0)),
      views: Number(ch.statistics?.viewCount || 0),
      viewsDisplay: formatShort(Number(ch.statistics?.viewCount || 0)),
      videos: Number(ch.statistics?.videoCount || 0),
      videosDisplay: formatShort(Number(ch.statistics?.videoCount || 0)),
      thumbnail: ch.snippet?.thumbnails?.high?.url || ch.snippet?.thumbnails?.default?.url || null,
    };
  } catch (e) {
    console.error('YouTube fetch error:', e.message);
    return null;
  }
}

// ── Instagram (public profile scrape) ──
async function fetchInstagram(handle) {
  const username = extractUsername(handle, 'instagram.com');
  if (!username) return null;
  try {
    const r = await withTimeout(
      fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
        headers: {
          'User-Agent': UA_DESKTOP,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
        },
        redirect: 'follow',
      }),
      FETCH_TIMEOUT
    );
    if (!r.ok) return null;
    const html = await r.text();

    // 1) og:description: "3.3M Followers, 420 Following, 1,234 Posts - See Instagram..."
    const og = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    let followers = null;
    let following = null;
    let posts = null;
    if (og) {
      const desc = og[1];
      const f = desc.match(/([\d.,]+\s*[KMB]?)\s*(?:Followers|Takipçi)/i);
      const fl = desc.match(/([\d.,]+\s*[KMB]?)\s*(?:Following|Takip\s*edilen)/i);
      const p = desc.match(/([\d.,]+\s*[KMB]?)\s*(?:Posts|Gönderi)/i);
      if (f) followers = parseShortNumber(f[1]);
      if (fl) following = parseShortNumber(fl[1]);
      if (p) posts = parseShortNumber(p[1]);
    }

    // 2) Yedek: meta description
    if (followers == null) {
      const desc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      if (desc) {
        const f = desc[1].match(/([\d.,]+\s*[KMB]?)\s*(?:Followers|Takipçi)/i);
        const p = desc[1].match(/([\d.,]+\s*[KMB]?)\s*(?:Posts|Gönderi)/i);
        if (f) followers = parseShortNumber(f[1]);
        if (p) posts = parseShortNumber(p[1]);
      }
    }

    if (followers == null && posts == null) return null;
    // Sanity check — Instagram returns garbage when blocked
    if (followers != null && followers < 100 && (posts == null || posts < 5)) {
      console.warn(`Instagram stats look suspicious (followers=${followers}, posts=${posts}) — discarding`);
      return null;
    }

    return {
      platform: 'instagram',
      handle: username,
      followers,
      followersDisplay: formatShort(followers),
      posts,
      postsDisplay: formatShort(posts),
      following,
    };
  } catch (e) {
    console.error('Instagram fetch error:', e.message);
    return null;
  }
}

// ── TikTok (public profile scrape) ──
const TT_MIN_FOLLOWERS = 100; // Below this we consider the scrape failed/limited
async function fetchTikTok(handle) {
  const username = extractUsername(handle, 'tiktok.com');
  if (!username) return null;
  try {
    const r = await withTimeout(
      fetch(`https://www.tiktok.com/@${encodeURIComponent(username)}`, {
        headers: {
          'User-Agent': UA_DESKTOP,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
        },
        redirect: 'follow',
      }),
      FETCH_TIMEOUT
    );
    if (!r.ok) return null;
    const html = await r.text();

    // 1) TikTok'un yeni script blob'u
    const blob = html.match(/<script[^>]*id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]+?)<\/script>/i);
    if (blob) {
      try {
        const data = JSON.parse(blob[1]);
        const userDetail = data?.__DEFAULT_SCOPE__?.['webapp.user-detail'];
        const stats = userDetail?.userInfo?.stats || userDetail?.userInfo?.statsV2;
        const user = userDetail?.userInfo?.user;
        if (stats) {
          const followers = Number(stats.followerCount || 0);
          const hearts = Number(stats.heartCount || stats.heart || 0);
          const videos = Number(stats.videoCount || 0);
          // Sanity check: TikTok returns 0/1 when blocked or anti-bot triggered.
          if (followers < TT_MIN_FOLLOWERS && hearts < TT_MIN_FOLLOWERS) {
            console.warn(`TikTok stats look suspicious (followers=${followers}, hearts=${hearts}) — discarding`);
            return null;
          }
          return {
            platform: 'tiktok',
            handle: user?.uniqueId || username,
            followers,
            followersDisplay: formatShort(followers),
            likes: hearts,
            likesDisplay: formatShort(hearts),
            videos,
            videosDisplay: formatShort(videos),
          };
        }
      } catch (parseErr) {
        console.error('TikTok JSON parse error:', parseErr.message);
      }
    }

    // 2) Yedek: og:description
    const og = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (og) {
      const desc = og[1];
      const f = desc.match(/([\d.,]+\s*[KMB]?)\s*(?:Followers|Takipçi)/i);
      const l = desc.match(/([\d.,]+\s*[KMB]?)\s*(?:Likes|Beğeni)/i);
      const followers = f ? parseShortNumber(f[1]) : null;
      const likes = l ? parseShortNumber(l[1]) : null;
      // Same sanity check
      if (followers != null && followers < TT_MIN_FOLLOWERS && (likes == null || likes < TT_MIN_FOLLOWERS)) {
        return null;
      }
      if (followers != null || likes != null) {
        return {
          platform: 'tiktok',
          handle: username,
          followers,
          followersDisplay: formatShort(followers),
          likes,
          likesDisplay: formatShort(likes),
        };
      }
    }

    return null;
  } catch (e) {
    console.error('TikTok fetch error:', e.message);
    return null;
  }
}

function isValidCachedTikTok(d) {
  return d && (Number(d.followers) >= TT_MIN_FOLLOWERS || Number(d.likes) >= TT_MIN_FOLLOWERS);
}
function isValidCachedInstagram(d) {
  return d && (Number(d.followers) >= 100 || Number(d.posts) >= 5);
}

async function aggregate(db, force = false) {
  const cacheKey = 'social-stats-cache';
  const cached = await db.collection('siteContent').findOne({ section: cacheKey });
  const now = Date.now();
  const fetchedAt = cached?.data?.fetchedAt ? new Date(cached.data.fetchedAt).getTime() : 0;

  if (!force && cached?.data && now - fetchedAt < CACHE_TTL) {
    // Filter out suspicious cached values
    const data = { ...cached.data };
    if (!isValidCachedTikTok(data.tiktok)) data.tiktok = null;
    if (!isValidCachedInstagram(data.instagram)) data.instagram = null;
    return { ...data, cached: true };
  }

  const settingsDoc = await db.collection('siteContent').findOne({ section: 'site-settings' });
  const settings = settingsDoc?.data || {};

  const apiKey = settings.youtubeApiKey || process.env.YOUTUBE_API_KEY;
  const ytChannelId = settings.youtubeChannelId || process.env.YOUTUBE_CHANNEL_ID;
  const ytHandle = settings.youtubeHandle || settings.youtube;
  const igHandle = settings.instagramHandle || settings.instagram;
  const ttHandle = settings.tiktokHandle || settings.tiktok;

  const [youtube, instagram, tiktok] = await Promise.all([
    fetchYouTube(apiKey, ytChannelId, ytHandle).catch(() => null),
    fetchInstagram(igHandle).catch(() => null),
    fetchTikTok(ttHandle).catch(() => null),
  ]);

  // Cached fallback only if it passes sanity check
  const prevTt = isValidCachedTikTok(cached?.data?.tiktok) ? cached.data.tiktok : null;
  const prevIg = isValidCachedInstagram(cached?.data?.instagram) ? cached.data.instagram : null;

  const payload = {
    youtube: youtube || cached?.data?.youtube || null,
    instagram: instagram || prevIg,
    tiktok: tiktok || prevTt,
    fetchedAt: new Date(),
    sources: {
      youtube: youtube ? 'live' : cached?.data?.youtube ? 'cache' : 'none',
      instagram: instagram ? 'live' : prevIg ? 'cache' : 'none',
      tiktok: tiktok ? 'live' : prevTt ? 'cache' : 'none',
    },
  };

  await db.collection('siteContent').updateOne(
    { section: cacheKey },
    {
      $set: { section: cacheKey, data: payload, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return { ...payload, cached: false };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query?.action;

  try {
    const db = await getDb();

    if (req.method === 'POST' && action === 'refresh') {
      const user = requireAuth(req);
      if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });
      const result = await aggregate(db, true);
      return res.status(200).json(result);
    }

    if (req.method === 'GET') {
      const result = await aggregate(db, false);
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('social-stats error:', e);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
