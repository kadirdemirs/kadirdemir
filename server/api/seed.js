import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from './_lib/mongodb.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';

const defaultPartners = [];

const defaultBlogs = [
  {
    slug: 'youtube-ilk-1000-abone',
    titleTr: 'YouTube’da İlk 1000 Aboneye Ulaşmak: 14 Yıl Sonra Bildiğim Şey',
    titleEn: 'Reaching the First 1000 Subscribers: What I Know After 14 Years',
    excerptTr: 'İlk 1000 abone en zor olanı. Geriye dönüp baktığımda işe yarayan birkaç şey vardı.',
    excerptEn: 'The first 1000 subscribers are the hardest. A few things actually worked.',
    contentTr: '<h2>İlk 1000 abone</h2><p>İlk videomu yüklediğimden bu yana 14 yıl geçti. İlk 1000 aboneye ulaşmak diğer 100 binden daha zordu.</p><h2>Sabır değil tutarlılık</h2><p>İnsanlar sabırlı ol der ama mesele tutarlılık. Haftada bir video yüklüyorsan 14 hafta üst üste yükle.</p><h2>Thumbnail ve başlık videodan önemli</h2><p>Videoyu kimse açmazsa içerik ne kadar iyi olduğunun önemi yok.</p><h2>Yorumlara cevap ver</h2><p>İlk yıllarda her yoruma cevap verdim. O insanların yarısı hâlâ takipte.</p>',
    contentEn: '<h2>The first 1000 subscribers</h2><p>It has been 14 years since I uploaded my first video. The first 1000 subscribers were harder than the next 100,000.</p><h2>Not patience, consistency</h2><p>If you upload weekly, upload for 14 weeks straight.</p><h2>Thumbnail and title matter more</h2><p>If nobody clicks, content quality does not matter.</p><h2>Reply to comments</h2><p>In the early years I replied to every comment. Half of those people still watch.</p>',
    category: 'Süreç', categoryEn: 'Process',
    date: '1 Nis 2026', readTime: 5, image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80', color: '#d4943f',
  },
  {
    slug: 'kurgu-uzerine-notlar',
    titleTr: 'Kurgu Üzerine Notlar: 14 Yılda Öğrendiğim Şeyler',
    titleEn: 'Notes on Editing: What I Learned in 14 Years',
    excerptTr: 'İyi kurgu görünmez. İzleyici sadece akıp gidiyor der.',
    excerptEn: 'Good editing is invisible. The viewer just says it flows.',
    contentTr: '<h2>Kes, kes, kes</h2><p>İlk taslakta hep uzun olur. Soğuk kafayla geri dönüp her sahnenin ne kadar tutması gerektiğini sor. Cevap genelde daha az.</p><h2>Müzik son adım</h2><p>Önce görüntü, sonra ses tasarımı, en son müzik.</p><h2>Sonu önce yaz</h2><p>Videonun nereye varacağını bilmiyorsan kurgu rastgele olur.</p>',
    contentEn: '<h2>Cut, cut, cut</h2><p>First drafts are always too long. Ask every scene how long it should hold. Usually less.</p><h2>Music is the last step</h2><p>Picture first, then sound design, then music.</p><h2>Write the ending first</h2><p>If you do not know where the video lands, the edit will be random.</p>',
    category: 'Süreç', categoryEn: 'Process',
    date: '5 Nis 2026', readTime: 5, image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80', color: '#a67428',
  },
];

