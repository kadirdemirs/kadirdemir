import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { requireAuth } from './_lib/auth.js';
import { sanitizeNewsletterHtml } from './_lib/sanitize.js';
import { logActivity } from './notifications.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getUnsubSecret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.JWT_SECRET;
}

function generateUnsubToken(email) {
  const secret = getUnsubSecret();
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
}

function verifyUnsubToken(email, token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return false;
  const expected = generateUnsubToken(email);
  if (!expected) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch { return false; }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function makeTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: { user, pass },
    ...(port === 587 ? { requireTLS: true } : {}),
    tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query?.action;

  // ── Newsletter aboneleri (auth gerekli) ──
  if (action === 'subscribers') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli' });
    const db = await getDb();

    if (req.method === 'GET') {
      try {
        const subscribers = await db.collection('newsletter')
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        return res.status(200).json(subscribers);
      } catch (err) {
        return res.status(500).json({ error: 'Sunucu hatası' });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = req.query?.id;
        if (!id) return res.status(400).json({ error: 'id gerekli' });
        if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
        await db.collection('newsletter').deleteOne({ _id: new ObjectId(id) });
        logActivity(db, { action: 'Newsletter abonesi silindi', detail: '', type: 'delete', icon: '📧', user: user.username }).catch(() => {});
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: 'Sunucu hatası' });
      }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Newsletter toplu gönderme (auth gerekli) ──
  if (action === 'send-newsletter') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

    const { subject, html } = body || {};
    if (!subject?.trim()) return res.status(400).json({ error: 'Konu gerekli' });
    if (!html?.trim()) return res.status(400).json({ error: 'İçerik gerekli' });
    if (subject.length > 200) return res.status(400).json({ error: 'Konu çok uzun (max 200)' });
    if (html.length > 100000) return res.status(400).json({ error: 'İçerik çok uzun' });
    const sanitizedHtml = sanitizeNewsletterHtml(html);
    if (!sanitizedHtml.trim()) return res.status(400).json({ error: 'Newsletter HTML guvenli icerik icermiyor' });

    const transporter = makeTransporter();
    if (!transporter) return res.status(400).json({ error: 'SMTP yapılandırılmamış' });

    try {
      const db = await getDb();
      const subscribers = await db.collection('newsletter').find({ status: { $ne: 'unsubscribed' } }).toArray();
      if (subscribers.length === 0) return res.status(200).json({ sent: 0, message: 'Abone bulunamadı' });

      let sent = 0;
      const errors = [];

      for (const sub of subscribers) {
        try {
          const unsubToken = generateUnsubToken(sub.email);
          const unsubLink = `https://kademedia.com.tr/api/contact?action=unsubscribe&email=${encodeURIComponent(sub.email)}${unsubToken ? `&token=${unsubToken}` : ''}`;
          const safeHtml = sanitizedHtml + `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;text-align:center;font-size:12px;color:#888;">
            <a href="${unsubLink}" style="color:#888;">Abonelikten çık</a>
          </div>`;
          await transporter.sendMail({
            from: `"Kadir Demir" <${process.env.SMTP_USER}>`,
            to: sub.email,
            subject: escapeHtml(subject),
            html: safeHtml,
          });
          sent++;
        } catch (err) {
          errors.push(sub.email);
        }
      }

      logActivity(db, { action: 'Newsletter gönderildi', detail: `${sent} aboneye: "${subject}"`, type: 'create', icon: '📧', user: user.username }).catch(() => {});
      return res.status(200).json({ sent, total: subscribers.length, ...(errors.length ? { errors } : {}) });
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── SMTP test (auth gerekli) ──
  if (action === 'smtp-test') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const transporter = makeTransporter();
    if (!transporter) return res.status(400).json({ error: 'SMTP ayarları yapılandırılmamış (SMTP_HOST, SMTP_USER, SMTP_PASS gerekli)' });

    try {
      await transporter.verify();
      return res.status(200).json({ success: true, message: 'SMTP bağlantısı başarılı!' });
    } catch (err) {
      return res.status(200).json({ success: false, message: 'SMTP bağlantı hatası. Ayarları kontrol edin.' });
    }
  }

  // ── Kariyer Başvurusu (public, POST only) ──
  if (action === 'apply') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const applyRl = await rateLimitCheck(req, { namespace: 'career-apply', maxRequests: 5 });
    if (!applyRl.allowed) return res.status(429).json({ error: `Çok fazla istek. ${applyRl.retryAfter} dakika sonra tekrar deneyin.` });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { name, email, phone, position, coverLetter } = body || {};
    if (!name?.trim() || !email?.trim() || !position?.trim()) {
      return res.status(400).json({ error: 'Ad, e-posta ve pozisyon zorunludur.' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    try {
      const db = await getDb();
      await db.collection('applications').insertOne({
        name: name.trim(), email: email.trim().toLowerCase(),
        phone: phone?.trim() || '-', position: position.trim(),
        coverLetter: coverLetter?.trim() || '',
        status: 'yeni', createdAt: new Date(),
      });
      logActivity(db, { action: 'Yeni kariyer başvurusu', detail: `${name.trim()} — ${position.trim()}`, type: 'message', icon: '💼', user: 'sistem' }).catch(() => {});
      const transporter = makeTransporter();
      if (transporter) {
        const mailTo = process.env.MAIL_TO || 'thekademedia@gmail.com';
        transporter.sendMail({
          from: `"Kadir Demir Website" <${process.env.SMTP_USER}>`,
          to: mailTo,
          subject: `💼 Kariyer Başvurusu: ${escapeHtml(name)} — ${escapeHtml(position)}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;"><h2 style="color:#eac321;">💼 Kariyer Başvurusu</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="color:#888;padding:6px 0;width:120px;">Ad Soyad</td><td style="color:#fff;font-weight:600;">${escapeHtml(name)}</td></tr><tr><td style="color:#888;padding:6px 0;">E-posta</td><td style="color:#eac321;">${escapeHtml(email)}</td></tr><tr><td style="color:#888;padding:6px 0;">Telefon</td><td style="color:#fff;">${escapeHtml(phone || '-')}</td></tr><tr><td style="color:#888;padding:6px 0;">Pozisyon</td><td style="color:#fff;">${escapeHtml(position)}</td></tr></table>${coverLetter ? `<div style="margin-top:16px;padding:14px;background:#1a1a1a;border-radius:8px;border-left:3px solid #eac321;"><p style="color:#ccc;margin:0;line-height:1.6;white-space:pre-wrap;">${escapeHtml(coverLetter)}</p></div>` : ''}</div>`,
        }).catch(() => {});
        transporter.sendMail({
          from: `"Kadir Demir" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Başvurunuz Alındı — Kadir Demir',
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff;border-radius:12px;"><h2 style="color:#eac321;">Kadir Demir</h2><h3>Merhaba ${escapeHtml(name)},</h3><p style="color:#ccc;line-height:1.8;"><strong style="color:#eac321;">${escapeHtml(position)}</strong> pozisyonu için başvurunuz alındı. İnceleme sonrasında sizinle iletişime geçeceğiz.</p><p style="color:#888;font-size:12px;margin-top:24px;">Kadir Demir | hello@kademedia.com | +90 506 729 34 23</p></div>`,
        }).catch(() => {});
      }
      return res.status(200).json({ message: 'Başvurunuz başarıyla alındı!' });
    } catch (err) {
      console.error('Apply error:', err);
      return res.status(500).json({ error: 'Bir hata oluştu, lütfen tekrar deneyin.' });
    }
  }

  // ── Sosyal Medya Analiz Aracı Lead (public, POST only) ──
  if (action === 'analyzer-lead') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const analyzerRl = await rateLimitCheck(req, { namespace: 'analyzer-lead', maxRequests: 10 });
    if (!analyzerRl.allowed) return res.status(429).json({ error: `Çok fazla istek. ${analyzerRl.retryAfter} dakika sonra tekrar deneyin.` });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { email, score, platforms, usernames, categories } = body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi gerekli.' });
    }
    const safeScore = typeof score === 'number' && score >= 0 && score <= 100 ? Math.round(score) : 0;
    const safePlatforms = Array.isArray(platforms) ? platforms.slice(0, 10).map(p => String(p).slice(0, 50)) : [];
    const safeUsernames = usernames && typeof usernames === 'object' && !Array.isArray(usernames)
      ? Object.fromEntries(Object.entries(usernames).slice(0, 10).map(([k, v]) => [String(k).slice(0, 50), String(v).slice(0, 100)]))
      : {};
    const safeCategories = Array.isArray(categories) ? categories.slice(0, 10).map(c => ({
      key: String(c?.key || '').slice(0, 50),
      score: typeof c?.score === 'number' ? c.score : 0,
      max: typeof c?.max === 'number' ? c.max : 100,
    })) : [];
    try {
      const db = await getDb();
      await db.collection('analyzer_leads').insertOne({
        email: email.trim().toLowerCase(), score: safeScore, platforms: safePlatforms, usernames: safeUsernames, categories: safeCategories,
        createdAt: new Date(), source: 'social-media-analyzer', status: 'new',
      });
      await db.collection('messages').insertOne({
        name: email.split('@')[0], email: email.trim().toLowerCase(),
        phone: '', company: '', service: 'Sosyal Medya Analiz',
        message: `Sosyal Medya Analiz Aracı Lead - Skor: ${safeScore}/100\nPlatformlar: ${safePlatforms.join(', ')}\nKullanıcı adları: ${JSON.stringify(safeUsernames)}`,
        source: 'analyzer', status: 'yeni', read: false, createdAt: new Date(),
      });
      logActivity(db, { action: 'Yeni analiz lead', detail: `${email} — Skor: ${safeScore}/100`, type: 'message', icon: '📊', user: 'sistem' }).catch(() => {});

      // Send emails
      const transporter = makeTransporter();
      if (transporter) {
        const catLabels = { profile: 'Profil Optimizasyonu', diversity: 'Platform Çeşitliliği', accessibility: 'Erişilebilirlik', consistency: 'Marka Tutarlılığı', presence: 'Dijital Varlık' };
        const catRows = safeCategories.map(c => `<tr><td style="padding:6px 12px;color:#888;">${escapeHtml(catLabels[c.key] || c.key)}</td><td style="padding:6px 12px;color:#eac321;font-weight:700;">${c.score}/${c.max}</td></tr>`).join('');
        const platformList = safePlatforms.join(', ');
        const scoreColor = safeScore <= 40 ? '#FF4444' : safeScore <= 60 ? '#FF9800' : safeScore <= 80 ? '#eac321' : '#2ECC71';
        const scoreLabel = safeScore <= 40 ? 'Acil İyileştirme Gerekli' : safeScore <= 60 ? 'Geliştirilmeli' : safeScore <= 80 ? 'İyi Durumda' : 'Mükemmel';

        // Notify thekademedia@gmail.com
        const mailTo = process.env.MAIL_TO || 'thekademedia@gmail.com';
        transporter.sendMail({
          from: `"Kadir Demir Website" <${process.env.SMTP_USER}>`,
          to: mailTo,
          subject: `📊 Yeni Analiz Lead: ${email} — Skor: ${safeScore}/100`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;"><h2 style="color:#eac321;">📊 Yeni Sosyal Medya Analiz Lead</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px 0;color:#888;width:140px;">E-posta</td><td style="padding:8px 0;color:#eac321;font-weight:600;">${escapeHtml(email)}</td></tr><tr><td style="padding:8px 0;color:#888;">Platformlar</td><td style="padding:8px 0;color:#fff;">${escapeHtml(platformList)}</td></tr><tr><td style="padding:8px 0;color:#888;">Skor</td><td style="padding:8px 0;color:${scoreColor};font-weight:700;font-size:1.2em;">${safeScore}/100 — ${scoreLabel}</td></tr></table><table style="width:100%;border-collapse:collapse;margin-top:16px;background:#1a1a1a;border-radius:8px;">${catRows}</table></div>`,
        }).catch(() => {});

        // Send report to user
        transporter.sendMail({
          from: `"Kadir Demir" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Sosyal Medya Analiz Raporunuz — ${safeScore}/100 Puan`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff;border-radius:12px;"><div style="text-align:center;padding:20px 0;border-bottom:1px solid #333;"><h1 style="color:#eac321;margin:0;">Kadir Demir</h1><p style="color:#888;margin:8px 0 0;">Sosyal Medya Analiz Raporu</p></div><div style="padding:30px 20px;"><div style="text-align:center;margin-bottom:24px;"><div style="display:inline-block;width:100px;height:100px;border-radius:50%;border:3px solid ${scoreColor};line-height:100px;font-size:2rem;font-weight:700;color:${scoreColor};">${safeScore}</div><div style="color:#888;font-size:0.85rem;margin-top:4px;">/100 — ${scoreLabel}</div></div><p style="color:#ccc;line-height:1.8;">Merhaba,</p><p style="color:#ccc;line-height:1.8;">Sosyal medya hesaplarınızın analizini tamamladık. İşte detaylı sonuçlarınız:</p><table style="width:100%;border-collapse:collapse;margin:16px 0;background:rgba(255,255,255,0.05);border-radius:8px;overflow:hidden;">${catRows}</table><p style="color:#ccc;line-height:1.8;">Hesaplarınızı daha da güçlendirmek için uzman ekibimizle ücretsiz bir görüşme yapabilirsiniz.</p><div style="text-align:center;margin:24px 0;"><a href="https://kademedia.com.tr/iletisim" style="display:inline-block;padding:14px 32px;background:#eac321;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">Ücretsiz Danışmanlık Al →</a></div><hr style="border:none;border-top:1px solid #333;margin:24px 0;"/><p style="color:#888;font-size:12px;">Kadir Demir | Biruni Teknopark, Zeytinburnu/İstanbul<br/>hello@kademedia.com | +90 506 729 34 23</p></div></div>`,
        }).catch(() => {});
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Analyzer lead error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Abonelik iptali (GET, imzalı token gerekli) ──
  if (action === 'unsubscribe') {
    const email = Array.isArray(req.query?.email) ? req.query.email[0] : req.query?.email;
    const token = Array.isArray(req.query?.token) ? req.query.token[0] : req.query?.token;
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).send('<html><body style="font-family:Arial;text-align:center;padding:60px;background:#0a0a0a;color:#fff"><h2>Geçersiz e-posta adresi.</h2></body></html>');
    }
    if (!verifyUnsubToken(email, token)) {
      return res.status(403).send('<html><body style="font-family:Arial;text-align:center;padding:60px;background:#0a0a0a;color:#fff"><h2>Geçersiz veya süresi dolmuş abonelik iptal bağlantısı.</h2></body></html>');
    }
    try {
      const db = await getDb();
      await db.collection('newsletter').updateOne(
        { email: email.toLowerCase() },
        { $set: { status: 'unsubscribed', unsubscribedAt: new Date() } }
      );
      return res.status(200).send('<html><body style="font-family:Arial;text-align:center;padding:60px;background:#0a0a0a;color:#fff"><h2 style="color:#eac321">Aboneliğiniz iptal edildi.</h2><p style="color:#888">Kadir Demir bülteninden başarıyla çıktınız.</p></body></html>');
    } catch {
      return res.status(500).send('<html><body style="font-family:Arial;text-align:center;padding:60px;background:#0a0a0a;color:#fff"><h2>Bir hata oluştu, lütfen tekrar deneyin.</h2></body></html>');
    }
  }

  // ── Newsletter aboneliği (public, POST only) ──
  if (action === 'newsletter') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const nlRl = await rateLimitCheck(req, { namespace: 'newsletter-subscribe', maxRequests: 10 });
    if (!nlRl.allowed) return res.status(429).json({ error: `Çok fazla istek. ${nlRl.retryAfter} dakika sonra tekrar deneyin.` });
    return handleNewsletter(req, res);
  }

  // ── Newsletter confirm (double opt-in tıklama) ──
  if (action === 'confirm') {
    return handleNewsletterConfirm(req, res);
  }

  // ── Normal contact form (POST only) ──
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const rl = await rateLimitCheck(req, { namespace: 'contact', maxRequests: 5 });
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Çok fazla istek. Lütfen ${rl.retryAfter} dakika sonra tekrar deneyin.`,
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const {
    name, email, phone, company, service, message, source = 'iletisim-formu',
  } = body || {};

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Ad, e-posta ve mesaj alanları zorunludur.' });
  }

  if (name.trim().length > 100) return res.status(400).json({ error: 'Ad çok uzun (max 100 karakter).' });
  if (email.trim().length > 254) return res.status(400).json({ error: 'E-posta çok uzun.' });
  if (phone && phone.length > 30) return res.status(400).json({ error: 'Telefon çok uzun.' });
  if (company && company.length > 100) return res.status(400).json({ error: 'Şirket adı çok uzun.' });
  if (message.trim().length > 5000) return res.status(400).json({ error: 'Mesaj çok uzun (max 5000 karakter).' });

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }

  if (message.trim().length < 10) {
    return res.status(400).json({ error: 'Mesajınız en az 10 karakter olmalıdır.' });
  }

  try {
    // Save to DB
    try {
      const db = await getDb();
      await db.collection('messages').insertOne({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || '-',
        company: company?.trim() || '-',
        service: service || '-',
        message: message.trim(),
        source,
        status: 'yeni',
        read: false,
        createdAt: new Date(),
      });
      logActivity(db, { action: 'Yeni mesaj alındı', detail: `${name.trim()} - ${service || 'Genel'}`, type: 'message', icon: '✉️', user: 'sistem' }).catch(() => {});
    } catch (dbErr) {
      console.error('MongoDB save failed (non-critical):', dbErr.message);
    }

    // Send notification email to team
    const mailTo = process.env.MAIL_TO || 'thekademedia@gmail.com';
    const transporter = makeTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Kadir Demir Website" <${process.env.SMTP_USER}>`,
          to: mailTo,
          subject: `🔔 Yeni Lead: ${escapeHtml(name)} — ${service || 'Genel'}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;">
              <div style="text-align:center;padding:20px 0;border-bottom:1px solid #333;">
                <h1 style="color:#eac321;margin:0;">⚡ Kadir Demir</h1>
                <p style="color:#888;margin:8px 0 0">Yeni Lead Bildirimi</p>
              </div>
              <div style="padding:30px 20px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#888;width:120px;">Ad Soyad</td><td style="padding:8px 0;color:#fff;font-weight:600;">${escapeHtml(name)}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">E-posta</td><td style="padding:8px 0;color:#eac321;">${escapeHtml(email)}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Telefon</td><td style="padding:8px 0;color:#fff;">${escapeHtml(phone || '-')}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Şirket</td><td style="padding:8px 0;color:#fff;">${escapeHtml(company || '-')}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Hizmet</td><td style="padding:8px 0;color:#fff;">${escapeHtml(service || '-')}</td></tr>
                </table>
                <div style="margin-top:20px;padding:16px;background:#1a1a1a;border-radius:8px;border-left:3px solid #eac321;">
                  <p style="color:#ccc;margin:0;line-height:1.6;">${escapeHtml(message)}</p>
                </div>
                <div style="text-align:center;margin:24px 0;">
                  <a href="mailto:${escapeHtml(email)}" style="display:inline-block;padding:14px 32px;background:#eac321;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">Yanıtla</a>
                </div>
              </div>
            </div>
          `,
        });
      } catch (mailErr) {
        console.log('Team notification email failed (non-critical):', mailErr.message);
      }

      // Thank you email
      try {
        await transporter.sendMail({
          from: `"Kadir Demir" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Mesajınız Alındı — Kadir Demir',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff;border-radius:12px;">
              <div style="text-align:center;padding:20px 0;border-bottom:1px solid #333;">
                <h1 style="color:#eac321;margin:0;">Kadir Demir</h1>
              </div>
              <div style="padding:30px 20px;">
                <h2 style="color:#fff;">Merhaba ${escapeHtml(name)},</h2>
                <p style="color:#ccc;line-height:1.8;">Mesajınız başarıyla alındı. Ekibimiz en kısa sürede sizinle iletişime geçecek — genellikle 1 iş günü içinde yanıt veriyoruz.</p>
                <p style="color:#ccc;line-height:1.8;">Acil bir konunuz varsa WhatsApp üzerinden ulaşabilirsiniz:</p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="https://wa.me/905067293423" style="display:inline-block;padding:14px 32px;background:#eac321;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">WhatsApp'tan Yaz</a>
                </div>
                <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
                <p style="color:#888;font-size:13px;">Kadir Demir | Biruni Teknopark, Zeytinburnu/İstanbul<br/>hello@kademedia.com | +90 506 729 34 23</p>
              </div>
            </div>
          `,
        });
      } catch (thankYouErr) {
        console.log('Thank-you email failed (non-critical):', thankYouErr.message);
      }
    }

    // WhatsApp notification
    const waPhone = process.env.WA_PHONE;
    const waApiKey = process.env.WA_APIKEY;
    if (waPhone && waApiKey) {
      try {
        const waText = encodeURIComponent(
          `🔔 Yeni Lead!\n👤 ${name}\n📧 ${email}\n📞 ${phone || '-'}\n🏢 ${company || '-'}\n🎯 ${service || '-'}\n💬 ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`
        );
        await fetch(`https://api.callmebot.com/whatsapp.php?phone=${waPhone}&text=${waText}&apikey=${waApiKey}`);
      } catch (waError) {
        console.log('WA notification failed (non-critical):', waError.message);
      }
    }

    return res.status(200).json({ message: 'Mesajınız başarıyla gönderildi!' });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ error: 'Mesaj gönderilirken bir hata oluştu' });
  }
}

