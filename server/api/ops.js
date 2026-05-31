import { ObjectId } from 'mongodb'
import { getDb, isValidObjectId } from './_lib/mongodb.js'
import { requireAuth } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { rateLimitCheck } from './_lib/rateLimit.js'
// web-push dinamik olarak yükleniyor — Vercel serverless ES module uyumu için
let _webpush = null
async function getWebPush() {
  if (_webpush) return _webpush
  try {
    const mod = await import('web-push')
    _webpush = mod.default || mod
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      _webpush.setVapidDetails(
        'mailto:' + (process.env.MAIL_TO || 'thekademedia@gmail.com'),
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      )
    }
  } catch (e) {
    console.error('web-push yüklenemedi:', e.message)
  }
  return _webpush
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value, max = 300) {
  return String(value || '').trim().slice(0, max)
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function requireAdmin(req, res) {
  const user = requireAuth(req)
  if (!user) {
    res.status(401).json({ error: 'Yetkisiz erişim' })
    return null
  }
  return user
}

async function handleBackup(req, res, db) {
  const user = requireAdmin(req, res)
  if (!user) return

  const collections = ['messages', 'quotes', 'proposals', 'tasks', 'subscriptions', 'surveys', 'invoices', 'referrals', 'blogs', 'partners', 'content']
  if (req.method === 'GET') {
    const counts = {}
    for (const name of collections) counts[name] = await db.collection(name).countDocuments()
    return res.status(200).json({ generatedAt: new Date(), generatedBy: user.username, collections: counts })
  }

  if (req.method === 'POST') {
    const data = {}
    for (const name of collections) {
      data[name] = await db.collection(name).find({}).sort({ createdAt: -1 }).limit(1000).toArray()
    }
    await db.collection('backups').insertOne({
      generatedAt: new Date(),
      generatedBy: user.username,
      collections: Object.fromEntries(Object.entries(data).map(([name, items]) => [name, items.length])),
    })
    return res.status(200).json({ generatedAt: new Date(), data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleClientErrors(req, res, db) {
  if (req.method === 'POST') {
    const rl = await rateLimitCheck(req, { namespace: 'client-errors', maxRequests: 30 })
    if (!rl.allowed) return res.status(204).end()
    const { message, stack, path, source } = req.body || {}
    await db.collection('client_errors').insertOne({
      message: clean(message, 500),
      stack: clean(stack, 4000),
      path: clean(path, 300),
      source: clean(source, 80),
      userAgent: clean(req.headers['user-agent'], 300),
      createdAt: new Date(),
    })
    return res.status(204).end()
  }

  const user = requireAdmin(req, res)
  if (!user) return
  const errors = await db.collection('client_errors').find({}).sort({ createdAt: -1 }).limit(100).toArray()
  return res.status(200).json(errors)
}

async function handlePush(req, res, db) {
  // GET — admin: abone listesi veya VAPID public key
  if (req.method === 'GET') {
    const { action } = req.query || {}
    // public key herkes alabilir (subscribe için lazım)
    if (action === 'vapid-public-key') {
      return res.status(200).json({ key: process.env.VAPID_PUBLIC_KEY || null })
    }
    const user = requireAdmin(req, res)
    if (!user) return
    const items = await db.collection('push_subscriptions').find({}).sort({ createdAt: -1 }).limit(200).toArray()
    return res.status(200).json(items)
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action } = req.query || {}

  // Admin: bildirim gönder
  if (action === 'send') {
    const user = requireAdmin(req, res)
    if (!user) return
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return res.status(400).json({ error: 'VAPID anahtarları tanımlı değil. Vercel env\'e VAPID_PUBLIC_KEY ve VAPID_PRIVATE_KEY ekle.' })
    }
    const wp = await getWebPush()
    if (!wp) return res.status(500).json({ error: 'web-push modülü yüklenemedi' })
    const { title, body, url } = req.body || {}
    if (!title) return res.status(400).json({ error: 'title gerekli' })
    const subs = await db.collection('push_subscriptions').find({ endpoint: { $exists: true }, 'keys.p256dh': { $exists: true } }).toArray()
    if (!subs.length) return res.status(200).json({ sent: 0, message: 'Abone yok' })
    const payload = JSON.stringify({ title: clean(title, 80), body: clean(body, 200), url: clean(url, 500) || '/' })
    let sent = 0, failed = 0
    await Promise.all(subs.map(async (sub) => {
      try {
        await wp.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
        sent++
      } catch (e) {
        failed++
        if (e.statusCode === 410 || e.statusCode === 404) {
          await db.collection('push_subscriptions').deleteOne({ _id: sub._id }).catch(() => {})
        }
      }
    }))
    return res.status(200).json({ sent, failed, total: subs.length })
  }

  // Public: abone ol / güncelle
  const { endpoint, keys, permission } = req.body || {}
  if (!endpoint) return res.status(400).json({ error: 'endpoint gerekli' })
  await db.collection('push_subscriptions').updateOne(
    { endpoint: clean(endpoint, 800) },
    {
      $set: {
        endpoint: clean(endpoint, 800),
        keys: keys && typeof keys === 'object' ? keys : {},
        permission: clean(permission, 40),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  )
  return res.status(200).json({ success: true })
}

// ── Audit log ─────────────────────────────────────────────────────────────
// Lightweight activity log: who, what, when, optional details. Read-only via
// admin GET; writes happen from other handlers (helper exported below).
export async function writeAuditLog(db, { actor, action, target, details, ip }) {
  try {
    await db.collection('audit_log').insertOne({
      actor: clean(actor, 80) || 'system',
      action: clean(action, 80),
      target: clean(target, 200),
      details: clean(details, 1000),
      ip: clean(ip, 64),
      createdAt: new Date(),
    })
  } catch (err) {
    console.error('Audit log write failed:', err.message)
  }
}

async function handleAuditLog(req, res, db) {
  const user = requireAdmin(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const limit = Math.min(Number(req.query?.limit) || 200, 500)
    const items = await db.collection('audit_log')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
    return res.status(200).json(items)
  }

  if (req.method === 'DELETE') {
    // Clear all (admin only)
    if (user.role !== 'admin') return res.status(403).json({ error: 'Sadece admin temizleyebilir' })
    await db.collection('audit_log').deleteMany({})
    await writeAuditLog(db, { actor: user.username, action: 'audit-log:clear', target: 'audit_log', ip: req.ip })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// ─────────────────────────────────────────────────────────────
// PURGE LEGACY KADE MEDIA DATA
// Eski "Kade Media — sosyal medya ajansı" verilerini DB'den siler.
// Admin auth + dry-run opsiyonu ile koruma altında.
//
// Kullanım:
//   GET  /api/ops?resource=purge-legacy&dryRun=1   → ne silineceğini sayar
//   POST /api/ops?resource=purge-legacy            → gerçek silme yapar
// ─────────────────────────────────────────────────────────────
async function handlePurgeLegacy(req, res, db) {
  const user = requireAdmin(req, res)
  if (!user) return
  if (user.role !== 'admin') return res.status(403).json({ error: 'Sadece admin' })

  const dryRun = req.method === 'GET' || req.query?.dryRun === '1' || req.query?.dryRun === 'true'

  // Brand kelimeleri içeren string alanları yakalayan regex
  const legacyRegex = /kade\s*media|kademedia|sosyal\s*medya\s*ajans|biruni\s*teknopark/i

  // 1) blogs — slug'ı kade-media ile başlayan veya başlık/içerikte legacy geçen yazılar
  const blogsQuery = {
    $or: [
      { slug: /^kade-media-/i },
      { titleTr: legacyRegex },
      { titleEn: legacyRegex },
      { excerptTr: legacyRegex },
      { excerptEn: legacyRegex },
      { contentTr: legacyRegex },
      { contentEn: legacyRegex },
    ],
  }

  // 2) partners — eski Kade Media partner kayıtları (ajans servisleri)
  const partnersQuery = {
    $or: [
      { descTr: legacyRegex },
      { descEn: legacyRegex },
      { longDescTr: legacyRegex },
      { longDescEn: legacyRegex },
    ],
  }

  // 3) messages — eski "Kade Media" lead mesajları + ajans dönemi "Sosyal Medya
  //    Analiz" aracı lead'leri (service/source) — bunlar artık özellik değil, kalıntı
  const messagesQuery = {
    $or: [
      { subject: legacyRegex },
      { service: legacyRegex },
      { service: /sosyal\s*medya\s*analiz/i },
      { source: 'analyzer' },
    ],
  }

  // 3b) content — eski "ajans" hero/stats section'ları (stats section komple ajans verisi)
  const contentQuery = {
    $or: [
      { section: 'stats' }, // clients/campaigns/satisfaction → YouTuber için anlamsız
      { 'data.tr.subtitle': legacyRegex },
      { 'data.en.subtitle': legacyRegex },
      { 'data.tr.title2': /markanızı/i },
    ],
  }

  // 4) site-settings — siteContent koleksiyonunda { section, data } yapısında
  const settingsDoc = await db.collection('siteContent').findOne({ section: 'site-settings' })
  const settingsData = settingsDoc?.data || null
  const settingsHits = []
  if (settingsData) {
    for (const k of ['businessName', 'tagline', 'description', 'seoTitle', 'seoDescription', 'seoKeywords']) {
      if (typeof settingsData[k] === 'string' && legacyRegex.test(settingsData[k])) {
        settingsHits.push({ field: k, value: settingsData[k] })
      }
    }
  }

  // Orphan ajans koleksiyonları (uçları kaldırıldı; eski veri kalmış olabilir)
  const summary = {
    blogs: await db.collection('blogs').countDocuments(blogsQuery),
    partners: await db.collection('partners').countDocuments(partnersQuery),
    messages: await db.collection('messages').countDocuments(messagesQuery),
    content: await db.collection('siteContent').countDocuments(contentQuery),
    analyzerLeads: await db.collection('analyzer_leads').countDocuments({}),
    applications: await db.collection('applications').countDocuments({}),
    quotes: await db.collection('quotes').countDocuments({}),
    proposals: await db.collection('proposals').countDocuments({}),
    subscriptions: await db.collection('subscriptions').countDocuments({}),
    onboardingForms: await db.collection('onboarding_forms').countDocuments({}),
    emailTemplates: await db.collection('email_templates').countDocuments({}),
    invoices: await db.collection('invoices').countDocuments({}), // sadece sayım — silinmez
    settingsHits,
    dryRun,
  }

  if (dryRun) {
    return res.status(200).json({ ...summary, message: 'Dry run — nothing deleted. POST without dryRun to apply.' })
  }

  // ── Gerçek silme ──
  const deleted = {
    blogs: (await db.collection('blogs').deleteMany(blogsQuery)).deletedCount,
    partners: (await db.collection('partners').deleteMany(partnersQuery)).deletedCount,
    messages: (await db.collection('messages').deleteMany(messagesQuery)).deletedCount,
    content: (await db.collection('siteContent').deleteMany(contentQuery)).deletedCount,
    analyzerLeads: (await db.collection('analyzer_leads').deleteMany({})).deletedCount,
    applications: (await db.collection('applications').deleteMany({})).deletedCount,
    quotes: (await db.collection('quotes').deleteMany({})).deletedCount,
    proposals: (await db.collection('proposals').deleteMany({})).deletedCount,
    subscriptions: (await db.collection('subscriptions').deleteMany({})).deletedCount,
    onboardingForms: (await db.collection('onboarding_forms').deleteMany({})).deletedCount,
    emailTemplates: (await db.collection('email_templates').deleteMany({})).deletedCount,
    // invoices: KASITLI silinmiyor — finansal/yasal kayıt olabilir. Sayımı summary'de
    // görünür; silmek istersen önce yedek al, sonra ayrıca elle temizle.
  }

  // site-settings: brand metinleri + DOĞRU sosyal medya hesapları (data.* alanları)
  if (settingsDoc) {
    const patch = {}
    for (const hit of settingsHits) {
      patch[`data.${hit.field}`] = hit.value
        .replace(/Kade\s*Media/gi, 'Kadir Demir')
        .replace(/kademedia/gi, 'kadirdemir')
        .replace(/sosyal\s*medya\s*ajans[ıi]?/gi, 'içerik üretimi')
        .replace(/Biruni\s*Teknopark/gi, 'İstanbul')
    }
    // Eski/yanlış sosyal medya hesaplarını doğrularıyla değiştir
    Object.assign(patch, {
      'data.youtube': 'https://youtube.com/@kadirardademirr',
      'data.youtubeHandle': '@kadirardademirr',
      'data.instagram': 'https://instagram.com/kadirardademir',
      'data.instagramHandle': '@kadirardademir',
      'data.tiktok': 'https://tiktok.com/@kadirardademir',
      'data.tiktokHandle': '@kadirardademir',
      'data.twitter': 'https://x.com/kadirardademir',
      'data.twitterHandle': '@kadirardademir',
      'data.linkedin': 'https://www.linkedin.com/in/kadirdemirr',
      'data.discord': '',
    })
    await db.collection('siteContent').updateOne({ _id: settingsDoc._id }, { $set: patch })
    deleted.settingsUpdated = Object.keys(patch).length
  }

  // siteContent: kadelink linkleri + sosyal istatistik cache'i eski/yanlış olabilir.
  // Bu section'ları sil → Links.jsx doğru default'ları, Home doğru API'yi kullanır.
  try {
    deleted.kadelinkLinks = (await db.collection('siteContent').deleteOne({ section: 'kadelink-links' })).deletedCount
  } catch { deleted.kadelinkLinks = 0 }
  try {
    deleted.socialStatsCache = (await db.collection('siteContent').deleteMany({ section: { $in: ['social-stats', 'social-stats-cache'] } })).deletedCount
  } catch { deleted.socialStatsCache = 0 }

  await writeAuditLog(db, {
    actor: user.username,
    action: 'purge-legacy:apply',
    target: 'kade-media',
    ip: req.ip,
    detail: deleted,
  })

  return res.status(200).json({ success: true, deleted, summary })
}

export default async function handler(req, res) {
  if (cors(req, res)) return

  const db = await getDb()
  const { resource } = req.query || {}

  try {
    // Ajans (kademedia.com.tr) modülleri kaldırıldı: quotes, invoices,
    // customer-profiles, email-templates, onboarding — kişisel sitede yeri yok.
    if (resource === 'backup') return handleBackup(req, res, db)
    if (resource === 'client-errors') return handleClientErrors(req, res, db)
    if (resource === 'push') return handlePush(req, res, db)
    if (resource === 'audit-log') return handleAuditLog(req, res, db)
    if (resource === 'purge-legacy') return handlePurgeLegacy(req, res, db)

    return res.status(400).json({ error: 'resource parametresi gerekli' })
  } catch (err) {
    console.error('Ops API error:', err)
    return res.status(500).json({ error: 'Operasyon tamamlanamadı' })
  }
}
