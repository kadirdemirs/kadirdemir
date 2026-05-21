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
} from 'react-icons/hi2'
import { useEffect, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useSEO } from '../hooks/useSEO'
import { PersonSchema, FAQSchema, VideoSchema, WebSiteSchema } from '../components/StructuredData'
import CountUp from '../components/CountUp'
import NewsletterForm from '../components/NewsletterForm'
import ResponsivePortrait from '../components/ResponsivePortrait'
import HeroComposition from '../components/HeroComposition'
import { SkeletonGrid } from '../components/Skeleton'
import BlurText from '../components/reactbits/BlurText'
import MagicBento from '../components/reactbits/MagicBento'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import ScrollVelocity from '../components/reactbits/ScrollVelocity'
import TiltedCard from '../components/reactbits/TiltedCard'
import GlareHover from '../components/reactbits/GlareHover'
import Particles from '../components/reactbits/Particles'
import DecryptedText from '../components/reactbits/DecryptedText'
import Magnet from '../components/reactbits/Magnet'
import VariableProximity from '../components/reactbits/VariableProximity'
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

// Demo fallback content — API yokken bile dolu görünsün
const DEMO_VIDEOS = [
  { youtubeId: 'demo1', title: 'İstanbul sokaklarında 24 saat — vlog #042', thumbnail: '', views: 184000, duration: 'PT12M34S', publishedAt: '2026-05-18' },
  { youtubeId: 'demo2', title: 'Yeni setup turu — masamda neler değişti?', thumbnail: '', views: 96400, duration: 'PT9M12S', publishedAt: '2026-05-12' },
  { youtubeId: 'demo3', title: 'Bu oyunu 8 saat üst üste oynadım', thumbnail: '', views: 142500, duration: 'PT14M55S', publishedAt: '2026-05-08' },
  { youtubeId: 'demo4', title: 'Bir günlük kamera arkası — yeni bölüm', thumbnail: '', views: 78900, duration: 'PT7M48S', publishedAt: '2026-05-03' },
  { youtubeId: 'demo5', title: 'Topluluk Q&A — sorularınızı yanıtladım', thumbnail: '', views: 312000, duration: 'PT18M20S', publishedAt: '2026-04-26' },
]

const DEMO_BLOGS = [
  { slug: 'icerik-uretmenin-mutfagi', title: 'İçerik üretmenin mutfağı: planlama, kurgu, yayın', excerpt: 'Bir videonun arkasında olup biten saatleri ve karar süreçlerini paylaşıyorum.', category: 'Yazı', cover: '' },
  { slug: 'kamera-onunde-rahat-olmak', title: 'Kameranın önünde rahat olmak nasıl öğrenilir?', excerpt: 'İlk videodan bugüne — kamera korkusunu yenmenin küçük alışkanlıkları.', category: 'Süreç', cover: '' },
  { slug: 'youtube-algoritmasi-2026', title: '2026 YouTube algoritması: ne değişti?', excerpt: 'Watch time, retention ve CTR üçgeninde son aylarda gözlemlediklerim.', category: 'Strateji', cover: '' },
]