// ========== NEWSLETTER ==========
function getNewsletterSecret() {
  return process.env.NEWSLETTER_SECRET || process.env.JWT_SECRET;
}

function generateConfirmToken(email) {
  const secret = getNewsletterSecret();
  if (!secret) return null;
  // 7 günlük geçerlilik için timestamp gömüyoruz: <emailLower>:<ts>
  const ts = Date.now().toString(36);
  const payload = `${email.toLowerCase()}:${ts}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32);
  return Buffer.from(`${payload}:${sig}`, 'utf8').toString('base64url');
}

function verifyConfirmToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [emailLower, ts, sig] = parts;
    if (!EMAIL_RE.test(emailLower)) return null;
    const expected = crypto.createHmac('sha256', getNewsletterSecret()).update(`${emailLower}:${ts}`).digest('hex').slice(0, 32);
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))) return null;
    // 7 gün
    const tsMs = parseInt(ts, 36);
    if (Date.now() - tsMs > 7 * 24 * 60 * 60 * 1000) return null;
    return emailLower;
  } catch { return null; }
}

async function handleNewsletter(req, res) {
  const { email } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }
  const emailLower = email.toLowerCase().trim();

  try {
    const db = await getDb();
    const collection = db.collection('newsletter');
    const existing = await collection.findOne({ email: emailLower });

    if (existing?.confirmed) {
      return res.status(200).json({ message: 'Zaten onaylı bir abonesin, teşekkürler!' });
    }

    const confirmToken = generateConfirmToken(emailLower);
    if (!confirmToken) {
      return res.status(500).json({ error: 'Sunucu yapılandırma hatası.' });
    }

    // Upsert (pending state)
    await collection.updateOne(
      { email: emailLower },
      {
        $set: {
          email: emailLower,
          confirmed: false,
          status: 'pending',
          source: 'website',
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Confirm linki gönder
    const baseUrl = (process.env.SITE_BASE_URL || 'https://kadirdemir-nu.vercel.app').replace(/\/$/, '');
    const confirmUrl = `${baseUrl}/api/contact?action=confirm&token=${encodeURIComponent(confirmToken)}`;

    const transporter = makeTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Kadir Demir" <${process.env.SMTP_USER}>`,
          to: emailLower,
          subject: 'Aboneliğini onayla',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#0a0a0a;color:#fff;border-radius:12px">
              <h2 style="color:#4dd0c2;margin:0 0 12px">Selam!</h2>
              <p style="line-height:1.6;color:#ccc">Bültene abone olmak istediğin için teşekkürler. Aboneliği tamamlamak için aşağıdaki butona tıklaman yeterli:</p>
              <p style="text-align:center;margin:28px 0">
                <a href="${confirmUrl}" style="background:#4dd0c2;color:#0a0a0a;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;display:inline-block">Aboneliği Onayla</a>
              </p>
              <p style="font-size:12px;color:#666;margin-top:24px">Eğer bu e-postayı sen istemediysen, görmezden gel — hiçbir şey yapılmayacak.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error('Confirm mail failed:', mailErr.message);
      }
    }

    return res.status(200).json({ message: 'Onay linki e-postana gönderildi. Aboneliği tamamlamak için linke tıkla.' });
  } catch (err) {
    console.error('Newsletter error:', err);
    return res.status(500).json({ error: 'Bir hata oluştu, lütfen tekrar deneyin.' });
  }
}