const defaultContent = [
  {
    section: 'hero',
    data: {
      tr: { title1: 'Kadir Demir', title2: 'İçerik Üreticisi', subtitle: "14 yıldır YouTube'dayım. Vlog, oyun ve canlı yayın." },
      en: { title1: 'Kadir Demir', title2: 'Content Creator', subtitle: '14 years on YouTube. Vlogs, gaming and live streams.' },
    }
  },
  {
    section: 'footer',
    data: {
      email: 'thekademedia@gmail.com',
      phone: '',
      address: 'İstanbul, TR',
      instagram: 'https://instagram.com/kadirardademir',
      twitter: 'https://x.com/kadirdemir',
      youtube: 'https://youtube.com/@kadirdemir',
      tiktok: 'https://tiktok.com/@kadirdemirs',
      discord: '',
      linkedin: '',
      whatsapp: '',
    }
  },
];

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function timingSafeEqualString(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) return false;
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST to seed the database' });
  }

  if (isProductionRuntime() && process.env.SEED_ENDPOINT_ENABLED !== 'true') {
    return res.status(404).json({ error: 'Seed endpoint is disabled' });
  }

  const rl = await rateLimitCheck(req, {
    namespace: 'seed',
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  });
  if (!rl.allowed) {
    return res.status(429).json({ error: `Too many seed attempts. Try again in ${rl.retryAfter} minutes.` });
  }

  const seedSecret = process.env.SEED_SECRET;
  if (!seedSecret) {
    return res.status(500).json({ error: 'SEED_SECRET environment variable is not set' });
  }

  const { secret } = req.body || {};
  if (!timingSafeEqualString(secret, seedSecret)) {
    return res.status(403).json({ error: 'Invalid seed secret' });
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: 'SEED_ADMIN_PASSWORD environment variable is not set' });
  }

  try {
    const db = await getDb();

    // Ensure unique index on username to prevent duplicates
    await db.collection('users').createIndex({ username: 1 }, { unique: true }).catch(() => {});

    // Create admin user (only if not exists - never touches other users)
    const existingAdmin = await db.collection('users').findOne({ username: 'kade' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.collection('users').insertOne({
        username: 'kade',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      });
    }

    // Count existing users (for reporting only - seed never deletes users)
    const userCount = await db.collection('users').countDocuments();

    // Seed partners
    const partnerCount = await db.collection('partners').countDocuments();
    if (partnerCount === 0) {
      const partners = defaultPartners.map(p => ({ ...p, createdAt: new Date(), updatedAt: new Date() }));
      await db.collection('partners').insertMany(partners);
    }

    // Seed blogs
    const blogCount = await db.collection('blogs').countDocuments();
    if (blogCount === 0) {
      const blogs = defaultBlogs.map(b => ({ ...b, createdAt: new Date(), updatedAt: new Date() }));
      await db.collection('blogs').insertMany(blogs);
    } else {
      // Migrate: update any blog with 2025 date to 2026 equivalent
      const blogsWithOldDate = await db.collection('blogs').find({ date: { $regex: '2025' } }).toArray();
      for (const blog of blogsWithOldDate) {
        const newDate = blog.date.replace('2025', '2026');
        await db.collection('blogs').updateOne({ _id: blog._id }, { $set: { date: newDate, updatedAt: new Date() } });
      }
      // Update blog posts from defaultBlogs with newer content (slug match)
      for (const defaultBlog of defaultBlogs) {
        const existing = await db.collection('blogs').findOne({ slug: defaultBlog.slug });
        if (existing) {
          await db.collection('blogs').updateOne(
            { slug: defaultBlog.slug },
            { $set: {
              contentTr: defaultBlog.contentTr || existing.contentTr,
              contentEn: defaultBlog.contentEn || existing.contentEn,
              date: defaultBlog.date,
              image: defaultBlog.image || existing.image,
              updatedAt: new Date()
            }}
          );
        }
      }
    }

    // Seed site content
    const contentCount = await db.collection('siteContent').countDocuments();
    if (contentCount === 0) {
      const content = defaultContent.map(c => ({ ...c, createdAt: new Date(), updatedAt: new Date() }));
      await db.collection('siteContent').insertMany(content);
    }

    return res.status(200).json({
      message: 'Veritabanı başarıyla oluşturuldu!',
      seeded: {
        admin: !existingAdmin ? 'Oluşturuldu' : 'Zaten mevcut',
        users: `${userCount} kullanıcı korunuyor`,
        partners: partnerCount === 0 ? `${defaultPartners.length} partner eklendi` : 'Zaten mevcut',
        blogs: blogCount === 0 ? `${defaultBlogs.length} blog eklendi` : 'Zaten mevcut',
        content: contentCount === 0 ? `${defaultContent.length} içerik eklendi` : 'Zaten mevcut',
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Seed hatası. Sunucu loglarını kontrol edin.' });
  }
}
