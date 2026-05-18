import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 dk
const MAX_VIDEOS = 12;

async function resolveChannelId(apiKey, db) {
  const settings = await db.collection('content').findOne({ section: 'site-settings' });
  const data = settings?.data || {};

  if (data.youtubeChannelId && /^UC[\w-]{20,}$/.test(data.youtubeChannelId)) {
    return data.youtubeChannelId;
  }

  // Handle (@kadirdemir) → channel ID dönüştürme
  const handle = (data.youtubeHandle || '').replace(/^@/, '');
  if (!handle) return null;

  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@${encodeURIComponent(handle)}&key=${apiKey}`
    );
    if (!r.ok) return null;
    const j = await r.json();
    return j.items?.[0]?.id || null;
  } catch {
    return null;
  }
}

async function fetchYouTubeVideos(apiKey, channelId) {
  // 1) Kanal "uploads" playlist ID'sini al
  const chRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  if (!chRes.ok) throw new Error('YouTube channel lookup failed');
  const chData = await chRes.json();
  const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) throw new Error('No uploads playlist');

  // 2) Playlist'ten son N videoyu al
  const plRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=${MAX_VIDEOS}&playlistId=${uploadsId}&key=${apiKey}`
  );
  if (!plRes.ok) throw new Error('YouTube playlist fetch failed');
  const plData = await plRes.json();
  const videoIds = (plData.items || []).map((it) => it.contentDetails?.videoId).filter(Boolean);
  if (videoIds.length === 0) return [];

  // 3) Video detayları (süre, izlenme)
  const vRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`
  );
  if (!vRes.ok) throw new Error('YouTube video details failed');
  const vData = await vRes.json();

  return (vData.items || []).map((v) => ({
    youtubeId: v.id,
    title: v.snippet?.title || '',
    description: (v.snippet?.description || '').slice(0, 500),
    thumbnail:
      v.snippet?.thumbnails?.maxres?.url ||
      v.snippet?.thumbnails?.high?.url ||
      v.snippet?.thumbnails?.medium?.url,
    publishedAt: v.snippet?.publishedAt,
    duration: v.contentDetails?.duration,
    views: Number(v.statistics?.viewCount || 0),
    likes: Number(v.statistics?.likeCount || 0),
  }));
}

async function getCachedOrRefresh(db, force = false) {
  const cached = await db.collection('content').findOne({ section: 'youtube-cache' });
  const now = Date.now();
  const isStale = !cached?.data?.fetchedAt || now - new Date(cached.data.fetchedAt).getTime() > CACHE_TTL_MS;

  if (!force && cached?.data?.videos && !isStale) {
    return { videos: cached.data.videos, cached: true, fetchedAt: cached.data.fetchedAt };
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // API key yoksa cache varsa onu döndür, yoksa boş
    return { videos: cached?.data?.videos || [], cached: true, fetchedAt: cached?.data?.fetchedAt, error: 'YOUTUBE_API_KEY missing' };
  }

  const channelId = await resolveChannelId(apiKey, db);
  if (!channelId) {
    return { videos: cached?.data?.videos || [], cached: true, error: 'Channel ID could not be resolved' };
  }

  try {
    const videos = await fetchYouTubeVideos(apiKey, channelId);
    const fetchedAt = new Date();
    await db.collection('content').updateOne(
      { section: 'youtube-cache' },
      { $set: { section: 'youtube-cache', data: { videos, fetchedAt, channelId }, updatedAt: fetchedAt } },
      { upsert: true }
    );
    return { videos, cached: false, fetchedAt };
  } catch (e) {
    // Hata olursa eski cache'i döndür
    return { videos: cached?.data?.videos || [], cached: true, error: e.message };
  }
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query?.action;
  const db = await getDb();

  // GET /api/youtube?action=live — public live-broadcast probe, cached aggressively
  if (req.method === 'GET' && action === 'live') {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) return res.status(200).json({ live: false });

      const LIVE_CACHE_KEY = 'youtube-live-status';
      const cached = await db.collection('content').findOne({ section: LIVE_CACHE_KEY });
      const FIVE_MIN = 5 * 60 * 1000;
      if (cached && cached.fetchedAt && Date.now() - cached.fetchedAt < FIVE_MIN) {
        return res.status(200).json(cached.data || { live: false });
      }

      const channelId = await resolveChannelId(apiKey, db);
      if (!channelId) {
        const empty = { live: false };
        await db.collection('content').updateOne(
          { section: LIVE_CACHE_KEY },
          { $set: { section: LIVE_CACHE_KEY, data: empty, fetchedAt: Date.now() } },
          { upsert: true }
        );
        return res.status(200).json(empty);
      }

      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&maxResults=1&key=${apiKey}`
      );
      if (!r.ok) return res.status(200).json({ live: false });
      const j = await r.json();
      const item = j.items?.[0];
      const payload = item
        ? {
            live: true,
            videoId: item.id?.videoId,
            title: item.snippet?.title,
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
            startedAt: item.snippet?.publishedAt,
          }
        : { live: false };

      await db.collection('content').updateOne(
        { section: LIVE_CACHE_KEY },
        { $set: { section: LIVE_CACHE_KEY, data: payload, fetchedAt: Date.now() } },
        { upsert: true }
      );

      return res.status(200).json(payload);
    } catch (e) {
      return res.status(200).json({ live: false, error: e.message });
    }
  }

  // POST /api/youtube?action=refresh (admin)
  if (req.method === 'POST' && action === 'refresh') {
    const session = requireAuth(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const result = await getCachedOrRefresh(db, true);
      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // GET /api/youtube — public, cache'li
  if (req.method === 'GET') {
    try {
      const result = await getCachedOrRefresh(db, false);
      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