async function handleNewsletterConfirm(req, res) {
  const tokenRaw = req.query?.token;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
  if (!token) {
    return res.status(400).send(htmlPage('Geçersiz onay linki', 'Bu link geçerli değil.'));
  }
  const email = verifyConfirmToken(token);
  if (!email) {
    return res.status(403).send(htmlPage('Link süresi dolmuş', 'Onay linkinin süresi dolmuş ya da geçersiz. Lütfen tekrar abone ol.'));
  }
  try {
    const db = await getDb();
    const result = await db.collection('newsletter').updateOne(
      { email },
      { $set: { confirmed: true, status: 'active', confirmedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      // ilk kez tıklanıyorsa kaydı oluştur
      await db.collection('newsletter').insertOne({
        email, confirmed: true, status: 'active', source: 'website',
        createdAt: new Date(), confirmedAt: new Date(),
      });
    }
    return res.status(200).send(htmlPage('Tamamdır! 🎉', 'Aboneliğin onaylandı. Yeni içeriklerden ilk sen haberdar olacaksın.'));
  } catch (e) {
    console.error('Confirm error:', e);
    return res.status(500).send(htmlPage('Bir hata oluştu', 'Lütfen daha sonra tekrar dene.'));
  }
}

function htmlPage(title, message) {
  const safeTitle = escapeHtml(title);
  const safeMsg = escapeHtml(message);
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${safeTitle}</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="font-family:Arial,sans-serif;text-align:center;padding:60px 20px;background:#0a0a0a;color:#fff;margin:0">
    <div style="max-width:480px;margin:0 auto">
      <h2 style="color:#4dd0c2;margin:0 0 16px">${safeTitle}</h2>
      <p style="color:#ccc;line-height:1.6">${safeMsg}</p>
      <p style="margin-top:32px"><a href="/" style="color:#4dd0c2;text-decoration:none">← Anasayfaya dön</a></p>
    </div>
  </body></html>`;
}
