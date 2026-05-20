import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaTwitch,
  FaXTwitter,
} from 'react-icons/fa6'
import {
  HiOutlinePlay,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlineVideoCamera,
  HiOutlineChevronDown,
  HiOutlineSparkles,
  HiOutlineFire,
} from 'react-icons/hi2'
import { useEffect, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useSEO } from '../hooks/useSEO'
import { PersonSchema, FAQSchema, VideoSchema, WebSiteSchema } from '../components/StructuredData'
import CountUp from '../components/CountUp'
import PollWidget from '../components/PollWidget'
import NewsletterForm from '../components/NewsletterForm'
import ResponsivePortrait from '../components/ResponsivePortrait'
import { SkeletonGrid } from '../components/Skeleton'
import GlassButton from '../components/GlassButton'
import GradientText from '../components/reactbits/GradientText'
import ScrollVelocity from '../components/reactbits/ScrollVelocity'
import { getYouTubeVideosApi, getBlogsApi } from '../api'
import './Home.css'

function parseStat(value) {
  if (!value) return null
  const m = String(value).match(/^([\d.,]+)\s*([KMB])?(.*)$/i)
  if (!m) return null
  const num = parseFloat(m[1].replace(',', '.'))
  if (!Number.isFinite(num)) return null
  return { num, suffix: (m[2] || '') + (m[3] || '') }
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

function formatViews(n) {
  if (!n) return null
  const num = Number(n)
  if (!Number.isFinite(num)) return n
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(num)
}

function parseDuration(iso) {
  if (!iso) return ''
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return ''
  const h = Number(m[1] || 0)
  const min = Number(m[2] || 0)
  const s = Number(m[3] || 0)
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`
}

function formatBlogTag(category) {
  return String(category || 'YAZI').toUpperCase().slice(0, 14)
}

const faqs = [
  {
    q: 'Yeni videoları ne sıklıkla yüklüyorsun?',
    a: 'Haftada 2-3 yeni video yüklemeye gayret ediyorum. YouTube’da zile basarsan bildirimleri kaçırmazsın.',
  },
  {
    q: 'Sponsorluklara açık mısın?',
    a: 'Markalarla uzun vadeli ve doğru kitleye hitap eden iş birliklerine açığım. İş birliği e-posta adresimden ulaşabilirsiniz.',
  },
  {
    q: 'Hangi günler video yayınlıyorsun?',
    a: 'Genellikle Salı, Perşembe ve Cumartesi yayın günlerim. Bazen sürpriz içerikler de paylaşıyorum.',
  },
  {
    q: 'Video önerimi nereden iletebilirim?',
    a: 'Instagram DM, YouTube yorumları veya iletişim sayfasındaki form üzerinden bana ulaşabilirsin — hepsini okumaya gayret ediyorum.',
  },
  {
    q: 'Kullandığın ekipmanlar neler?',
    a: 'Tüm setup’ımın detayını Setup sayfasından inceleyebilirsin: kamera, mikrofon, ışık, bilgisayar — hepsi orada.',
  },
  {
    q: 'Etkinliklerde nasıl bulunabilirim?',
    a: 'Etkinlik ve buluşma takvimimi Instagram üzerinden duyuruyorum. Yakın zamanda bir meet-up planlanıyor.',
  },
]

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <details
      className={`kd-faq-item ${open ? 'open' : ''}`}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="kd-faq-q">
        <span>{faq.q}</span>
        <HiOutlineChevronDown size={20} aria-hidden="true" />
      </summary>
      <div className="kd-faq-a-wrap">
        <div className="kd-faq-a">{faq.a}</div>
      </div>
    </details>
  )
}

export default function Home() {
  const { settings } = useSiteSettings()
  const [videos, setVideos] = useState([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [blogs, setBlogs] = useState([])

  useSEO({
    title: settings.seoTitle || 'Kadir Demir | YouTube İçerik Üreticisi',
    description: settings.seoDescription || settings.description,
    keywords: settings.seoKeywords,
    path: '/',
  })

  useEffect(() => {
    getYouTubeVideosApi()
      .then((res) => { if (res?.videos) setVideos(res.videos) })
      .catch(() => { /* ignore — use fallback */ })
      .finally(() => setVideosLoading(false))
    getBlogsApi()
      .then((res) => {
        const list = Array.isArray(res?.blogs) ? res.blogs : Array.isArray(res?.data) ? res.data : []
        setBlogs(list.filter((b) => !b?.draft).slice(0, 3))
      })
      .catch(() => { /* ignore — section hidden if empty */ })
  }, [])

  const subscribeUrl = `${settings.youtube || 'https://youtube.com/@kadirdemir'}?sub_confirmation=1`

  const stats = [
    { icon: FaYoutube, value: settings.statsYoutubeSubs, label: 'YouTube Abonesi' },
    { icon: FaInstagram, value: settings.statsInstagramFollowers, label: 'Instagram Takipçi' },
    { icon: HiOutlineEye, value: settings.statsTotalViews, label: 'Toplam İzlenme' },
    { icon: HiOutlineVideoCamera, value: settings.statsTotalVideos, label: 'Yayınlanmış Video' },
  ].filter(s => s.value)

  const featuredVideo = videos[0]
  const recentVideos = videos.slice(1, 5)
  const topViewedVideos = [...videos]
    .filter((v) => Number(v.views) > 0)
    .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
    .slice(0, 3)

  const socialFollows = [
    settings.youtube && { icon: FaYoutube, name: 'YouTube', meta: `${settings.statsYoutubeSubs || ''} Abone`.trim(), url: settings.youtube, color: '#ff0033' },
    settings.instagram && { icon: FaInstagram, name: 'Instagram', meta: `${settings.statsInstagramFollowers || ''} Takipçi`.trim(), url: settings.instagram, color: '#e1306c' },
    settings.tiktok && { icon: FaTiktok, name: 'TikTok', meta: 'Yeni içerikler', url: settings.tiktok, color: '#ffffff' },
    settings.twitch && { icon: FaTwitch, name: 'Twitch', meta: 'Canlı yayınlar', url: settings.twitch, color: '#9146ff' },
    settings.twitter && { icon: FaXTwitter, name: 'X', meta: 'Anlık düşünceler', url: settings.twitter, color: '#ffffff' },
  ].filter(Boolean)

  const igPosts = (settings.instagramPosts || []).filter(p => p && p.url)
  const instagramShots = igPosts.length > 0
    ? igPosts.slice(0, 6)
    : [
        { id: 1, caption: 'Stüdyodan kareler' },
        { id: 2, caption: 'Set arkası' },
        { id: 3, caption: 'Yeni bölüm yakında' },
        { id: 4, caption: 'Ekiple birlikte' },
      ].map(s => ({ ...s, url: settings.instagram }))

  return (
    <div className="kd-home">
      <PersonSchema socials={settings} />
      <WebSiteSchema />
      <FAQSchema items={faqs} />
      {videos.length > 0 && <VideoSchema videos={videos.slice(0, 8)} />}

      {/* ===== HERO ===== */}
      <section className="kd-hero">
        <div className="kd-hero-bg" aria-hidden="true">
          <span className="kd-hero-orb kd-hero-orb-1" />
          <span className="kd-hero-orb kd-hero-orb-2" />
        </div>

        <motion.span
          className="kd-hero-badge"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="kd-hero-badge-dot" />
          Yeni bölüm yayında
        </motion.span>

        <motion.h1
          className="kd-hero-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Selam, ben{' '}
          <GradientText
            className="kd-hero-name"
            colors={['#fbbf24', '#f59e0b', '#fb923c', '#f59e0b', '#fbbf24']}
            animationSpeed={6}
            yoyo={false}
          >
            {settings.businessName || 'Kadir Demir'}
          </GradientText>
          <br />
          ve hikâye anlatmayı seviyorum.
        </motion.h1>
        <motion.p
          className="kd-hero-sub"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          {settings.description || "İstanbul'dan yayın yapan bir içerik üreticisiyim. Oyun, vlog ve eğlence videolarımla küçük anları büyük anılara çeviriyorum — sen de bu yolculuğa katılmaya ne dersin?"}
        </motion.p>

        <motion.div
          className="kd-hero-cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <GlassButton
            as="a"
            variant="primary"
            size="lg"
            href={subscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            icon={<FaYoutube size={18} />}
          >
            Kanalıma abone ol
          </GlassButton>
          <GlassButton
            as={Link}
            to="/videolar"
            variant="secondary"
            size="lg"
            icon={<HiOutlinePlay size={18} />}
          >
            Videoları izle
          </GlassButton>
        </motion.div>

        {stats.length > 0 && (
          <motion.div
            className="kd-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
          >
            {stats.map((s) => {
              const parsed = parseStat(s.value)
              return (
                <div key={s.label} className="kd-stat">
                  <span className="kd-stat-icon">
                    <s.icon size={18} />
                  </span>
                  <div className="kd-stat-value">
                    {parsed ? (
                      <CountUp
                        to={parsed.num}
                        decimals={parsed.num % 1 === 0 ? 0 : 2}
                        suffix={parsed.suffix}
                        duration={1800}
                      />
                    ) : s.value}
                  </div>
                  <div className="kd-stat-label">{s.label}</div>
                </div>
              )
            })}
          </motion.div>
        )}
      </section>

      {/* ===== ABOUT SPLIT 1 ===== */}
      <motion.section className="kd-section kd-split" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <div className="kd-split-text">
          <span className="kd-eyebrow">Hakkımda</span>
          <h2>
            İçerik üretmek, benim
            <br />
            #1 <span className="kd-accent">tutkum</span>.
          </h2>
          <p>
            Çocukluğumdan beri kameranın hem önünde hem arkasında olmayı seviyorum. İlk
            videomu yıllar önce yükledim ve o günden bugüne izleyicilerimle birlikte
            büyüyen, evrilen bir kanal kurdum.
          </p>
          <p>
            Her video benim için yeni bir hikâye anlatma fırsatı. Sıradan bir günü ilginç
            kılmak, izleyiciye gerçekten değer katacak bir an yaratmak istiyorum.
          </p>
          <Link to="/hakkimda" className="kd-section-link kd-link-arrow">
            Hikayemin devamı <HiOutlineArrowRight />
          </Link>
        </div>
        <div className="kd-split-media">
          <div className="kd-media-frame kd-media-stack">
            <div className="kd-media-tag">Story</div>
            <ResponsivePortrait
              alt="Kadir Demir — stüdyo portresi"
              className="kd-media-img"
              sizes="(max-width: 820px) 100vw, 480px"
            />
          </div>
        </div>
      </motion.section>

      {/* ===== ABOUT SPLIT 2 ===== */}
      <motion.section className="kd-section kd-split kd-split-reverse" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <div className="kd-split-media">
          <div className="kd-media-frame kd-media-stack kd-media-secondary">
            <div className="kd-media-tag">Behind the scenes</div>
            <ResponsivePortrait
              alt="Kadir Demir — kayıt sırasında"
              className="kd-media-img kd-media-img-alt"
              sizes="(max-width: 820px) 100vw, 480px"
            />
          </div>
        </div>
        <div className="kd-split-text">
          <span className="kd-eyebrow">Yolculuk</span>
          <h2>
            Yıllar boyunca <span className="kd-accent">{settings.statsTotalVideos || '3.8K'}</span>
            <br />
            video ürettim.
          </h2>
          <p>
            Bu yolculuk küçük bir kameradan başladı. Bugün ise tam donanımlı bir stüdyoda,
            ekibimle birlikte çekiyor, kurguluyor ve severek üretmeye devam ediyorum.
          </p>
          <p>
            Sayılardan daha önemlisi: Her videonun arkasında binlerce izleyiciyle
            kurduğum bağ. İşte bu bağ, beni her gün yeniden kameranın karşısına çekiyor.
          </p>
          <Link to="/setup" className="kd-section-link kd-link-arrow">
            Setup’ımı incele <HiOutlineArrowRight />
          </Link>
        </div>
      </motion.section>

      {/* ===== FEATURED VIDEO ===== */}
      {featuredVideo && (
        <motion.section className="kd-section kd-featured" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <div className="kd-section-head">
            <span className="kd-eyebrow"><HiOutlineSparkles /> Öne çıkan</span>
            <h2>Bu hafta öne çıkan video</h2>
            <p>Kanalımdaki en güncel ve en çok konuşulan içerik</p>
          </div>
          <div className="kd-featured-card">
            <div className="kd-featured-thumb">
              <img
                className="kd-featured-img"
                src={featuredVideo.thumbnail || `https://i.ytimg.com/vi/${featuredVideo.youtubeId}/maxresdefault.jpg`}
                alt={`${featuredVideo.title} — öne çıkan YouTube videosu küçük resmi`}
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div className="kd-featured-shade" />
              <span className="kd-featured-overlay-top">YENİ BÖLÜM</span>
              <a
                className="kd-play-btn"
                href={`https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Videoyu oynat"
              >
                <HiOutlinePlay size={28} />
              </a>
            </div>
            <div className="kd-featured-info">
              <span className="kd-pill">Öne Çıkan</span>
              <h3>{featuredVideo.title}</h3>
              <a
                href={`https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kd-section-link kd-link-arrow"
              >
                Şimdi izle <HiOutlineArrowRight />
              </a>
            </div>
          </div>
        </motion.section>
      )}

      {/* ===== RECENT VIDEOS ===== */}
      {(videosLoading || recentVideos.length > 0) && (
        <motion.section className="kd-section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <div className="kd-section-head kd-row">
            <div>
              <span className="kd-eyebrow">Yeni içerikler</span>
              <h2>Son videolar</h2>
            </div>
            <Link to="/videolar" className="kd-section-link kd-link-arrow">
              Tümünü gör <HiOutlineArrowRight />
            </Link>
          </div>
          {videosLoading && recentVideos.length === 0 && (
            <SkeletonGrid count={4} kind="video" />
          )}
          <div className="kd-video-grid">
            {recentVideos.map((v) => (
              <a
                key={v.youtubeId}
                href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kd-video-card"
              >
                <div className="kd-video-thumb">
                  <img
                    src={v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                    alt={`${v.title} — YouTube videosu`}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <div className="kd-video-shade" />
                  {parseDuration(v.duration) && (
                    <span className="kd-video-duration">{parseDuration(v.duration)}</span>
                  )}
                  <span className="kd-video-hover-play">
                    <HiOutlinePlay size={22} />
                  </span>
                </div>
                <div className="kd-video-meta">
                  <h4 className="kd-video-title">{v.title}</h4>
                  {v.views && <div className="kd-video-views">{formatViews(v.views)} izlenme</div>}
                </div>
              </a>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== TOP VIEWED ===== */}
      {topViewedVideos.length > 0 && (
        <motion.section className="kd-section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <div className="kd-section-head kd-row">
            <div>
              <span className="kd-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineFire /> En çok izlenenler
              </span>
              <h2>İzleyici favorileri</h2>
              <p>Tüm zamanların en yüksek izlenmesi olan videolar.</p>
            </div>
            <Link to="/videolar" className="kd-section-link kd-link-arrow">
              Tümünü gör <HiOutlineArrowRight />
            </Link>
          </div>
          <div className="kd-video-grid">
            {topViewedVideos.map((v, idx) => (
              <a
                key={v.youtubeId}
                href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kd-video-card"
              >
                <div className="kd-video-thumb">
                  <img
                    src={v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`}
                    alt={`${v.title} — YouTube videosu`}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <div className="kd-video-shade" />
                  <span className="kd-rank-badge">
                    <HiOutlineFire /> #{idx + 1}
                  </span>
                  {parseDuration(v.duration) && (
                    <span className="kd-video-duration">{parseDuration(v.duration)}</span>
                  )}
                  <span className="kd-video-hover-play">
                    <HiOutlinePlay size={22} />
                  </span>
                </div>
                <div className="kd-video-meta">
                  <h4 className="kd-video-title">{v.title}</h4>
                  {v.views && <div className="kd-video-views">{formatViews(v.views)} izlenme</div>}
                </div>
              </a>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== POLL ===== */}
      <motion.section className="kd-section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <PollWidget />
      </motion.section>

      {/* ===== ARTICLES ===== */}
      {blogs.length > 0 && (
        <motion.section className="kd-section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <div className="kd-section-head kd-row">
            <div>
              <span className="kd-eyebrow">Blog</span>
              <h2>Son makaleler</h2>
              <p>Blogumdaki son yazılar — düşüncelerim, ipuçları, perde arkası.</p>
            </div>
            <Link to="/blog" className="kd-section-link kd-link-arrow">
              Tümünü gör <HiOutlineArrowRight />
            </Link>
          </div>
          <div className="kd-article-grid">
            {blogs.map((b) => (
              <Link key={b._id || b.slug} to={`/blog/${b.slug}`} className="kd-article-card">
                <div
                  className="kd-article-thumb"
                  style={b.coverImage ? { backgroundImage: `url(${b.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                  <span className="kd-article-tag">{formatBlogTag(b.category)}</span>
                  {!b.coverImage && <span className="kd-thumb-mono">K</span>}
                </div>
                <div className="kd-article-info">
                  <h4>{b.title}</h4>
                  <p>{b.excerpt || b.summary || ''}</p>
                  <span className="kd-link-arrow kd-link-arrow-sm">
                    Yazıyı oku <HiOutlineArrowRight />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== NEWSLETTER ===== */}
      <motion.section className="kd-section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <NewsletterForm />
      </motion.section>

      {/* ===== INSTAGRAM ===== */}
      {settings.instagram && (
        <motion.section className="kd-section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <div className="kd-section-head kd-row">
            <div>
              <span className="kd-eyebrow">Sosyal</span>
              <h2>Instagram</h2>
              <p>Son paylaşımlarım — fotoğraf, reels ve story arşivi.</p>
            </div>
            <a
              href={settings.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="kd-section-link kd-link-arrow"
            >
              Profilime git <HiOutlineArrowRight />
            </a>
          </div>
          <div className="kd-ig-grid">
            {instagramShots.map((shot, i) => (
              <a
                key={shot.id || shot.url || i}
                href={shot.url || settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="kd-ig-card"
                aria-label={shot.caption || `Instagram paylaşımı ${i + 1}`}
                style={shot.thumbnail ? { backgroundImage: `url(${shot.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!shot.thumbnail && (
                  <>
                    <span className="kd-ig-icon">
                      <FaInstagram size={22} />
                    </span>
                    <span className="kd-ig-caption">{shot.caption || 'Instagram'}</span>
                  </>
                )}
                {shot.thumbnail && <span className="kd-ig-icon kd-ig-icon-overlay"><FaInstagram size={22} /></span>}
              </a>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== FOLLOW ===== */}
      {socialFollows.length > 0 && (
        <motion.section className="kd-section kd-follow" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          <div className="kd-section-head kd-section-head-center">
            <span className="kd-eyebrow">Birlikte takılalım</span>
            <h2>Beni takip et</h2>
            <p>YouTube’un yanı sıra diğer platformlarda da paylaşımlar yapıyorum.</p>
          </div>
          <div className="kd-follow-grid">
            {socialFollows.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="kd-follow-card"
                style={{ '--social-color': s.color }}
              >
                <span className="kd-follow-icon">
                  <s.icon size={20} />
                </span>
                <div className="kd-follow-info">
                  <div className="kd-follow-name">{s.name}</div>
                  <div className="kd-follow-meta">{s.meta}</div>
                </div>
                <HiOutlineArrowRight className="kd-follow-arrow" />
              </a>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== FAQ ===== */}
      <motion.section className="kd-section kd-faq" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <div className="kd-section-head kd-section-head-center">
          <span className="kd-eyebrow">SSS</span>
          <h2>Sıkça Sorulanlar</h2>
          <p>Aklındaki sorunun cevabı burada yoksa iletişim sayfasından bana yaz.</p>
        </div>
        <div className="kd-faq-grid">
          {faqs.map((f, i) => (
            <FAQItem key={i} faq={f} />
          ))}
        </div>
      </motion.section>

      {/* ===== SCROLL VELOCITY MARQUEE ===== */}
      <section className="kd-velocity-strip" aria-hidden="true">
        <ScrollVelocity
          texts={['Kadir Demir • İçerik • Hikâye • İstanbul •', 'Vlog • Oyun • Eğlence • Macera •']}
          velocity={60}
        />
      </section>

      {/* ===== CTA STRIP ===== */}
      <motion.section className="kd-section kd-cta" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
        <div className="kd-cta-card">
          <div className="kd-cta-text">
            <h2>Hadi tanışalım.</h2>
            <p>İş birliği, sponsorluk veya sadece selam vermek için bir mesajını bekliyorum.</p>
          </div>
          <GlassButton
            as={Link}
            to="/iletisim"
            variant="primary"
            size="md"
            iconRight={<HiOutlineArrowRight size={18} />}
          >
            İletişime geç
          </GlassButton>
        </div>
      </motion.section>
    </div>
  )
}