const faqs = [
  { q: 'Yeni videoları ne sıklıkla yüklüyorsun?', a: 'Haftada 2-3 yeni video yüklemeye gayret ediyorum. YouTube’da zile basarsan bildirimleri kaçırmazsın.' },
  { q: 'Sponsorluklara açık mısın?', a: 'Markalarla uzun vadeli ve doğru kitleye hitap eden iş birliklerine açığım. İş birliği e-posta adresimden ulaşabilirsiniz.' },
  { q: 'Hangi günler video yayınlıyorsun?', a: 'Genellikle Salı, Perşembe ve Cumartesi yayın günlerim. Bazen sürpriz içerikler de paylaşıyorum.' },
  { q: 'Video önerimi nereden iletebilirim?', a: 'Instagram DM, YouTube yorumları veya iletişim sayfasındaki form üzerinden bana ulaşabilirsin.' },
  { q: 'Kullandığın ekipmanlar neler?', a: 'Tüm setup’ımın detayını Setup sayfasından inceleyebilirsin: kamera, mikrofon, ışık, bilgisayar.' },
  { q: 'Etkinliklerde nasıl bulunabilirim?', a: 'Etkinlik ve buluşma takvimimi Instagram üzerinden duyuruyorum. Yakın zamanda bir meet-up planlanıyor.' },
]

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <details className={`hm-faq-item ${open ? 'open' : ''}`} open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="hm-faq-q">
        <span>{faq.q}</span>
        <HiOutlineChevronDown size={20} aria-hidden="true" />
      </summary>
      <div className="hm-faq-a-wrap">
        <div className="hm-faq-a">{faq.a}</div>
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
      .then((res) => {
        if (res?.videos?.length) setVideos(res.videos)
        else setVideos(DEMO_VIDEOS)
      })
      .catch(() => setVideos(DEMO_VIDEOS))
      .finally(() => setVideosLoading(false))
    getBlogsApi()
      .then((res) => {
        const list = Array.isArray(res?.blogs) ? res.blogs : Array.isArray(res?.data) ? res.data : []
        const filtered = list.filter((b) => !b?.draft).slice(0, 3)
        setBlogs(filtered.length ? filtered : DEMO_BLOGS)
      })
      .catch(() => setBlogs(DEMO_BLOGS))
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
    settings.youtube && { icon: FaYoutube, name: 'YouTube', meta: `${settings.statsYoutubeSubs || ''} Abone`.trim(), url: settings.youtube },
    settings.instagram && { icon: FaInstagram, name: 'Instagram', meta: `${settings.statsInstagramFollowers || ''} Takipçi`.trim(), url: settings.instagram },
    settings.tiktok && { icon: FaTiktok, name: 'TikTok', meta: 'Kısa videolar', url: settings.tiktok },
    settings.twitch && { icon: FaTwitch, name: 'Twitch', meta: 'Canlı yayınlar', url: settings.twitch },
    settings.twitter && { icon: FaXTwitter, name: 'X', meta: 'Anlık düşünceler', url: settings.twitter },
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

  const brandName = settings.businessName || 'Kadir Demir'

  return (
    <div className="hm">
      <PersonSchema socials={settings} />
      <WebSiteSchema />
      <FAQSchema items={faqs} />
      {videos.length > 0 && <VideoSchema videos={videos.slice(0, 8)} />}

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hm-hero">
        <div className="hm-hero-particles" aria-hidden="true">
          <Particles
            particleColors={['#f59e0b', '#a855f7', '#ec4899', '#06b6d4']}
            particleCount={90}
            particleBaseSize={70}
            alphaParticles
          />
        </div>
        <div className="hm-hero-grid">
          <div className="hm-hero-left">
            <motion.span
              className="hm-eyebrow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="hm-eyebrow-dot" />{' '}
              <DecryptedText
                text="Yeni bölüm yayında"
                speed={40}
                sequential
                revealDirection="start"
                animateOn="view"
              />
            </motion.span>

            <h1 className="hm-hero-title">
              <BlurText
                text="Selam,"
                animateBy="words"
                delay={100}
                className="hm-hero-line hm-hero-line-1"
              />
              <BlurText
                text={`ben ${brandName}.`}
                animateBy="words"
                delay={120}
                className="hm-hero-line hm-hero-line-2"
              />
              <BlurText
                text="Hikâye anlatmayı seviyorum."
                animateBy="words"
                delay={80}
                className="hm-hero-line hm-hero-line-3"
              />
            </h1>

            <motion.p
              className="hm-hero-sub"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {settings.description || "İstanbul'dan yayın yapan bir içerik üreticisiyim. Oyun, vlog ve eğlence videolarımla küçük anları büyük anılara çeviriyorum."}
            </motion.p>

            <motion.div
              className="hm-hero-cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Magnet padding={70} magnetStrength={0.3}>
                <a href={subscribeUrl} target="_blank" rel="noopener noreferrer" className="hm-btn hm-btn-primary">
                  <FaYoutube size={18} /> Kanalıma abone ol
                </a>
              </Magnet>
              <Magnet padding={70} magnetStrength={0.3}>
                <Link to="/videolar" className="hm-btn hm-btn-ghost">
                  <HiOutlinePlay size={18} /> Videoları izle
                </Link>
              </Magnet>
            </motion.div>
          </div>

          <motion.div
            className="hm-hero-right"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltedCard rotateAmplitude={8} scaleOnHover={1.03} className="hm-hero-tilt">
              <HeroComposition brandName={brandName} />
            </TiltedCard>
          </motion.div>
        </div>

        {stats.length > 0 && (
          <motion.div
            className="hm-stats"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {stats.map((s) => {
              const parsed = parseStat(s.value)
              return (
                <div key={s.label} className="hm-stat">
                  <span className="hm-stat-icon"><s.icon size={18} /></span>
                  <span className="hm-stat-value">
                    {parsed ? <><CountUp end={parsed.num} duration={2.5} />{parsed.suffix}</> : s.value}
                  </span>
                  <span className="hm-stat-label">{s.label}</span>
                </div>
              )
            })}
          </motion.div>
        )}
      </section>

      {/* ═══════════════ SERVICES MARQUEE ═══════════════ */}
      <div className="hm-services-marquee" aria-hidden="true">
        <div className="hm-services-marquee-inner">
          <div className="hm-services-track">
            {Array.from({ length: 2 }).map((_, dup) => (
              <div key={dup} className="hm-services-group">
                {[
                  'YOUTUBE',
                  'VLOG',
                  'OYUN',
                  'PODCAST',
                  'CANLI YAYIN',
                  'KISA VİDEO',
                  'BLOG',
                  'KAMERA ARKASI',
                  'SPONSORLUK',
                ].map((label, i) => (
                  <span key={`${dup}-${i}`} className="hm-services-item">
                    <span className="hm-services-star" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M12 0c.7 6.3 5.7 11.3 12 12-6.3.7-11.3 5.7-12 12-.7-6.3-5.7-11.3-12-12 6.3-.7 11.3-5.7 12-12Z"/>
                      </svg>
                    </span>
                    <span className="hm-services-label">{label}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ ABOUT BENTO ═══════════════ */}
      <section className="hm-section">
        <div className="hm-section-head">
          <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> Hakkımda</span>
          <h2 className="hm-h2">İçerik üretmek<br />benim <span className="hm-accent">#1 tutkum</span>.</h2>
        </div>

        <MagicBento columns={4} className="hm-about-bento">
          <MagicBento.Cell span={2} className="hm-bento-large">
            <div className="hm-bento-padded">
              <span className="hm-bento-eyebrow">Story</span>
              <h3 className="hm-bento-title">Kameranın hem önünde hem arkasında.</h3>
              <p className="hm-bento-text">
                Çocukluğumdan beri kameranın hem önünde hem arkasında olmayı seviyorum. İlk videomu yıllar önce yükledim ve o günden bu yana izleyicilerimle birlikte büyüyen, evrilen bir kanal kurdum.
              </p>
              <Link to="/hakkimda" className="hm-bento-link">
                Hikayemin devamı <HiOutlineArrowRight />
              </Link>
            </div>
          </MagicBento.Cell>

          <MagicBento.Cell className="hm-bento-stat">
            <div className="hm-bento-padded hm-bento-stat-inner">
              <span className="hm-bento-eyebrow">Yıl</span>
              <span className="hm-bento-bignum">{settings.statsActiveYears || '5+'}</span>
              <p className="hm-bento-meta">aktif içerik üretimi</p>
            </div>
          </MagicBento.Cell>

          <MagicBento.Cell className="hm-bento-stat">
            <div className="hm-bento-padded hm-bento-stat-inner">
              <span className="hm-bento-eyebrow">Video</span>
              <span className="hm-bento-bignum">{settings.statsTotalVideos || '380+'}</span>
              <p className="hm-bento-meta">yayında olan üretim</p>
            </div>
          </MagicBento.Cell>

          <MagicBento.Cell span={2} className="hm-bento-quote">
            <div className="hm-bento-padded">
              <span className="hm-bento-eyebrow">Felsefe</span>
              <p className="hm-bento-quote-text">
                "Her video, sıradan bir günü ilginç kılmak için yeni bir hikâye anlatma fırsatı."
              </p>
              <span className="hm-bento-quote-author">— {brandName}</span>
            </div>
          </MagicBento.Cell>

          <MagicBento.Cell span={2} className="hm-bento-image">
            <ResponsivePortrait alt="Behind the scenes" className="hm-bento-img" sizes="(max-width: 820px) 100vw, 480px" />
            <div className="hm-bento-image-tag">Behind the scenes</div>
          </MagicBento.Cell>
        </MagicBento>
      </section>

      {/* ═══════════════ FEATURED VIDEO ═══════════════ */}
      {featuredVideo && (
        <section className="hm-section">
          <div className="hm-section-head">
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> Bu hafta</span>
            <h2 className="hm-h2">Öne çıkan bölüm</h2>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hm-featured"
          >
            <TiltedCard rotateAmplitude={8} scaleOnHover={1.02} className="hm-featured-tilt">
              <GlareHover className="hm-featured-thumb" glareColor="rgba(225, 29, 46, 0.25)">
                {featuredVideo.thumbnail ? (
                  <img src={featuredVideo.thumbnail} alt={featuredVideo.title} loading="lazy" />
                ) : (
                  <div className="hm-thumb-fallback hm-thumb-fallback--lg" aria-hidden="true">
                    <span className="hm-thumb-fallback-label">EP · 042</span>
                    <span className="hm-thumb-fallback-glyph">▶</span>
                  </div>
                )}
                <div className="hm-featured-shade" />
                <div className="hm-featured-play"><HiOutlinePlay size={48} /></div>
                {featuredVideo.duration && (
                  <span className="hm-featured-duration">{parseDuration(featuredVideo.duration)}</span>
                )}
              </GlareHover>
            </TiltedCard>
            <div className="hm-featured-meta">
              <span className="hm-featured-eyebrow">{featuredVideo.publishedAt ? new Date(featuredVideo.publishedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' }) : 'Yeni'}</span>
              <h3 className="hm-featured-title">{featuredVideo.title}</h3>
              {featuredVideo.views && (
                <span className="hm-featured-views"><HiOutlineEye size={16} /> {formatViews(featuredVideo.views)} izlenme</span>
              )}
            </div>
          </a>
        </section>
      )}

      {/* ═══════════════ LATEST VIDEOS ═══════════════ */}
      <section className="hm-section">
        <div className="hm-section-head hm-section-head-row">
          <div>
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> Arşiv</span>
            <h2 className="hm-h2">Son videolar</h2>
          </div>
          <Link to="/videolar" className="hm-section-link">
            Tümünü gör <HiOutlineArrowRight />
          </Link>
        </div>

        {videosLoading ? (
          <SkeletonGrid count={4} columns={4} />
        ) : recentVideos.length > 0 ? (
          <div className="hm-video-grid">
            {recentVideos.map((v, idx) => (
              <SpotlightCard key={v.youtubeId} className="hm-video-card">
                <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="hm-video-card-link">
                  <div className="hm-video-thumb">
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt={v.title} loading="lazy" />
                    ) : (
                      <div className="hm-thumb-fallback" aria-hidden="true">
                        <span className="hm-thumb-fallback-num">{String(idx + 2).padStart(2, '0')}</span>
                      </div>
                    )}
                    <div className="hm-video-play"><HiOutlinePlay size={24} /></div>
                    {v.duration && <span className="hm-video-duration">{parseDuration(v.duration)}</span>}
                  </div>
                  <div className="hm-video-info">
                    <h4 className="hm-video-title">{v.title}</h4>
                    <div className="hm-video-meta">
                      {v.views && <span><HiOutlineEye size={14} /> {formatViews(v.views)}</span>}
                    </div>
                  </div>
                </a>
              </SpotlightCard>
            ))}
          </div>
        ) : null}
      </section>

      {/* ═══════════════ TOP VIEWED ═══════════════ */}
      {topViewedVideos.length > 0 && (
        <section className="hm-section">
          <div className="hm-section-head">
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> Favoriler</span>
            <h2 className="hm-h2">İzleyici favorileri</h2>
          </div>
          <div className="hm-top-grid">
            {topViewedVideos.map((v, i) => (
              <SpotlightCard key={v.youtubeId} className="hm-top-card">
                <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="hm-top-card-link">
                  <span className="hm-top-rank">{String(i + 1).padStart(2, '0')}</span>
                  <div className="hm-top-thumb">
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt={v.title} loading="lazy" />
                    ) : (
                      <div className="hm-thumb-fallback" aria-hidden="true">
                        <span className="hm-thumb-fallback-num">#{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                  <div className="hm-top-info">
                    <h4>{v.title}</h4>
                    <span className="hm-top-views"><HiOutlineEye size={14} /> {formatViews(v.views)} izlenme</span>
                  </div>
                </a>
              </SpotlightCard>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════ LATEST BLOG ═══════════════ */}
      {blogs.length > 0 && (
        <section className="hm-section">
          <div className="hm-section-head hm-section-head-row">
            <div>
              <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> Yazılar</span>
              <h2 className="hm-h2">Son makaleler</h2>
            </div>
            <Link to="/blog" className="hm-section-link">
              Tüm yazılar <HiOutlineArrowRight />
            </Link>
          </div>
          <div className="hm-blog-grid">
            {blogs.map((b, i) => (
              <SpotlightCard key={b._id || b.slug} className="hm-blog-card">
                <Link to={`/blog/${b.slug}`} className="hm-blog-card-link">
                  <div className="hm-blog-cover">
                    {b.cover ? (
                      <img src={b.cover} alt={b.title} loading="lazy" />
                    ) : (
                      <div className="hm-thumb-fallback hm-thumb-fallback--blog" aria-hidden="true">
                        <span className="hm-thumb-fallback-num">0{i + 1}</span>
                        <span className="hm-thumb-fallback-cat">{(b.category || 'YAZI').toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="hm-blog-info">
                    <span className="hm-blog-tag">{(b.category || 'YAZI').toUpperCase().slice(0, 14)}</span>
                    <h4 className="hm-blog-title">{b.title}</h4>
                    {b.excerpt && <p className="hm-blog-excerpt">{b.excerpt.slice(0, 120)}...</p>}
                    <span className="hm-blog-link">Devamını oku <HiOutlineArrowRight /></span>
                  </div>
                </Link>
              </SpotlightCard>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════ INSTAGRAM ═══════════════ */}
      {instagramShots.length > 0 && (
        <section className="hm-section">
          <div className="hm-section-head hm-section-head-row">
            <div>
              <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> Karelet</span>
              <h2 className="hm-h2">Instagram</h2>
            </div>
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hm-section-link">
                Profili gör <HiOutlineArrowRight />
              </a>
            )}
          </div>
          <div className="hm-ig-grid">
            {instagramShots.map((p) => (
              <a key={p.id || p.url} href={p.url} target="_blank" rel="noopener noreferrer" className="hm-ig-card">
                {p.image ? (
                  <img src={p.image} alt={p.caption || 'Instagram'} loading="lazy" />
                ) : (
                  <div className="hm-ig-placeholder"><FaInstagram size={24} /></div>
                )}
                <div className="hm-ig-overlay">
                  <FaInstagram size={22} />
                  {p.caption && <span>{p.caption}</span>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════ SOCIAL FOLLOWS ═══════════════ */}
      {socialFollows.length > 0 && (
        <section className="hm-section">
          <div className="hm-section-head">
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> Bağlan</span>
            <h2 className="hm-h2 hm-h2-vp">
              <VariableProximity
                label="Beni takip et"
                fromFontVariationSettings="'wght' 500"
                toFontVariationSettings="'wght' 900"
                radius={140}
                falloff="exponential"
              />
            </h2>
          </div>
          <div className="hm-social-grid">
            {socialFollows.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="hm-social-card">
                <span className="hm-social-icon"><s.icon size={22} /></span>
                <div className="hm-social-info">
                  <span className="hm-social-name">{s.name}</span>
                  {s.meta && <span className="hm-social-meta">{s.meta}</span>}
                </div>
                <HiOutlineArrowRight className="hm-social-arrow" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════ NEWSLETTER ═══════════════ */}
      <section className="hm-section">
        <div className="hm-newsletter">
          <div className="hm-newsletter-text">
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> Bülten</span>
            <h2 className="hm-h2">Yeni içeriklerden ilk sen haberdar ol.</h2>
            <p>E-posta listeme katıl; spam yok, sadece önemli güncellemeler.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="hm-section">
        <div className="hm-section-head hm-section-head-center">
          <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> SSS</span>
          <h2 className="hm-h2">Sıkça sorulanlar</h2>
          <p className="hm-section-sub">Aklındaki sorunun cevabı burada yoksa iletişim sayfasından bana yaz.</p>
        </div>
        <div className="hm-faq-list">
          {faqs.map((f, i) => <FAQItem key={i} faq={f} />)}
        </div>
      </section>

      {/* ═══════════════ VELOCITY STRIP ═══════════════ */}
      <section className="hm-velocity" aria-hidden="true">
        <ScrollVelocity
          texts={[`${brandName} • Hikâye anlatıcısı • İstanbul •`, 'Vlog • Oyun • Eğlence • Macera •']}
          velocity={60}
        />
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="hm-section hm-section-cta">
        <div className="hm-cta">
          <div className="hm-cta-glow" />
          <div className="hm-cta-text">
            <span className="hm-eyebrow hm-eyebrow-light"><span className="hm-eyebrow-dot" /> Hadi tanışalım</span>
            <h2 className="hm-h2 hm-cta-title">Bir iş birliği,<br />bir mesaj uzağında.</h2>
            <p>Sponsorluk, iş birliği veya sadece selam için — her zaman açığım.</p>
          </div>
          <Magnet padding={90} magnetStrength={0.35}>
            <Link to="/iletisim" className="hm-btn hm-btn-primary hm-btn-lg">
              İletişime geç <HiOutlineArrowRight />
            </Link>
          </Magnet>
        </div>
      </section>
    </div>
  )
}
