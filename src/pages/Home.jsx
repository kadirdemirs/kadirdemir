import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaTwitch,
  FaXTwitter,
} from 'react-icons/fa6'
<<<<<<< HEAD
import {
  HiOutlinePlay,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlineVideoCamera,
  HiOutlineChevronDown,
  HiOutlineRocketLaunch,
  HiOutlineMicrophone,
  HiOutlineQuestionMarkCircle,
  HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2'
import { useEffect, useMemo, useState } from 'react'
=======
>>>>>>> 6a06c4288b8cbad782f31de936e249b1c66a82a7
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { PersonSchema, FAQSchema, VideoSchema, WebSiteSchema } from '../components/StructuredData'
import CountUp from '../components/CountUp'
import NewsletterForm from '../components/NewsletterForm'
import {
  getYouTubeVideosApi, getBlogsApi, getSocialStatsApi,
} from '../api'
import './Home.css'

/* ──────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────── */
function parseStat(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    if (value >= 1e9) return { num: +(value / 1e9).toFixed(1), suffix: 'B' }
    if (value >= 1e6) return { num: +(value / 1e6).toFixed(1), suffix: 'M' }
    if (value >= 1e3) return { num: +(value / 1e3).toFixed(1), suffix: 'K' }
    return { num: value, suffix: '' }
  }
  const m = String(value).trim().match(/^([\d.,]+)\s*([KMB])?(.*)$/i)
  if (!m) return null
  const raw = m[1]
  let normalized = raw
  if (raw.includes(',') && raw.includes('.')) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) normalized = raw.replace(/\./g, '').replace(',', '.')
    else normalized = raw.replace(/,/g, '')
  } else if (raw.includes(',')) {
    if (/^\d+,\d{1,2}$/.test(raw)) normalized = raw.replace(',', '.')
    else normalized = raw.replace(/,/g, '')
  }
  const num = parseFloat(normalized)
  if (!Number.isFinite(num)) return null
  return { num, suffix: (m[2] || '').toUpperCase() + (m[3] || '') }
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

/* Editorial helper: ─── label ─── */
function GiantEyebrow({ children }) {
  return (
    <span className="g-eyebrow">
      <span className="g-eyebrow-rule" />
      <span className="g-eyebrow-label">{children}</span>
      <span className="g-eyebrow-rule" />
    </span>
  )
}

function GiantSectionHead({ eyebrow, title, sub }) {
  return (
    <header className="g-section-head">
      <GiantEyebrow>{eyebrow}</GiantEyebrow>
      <h2 className="g-section-title">{title}</h2>
      {sub && <p className="g-section-sub">{sub}</p>}
    </header>
  )
}

export default function Home() {
  const { settings } = useSiteSettings()
  const { t, lang } = useLanguage()
  const [videos, setVideos] = useState([])
  const [blogs, setBlogs] = useState([])
  const [socialStats, setSocialStats] = useState(null)

  useSEO({
    title: settings.seoTitle || 'Kadir Demir | YouTube İçerik Üreticisi',
    description: settings.seoDescription || settings.description,
    keywords: settings.seoKeywords,
    path: '/',
  })

  useEffect(() => {
    getYouTubeVideosApi().then((res) => { if (res?.videos?.length) setVideos(res.videos) }).catch(() => {})
    getBlogsApi().then((res) => {
      const list = Array.isArray(res?.blogs) ? res.blogs : Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
      const filtered = list.filter((b) => !b?.draft && b?.published !== false).slice(0, 3)
      setBlogs(filtered)
    }).catch(() => {})
    getSocialStatsApi().then((data) => setSocialStats(data)).catch(() => {})
  }, [])

  const brandName = settings.businessName || 'Kadir Demir'
  const subscribeUrl = `${settings.youtube || 'https://youtube.com/@kadirdemir'}?sub_confirmation=1`

  /* Live stats */
  const ytLive = socialStats?.youtube
  const igLive = socialStats?.instagram
  const ttLive = socialStats?.tiktok
  const ytSubs = ytLive?.followersDisplay || settings.statsYoutubeSubs
  const ytViews = ytLive?.viewsDisplay || settings.statsTotalViews
  const ytVideosCount = ytLive?.videosDisplay || settings.statsTotalVideos
  const igFollowers = igLive?.followersDisplay || settings.statsInstagramFollowers
  const ttFollowers = ttLive?.followersDisplay || settings.statsTiktokFollowers
  const activeYears = settings.statsActiveYears

  /* WORKS — 6 video for the 3x2 grid */
  const works = videos.slice(0, 6)

  /* FAQs — kept for schema only (Giant has no FAQ section, so we drop UI) */
  const localizedFaqs = useMemo(() => ([
    { q: 'Yeni videoları ne sıklıkla yüklüyorsun?', a: 'Haftada 2-3 yeni video.' },
    { q: 'Sponsorluklara açık mısın?', a: 'Evet, uzun vadeli iş birliklerine açığım.' },
    { q: 'Hangi günler video yayınlıyorsun?', a: 'Salı, Perşembe, Cumartesi.' },
  ]), [])

  /* ABOUT — number + paragraph (Giant: 41 of Service) */
  const aboutNumber = activeYears || '5'
  const aboutLabel = lang === 'en' ? 'years of storytelling' : lang === 'de' ? 'Jahre Storytelling' : 'yıllık hikâye anlatımı'
  const aboutText = settings.description
    || (lang === 'en'
      ? 'Vlog, gaming and entertainment. I create content from Istanbul — telling stories about places visited, games played and life lived.'
      : lang === 'de'
        ? 'Vlog, Gaming und Unterhaltung. Inhalte aus Istanbul — Geschichten über besuchte Orte, gespielte Spiele und gelebtes Leben.'
        : 'Vlog, oyun ve eğlence. İstanbul’dan içerik üretiyorum — gezdiğim yerler, oynadığım oyunlar, yaşadığım anlar hakkında kısa hikâyeler anlatıyorum.')

  /* KNOW-HOW — 4 skill rows (Giant: HTML5/CSS3/jQuery/PHP) */
  const knowHow = [
    { label: lang === 'en' ? 'Vlog & Storytelling' : 'Vlog & Hikâye anlatımı', value: 95 },
    { label: lang === 'en' ? 'Editing & Color' : 'Kurgu & Renk', value: 88 },
    { label: lang === 'en' ? 'Gaming & Live' : 'Oyun & Canlı yayın', value: 82 },
    { label: lang === 'en' ? 'Brand collaborations' : 'Marka iş birlikleri', value: 90 },
  ]

  /* SERVICES — 3 numbered columns (Giant: Design / Branding / Brand Identity) */
  const services = [
    {
      n: '1',
      title: lang === 'en' ? 'CONTENT' : 'İÇERİK',
      body: lang === 'en'
        ? 'Vlogs, gaming streams, short-form. Story-driven shoots and edits that hold attention from cold-open to outro.'
        : 'Vlog, oyun yayını, kısa video. Soğuk açılıştan kapanışa dikkat tutan hikâye odaklı çekim ve kurgu.',
      sub: [lang === 'en' ? 'Vlog' : 'Vlog', lang === 'en' ? 'Gaming' : 'Oyun', lang === 'en' ? 'Shorts' : 'Kısa video'],
    },
    {
      n: '2',
      title: lang === 'en' ? 'COLLABS' : 'İŞ BİRLİĞİ',
      body: lang === 'en'
        ? 'Brand integrations that don\'t feel like ads. Concept, script, shoot, edit and post — one creator, one voice.'
        : 'Reklam gibi durmayan marka entegrasyonları. Konsept, senaryo, çekim, kurgu ve yayın — tek üretici, tek ses.',
      sub: [lang === 'en' ? 'Sponsorship' : 'Sponsorluk', lang === 'en' ? 'Integration' : 'Entegrasyon', lang === 'en' ? 'Long-term' : 'Uzun vadeli'],
    },
    {
      n: '3',
      title: lang === 'en' ? 'STUDIO' : 'STÜDYO',
      body: lang === 'en'
        ? 'Kade Media — small team, sharp briefs, clean deadlines. Production for creators and brands.'
        : 'Kade Media — küçük ekip, net brief, temiz deadline. İçerik üreticileri ve markalar için prodüksiyon.',
      sub: ['Kade Media', lang === 'en' ? 'Production' : 'Prodüksiyon', lang === 'en' ? 'Editing' : 'Kurgu'],
    },
  ]

  /* TESTIMONIALS — 4 short quotes (Giant style) */
  const testimonials = [
    {
      quote: lang === 'en'
        ? 'Natural storytelling that didn\'t feel like an ad.'
        : 'Reklam gibi durmayan doğal bir anlatım.',
      author: lang === 'en' ? '— Mobile game studio' : '— Mobil oyun stüdyosu',
    },
    {
      quote: lang === 'en'
        ? 'Each video feels like an evening with a friend.'
        : 'Her bölüm bir arkadaşla geçirilen akşam gibi.',
      author: lang === 'en' ? '— Long-time viewer' : '— Uzun süreli izleyici',
    },
    {
      quote: lang === 'en'
        ? 'Clean brief, clear deadlines, sharp result.'
        : 'Net brief, net deadline, keskin sonuç.',
      author: lang === 'en' ? '— Influencer agency' : '— Influencer ajansı',
    },
    {
      quote: lang === 'en'
        ? 'Most professional creator we worked with this year.'
        : 'Bu yıl çalıştığımız en profesyonel içerik üreticisi.',
      author: lang === 'en' ? '— Brand manager' : '— Marka yöneticisi',
    },
  ]

  /* THE STORY — timeline (Giant: UX Designer / Web Designer / Graphic Designer) */
  const story = [
    {
      period: lang === 'en' ? '2024 — Present' : '2024 — Bugün',
      role: lang === 'en' ? 'CREATOR & FOUNDER' : 'İÇERİK ÜRETİCİSİ & KURUCU',
      sub: 'Kade Media',
      body: lang === 'en'
        ? 'Building Kade Media — production house for creators and brands. Long-form, sponsorship, post production.'
        : 'Kade Media’yı kuruyorum — içerik üreticileri ve markalar için prodüksiyon evi. Uzun form, sponsorluk, post prodüksiyon.',
    },
    {
      period: lang === 'en' ? '2021 — 2024' : '2021 — 2024',
      role: lang === 'en' ? 'FULL-TIME CREATOR' : 'TAM ZAMANLI İÇERİK ÜRETİCİSİ',
      sub: 'YouTube · Instagram · TikTok',
      body: lang === 'en'
        ? 'Vlogs, gaming and entertainment as full-time. Three platforms, one voice. Audience grew across all three.'
        : 'Tam zamanlı vlog, oyun ve eğlence. Üç platform, tek ses. İzleyici tabanı üçünde de büyüdü.',
    },
    {
      period: lang === 'en' ? '2019 — 2021' : '2019 — 2021',
      role: lang === 'en' ? 'STARTED THE CHANNEL' : 'KANALI AÇTI',
      sub: lang === 'en' ? 'First videos' : 'İlk videolar',
      body: lang === 'en'
        ? 'Picked up a camera, started telling stories from Istanbul. Learned editing, sound and color on the way.'
        : 'Bir kamera aldım, İstanbul’dan hikâyeler anlatmaya başladım. Kurgu, ses ve rengi yolda öğrendim.',
    },
  ]

  return (
    <div className="g">
      <PersonSchema socials={settings} />
      <WebSiteSchema />
      <FAQSchema items={localizedFaqs} />
      {videos.length > 0 && <VideoSchema videos={videos.slice(0, 8)} />}

      {/* ════════════════ 1 · HERO ════════════════ */}
      <section className="g-hero" id="home">
        <div className="g-hero-bg" aria-hidden="true">
          <img src="/kadelink-portrait.png" alt="" />
          <div className="g-hero-veil" />
        </div>
        <div className="g-hero-inner">
          <span className="g-hero-mark">{(brandName.split(' ')[0] || 'K')[0]}<sup>®</sup></span>
          <h1 className="g-hero-title">
            {lang === 'en' ? 'Stories, on screen.' : lang === 'de' ? 'Geschichten, auf dem Bildschirm.' : 'Hikâyeler, ekranda.'}
          </h1>
          <ul className="g-hero-taglines">
            <li>{lang === 'en' ? 'Video is a process' : 'Video bir süreçtir'}</li>
            <li>{lang === 'en' ? 'Storytelling is a decision' : 'Anlatım bir karardır'}</li>
            <li>{lang === 'en' ? 'Audience is everything' : 'İzleyici her şeydir'}</li>
          </ul>
          <a href="#about" className="g-hero-scroll" aria-label="Scroll">
            <span />
          </a>
        </div>
      </section>

      {/* ════════════════ 2 · ABOUT ════════════════ */}
      <section className="g-section g-about" id="about">
        <GiantSectionHead eyebrow={lang === 'en' ? 'ABOUT' : 'HAKKIMDA'} />
        <div className="g-about-grid">
          <div className="g-about-num">
            <span className="g-about-num-frame">
              <strong>{aboutNumber}</strong>
              <em>{aboutLabel}</em>
            </span>
          </div>
          <div className="g-about-body">
            <span className="g-quote g-quote-open">“</span>
            <p>{aboutText}</p>
            <span className="g-quote g-quote-close">”</span>
            <p className="g-about-sign">— {brandName}</p>
          </div>
        </div>
      </section>

      {/* ════════════════ 3 · THE KNOW-HOW ════════════════ */}
      <section className="g-section g-knowhow">
        <GiantSectionHead eyebrow={lang === 'en' ? 'THE KNOW-HOW' : 'YETKİNLİK'} />
        <div className="g-knowhow-grid">
          <div className="g-knowhow-img">
            <img src="/kadir.jpg" alt="" loading="lazy" />
          </div>
          <ul className="g-knowhow-list">
            {knowHow.map((k) => (
              <li key={k.label} className="g-knowhow-row">
                <div className="g-knowhow-meta">
                  <span>{k.label}</span>
                  <strong>{k.value}%</strong>
                </div>
                <div className="g-knowhow-bar"><span style={{ width: `${k.value}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ════════════════ 4 · GOING LIVE IN / STATS ════════════════ */}
      <section className="g-section g-stats-wrap">
        <div className="g-stats-bg" aria-hidden="true">
          <img src="/kadelink-portrait.png" alt="" />
          <div className="g-stats-veil" />
        </div>
        <div className="g-stats-inner">
          <span className="g-eyebrow g-eyebrow-light">
            <span className="g-eyebrow-rule" />
            <span className="g-eyebrow-label">{lang === 'en' ? 'BY THE NUMBERS' : 'RAKAMLARLA'}</span>
            <span className="g-eyebrow-rule" />
          </span>
          <h2 className="g-stats-title">
            {lang === 'en' ? 'Going live, every week.' : 'Her hafta, yayında.'}
          </h2>
          <div className="g-stats-row">
            {[
              ytSubs && { value: ytSubs, label: lang === 'en' ? 'YT SUBS' : 'YT ABONE' },
              ttFollowers && { value: ttFollowers, label: lang === 'en' ? 'TIKTOK' : 'TIKTOK' },
              igFollowers && { value: igFollowers, label: 'INSTAGRAM' },
              ytViews && { value: ytViews, label: lang === 'en' ? 'VIEWS' : 'İZLENME' },
              ytVideosCount && { value: ytVideosCount, label: lang === 'en' ? 'VIDEOS' : 'VİDEO' },
            ].filter(Boolean).slice(0, 4).map((s, i, arr) => {
              const parsed = parseStat(s.value)
              return (
                <div key={s.label} className="g-stat" style={{ '--g-stat-i': i, '--g-stat-n': arr.length }}>
                  <span className="g-stat-value">
                    {parsed ? <><CountUp end={parsed.num} duration={2.4} />{parsed.suffix}</> : s.value}
                  </span>
                  <span className="g-stat-label">{s.label}</span>
                </div>
              )
            })}
<<<<<<< HEAD
          </motion.div>
        )}
      </section>

      {/* ═══════════════ ABOUT BENTO ═══════════════ */}
      <section className="hm-section">
        <div className="hm-section-head">
          <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.aboutEyebrow')}</span>
          <h2 className="hm-h2">{t('home.aboutTitleA')}<br />{t('home.aboutTitleB')} <span className="hm-accent">{t('home.aboutTitleC')}</span>.</h2>
        </div>

        <MagicBento columns={4} className="hm-about-bento">
          <MagicBento.Cell span={2} className="hm-bento-large">
            <div className="hm-bento-padded">
              <span className="hm-bento-eyebrow">{t('home.aboutStory')}</span>
              <h3 className="hm-bento-title">{t('home.aboutStoryTitle')}</h3>
              <p className="hm-bento-text">{t('home.aboutStoryText')}</p>
              <Link to="/hakkimda" className="hm-bento-link">
                {t('home.aboutStoryLink')} <HiOutlineArrowRight />
              </Link>
            </div>
          </MagicBento.Cell>

          {settings.statsActiveYears && (
            <MagicBento.Cell className="hm-bento-stat">
              <div className="hm-bento-padded hm-bento-stat-inner">
                <span className="hm-bento-eyebrow">{t('home.aboutYear')}</span>
                <span className="hm-bento-bignum">{settings.statsActiveYears}</span>
                <p className="hm-bento-meta">{t('home.aboutYearMeta')}</p>
              </div>
            </MagicBento.Cell>
          )}

          {(ytVideosCount || settings.statsTotalVideos) && (
            <MagicBento.Cell className="hm-bento-stat">
              <div className="hm-bento-padded hm-bento-stat-inner">
                <span className="hm-bento-eyebrow">{t('home.aboutVideo')}</span>
                <span className="hm-bento-bignum">{ytVideosCount || settings.statsTotalVideos}</span>
                <p className="hm-bento-meta">{t('home.aboutVideoMeta')}</p>
              </div>
            </MagicBento.Cell>
          )}

          <MagicBento.Cell span={2} className="hm-bento-quote">
            <div className="hm-bento-padded">
              <span className="hm-bento-eyebrow">{t('home.aboutPhilosophy')}</span>
              <p className="hm-bento-quote-text">{t('home.aboutQuote')}</p>
              <span className="hm-bento-quote-author">— {brandName}</span>
            </div>
          </MagicBento.Cell>

          <MagicBento.Cell span={2} className="hm-bento-image">
            <ResponsivePortrait alt={`${brandName} — behind the scenes`} className="hm-bento-img" sizes="(max-width: 820px) 100vw, 480px" />
            <div className="hm-bento-image-tag">{lang === 'tr' ? 'Kamera arkası' : lang === 'de' ? 'Behind the Scenes' : 'Behind the scenes'}</div>
          </MagicBento.Cell>
        </MagicBento>
      </section>

      {/* ═══════════════ FEATURED VIDEO ═══════════════ */}
      {featuredVideo && (
        <section className="hm-section">
          <div className="hm-section-head">
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.featuredEyebrow')}</span>
            <h2 className="hm-h2">{t('home.featuredTitle')}</h2>
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
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.latestEyebrow')}</span>
            <h2 className="hm-h2">{t('home.latestTitle')}</h2>
          </div>
          <Link to="/videolar" className="hm-section-link">
            {t('home.latestViewAll')} <HiOutlineArrowRight />
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
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.topViewedEyebrow')}</span>
            <h2 className="hm-h2">{t('home.topViewedTitle')}</h2>
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
              <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.blogEyebrow')}</span>
              <h2 className="hm-h2">{t('home.blogTitle')}</h2>
            </div>
            <Link to="/blog" className="hm-section-link">
              {t('home.blogViewAll')} <HiOutlineArrowRight />
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
              <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.igEyebrow')}</span>
              <h2 className="hm-h2">{t('home.igTitle')}</h2>
            </div>
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hm-section-link">
                {t('home.igViewProfile')} <HiOutlineArrowRight />
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

      {/* ═══════════════ SOCIAL MEDIA STATS DASHBOARD ═══════════════ */}
      <section className="hm-section">
        <div className="hm-section-head">
          <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.platformsEyebrow')}</span>
          <h2 className="hm-h2">{t('home.platformsTitleA')}<br />{t('home.platformsTitleB')}</h2>
          <p className="hm-section-sub">{t('home.platformsSub')}</p>
        </div>

        <div className="hm-platform-grid">
          {/* YouTube */}
          {settings.youtube && (
            <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="hm-platform-card hm-platform-yt">
              <div className="hm-platform-glow" aria-hidden="true" />
              <div className="hm-platform-head">
                <span className="hm-platform-icon"><FaYoutube size={28} /></span>
                <div>
                  <h3 className="hm-platform-name">YouTube</h3>
                  <span className="hm-platform-handle">{settings.youtubeHandle || '@kadirdemir'}{ytLive ? ` ${t('home.platformsLive')}` : ''}</span>
                </div>
              </div>
              <div className="hm-platform-stats">
                {ytSubs && (
                  <div className="hm-platform-stat">
                    <span className="hm-platform-stat-num">
                      {(() => { const p = parseStat(ytSubs); return p ? <><CountUp end={p.num} duration={2.2} />{p.suffix}</> : ytSubs })()}
                    </span>
                    <span className="hm-platform-stat-lbl">{t('home.platformsSub_yt')}</span>
                  </div>
                )}
                {ytViews && (
                  <div className="hm-platform-stat">
                    <span className="hm-platform-stat-num">
                      {(() => { const p = parseStat(ytViews); return p ? <><CountUp end={p.num} duration={2.2} />{p.suffix}</> : ytViews })()}
                    </span>
                    <span className="hm-platform-stat-lbl">{t('home.platformsSub_views')}</span>
                  </div>
                )}
                {ytVideosCount && (
                  <div className="hm-platform-stat">
                    <span className="hm-platform-stat-num">
                      {(() => { const p = parseStat(ytVideosCount); return p ? <><CountUp end={p.num} duration={2.2} />{p.suffix}</> : ytVideosCount })()}
                    </span>
                    <span className="hm-platform-stat-lbl">{t('home.platformsSub_videos')}</span>
                  </div>
                )}
              </div>
              <span className="hm-platform-cta">{t('home.platformsCta_yt')} <HiOutlineArrowRight /></span>
            </a>
          )}

          {/* Instagram */}
          {settings.instagram && (
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hm-platform-card hm-platform-ig">
              <div className="hm-platform-glow" aria-hidden="true" />
              <div className="hm-platform-head">
                <span className="hm-platform-icon"><FaInstagram size={28} /></span>
                <div>
                  <h3 className="hm-platform-name">Instagram</h3>
                  <span className="hm-platform-handle">{settings.instagramHandle || '@kadirardademir'}{igLive ? ` ${t('home.platformsLive')}` : ''}</span>
                </div>
              </div>
              <div className="hm-platform-stats">
                {igFollowers && (
                  <div className="hm-platform-stat">
                    <span className="hm-platform-stat-num">
                      {(() => { const p = parseStat(igFollowers); return p ? <><CountUp end={p.num} duration={2.2} />{p.suffix}</> : igFollowers })()}
                    </span>
                    <span className="hm-platform-stat-lbl">{t('home.platformsSub_followers')}</span>
                  </div>
                )}
                {igPostsCount && (
                  <div className="hm-platform-stat">
                    <span className="hm-platform-stat-num">
                      {(() => { const p = parseStat(igPostsCount); return p ? <><CountUp end={p.num} duration={2.2} />{p.suffix}</> : igPostsCount })()}
                    </span>
                    <span className="hm-platform-stat-lbl">{t('home.platformsSub_posts')}</span>
                  </div>
                )}
              </div>
              <span className="hm-platform-cta">{t('home.platformsCta_ig')} <HiOutlineArrowRight /></span>
            </a>
          )}

          {/* TikTok */}
          {settings.tiktok && (
            <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="hm-platform-card hm-platform-tt">
              <div className="hm-platform-glow" aria-hidden="true" />
              <div className="hm-platform-head">
                <span className="hm-platform-icon"><FaTiktok size={28} /></span>
                <div>
                  <h3 className="hm-platform-name">TikTok</h3>
                  <span className="hm-platform-handle">{settings.tiktokHandle || '@kadirdemirs'}{ttLive ? ` ${t('home.platformsLive')}` : ''}</span>
                </div>
              </div>
              <div className="hm-platform-stats">
                {ttFollowers && (
                  <div className="hm-platform-stat">
                    <span className="hm-platform-stat-num">
                      {(() => { const p = parseStat(ttFollowers); return p ? <><CountUp end={p.num} duration={2.2} />{p.suffix}</> : ttFollowers })()}
                    </span>
                    <span className="hm-platform-stat-lbl">{t('home.platformsSub_followers')}</span>
                  </div>
                )}
                {ttLikes && (
                  <div className="hm-platform-stat">
                    <span className="hm-platform-stat-num">
                      {(() => { const p = parseStat(ttLikes); return p ? <><CountUp end={p.num} duration={2.2} />{p.suffix}</> : ttLikes })()}
                    </span>
                    <span className="hm-platform-stat-lbl">{t('home.platformsSub_likes')}</span>
                  </div>
                )}
              </div>
              <span className="hm-platform-cta">{t('home.platformsCta_tt')} <HiOutlineArrowRight /></span>
            </a>
          )}
        </div>
      </section>

      {/* ═══════════════ SOCIAL FOLLOWS ═══════════════ */}
      {socialFollows.length > 0 && (
        <section className="hm-section">
          <div className="hm-section-head">
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.socialEyebrow')}</span>
            <h2 className="hm-h2 hm-h2-vp">
              <VariableProximity
                key={`vp-${lang}`}
                label={t('home.socialTitle')}
                fromFontVariationSettings="'wght' 500"
                toFontVariationSettings="'wght' 900"
                radius={140}
                falloff="exponential"
              />
            </h2>
          </div>
          <div className="hm-social-grid">
            {socialFollows.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hm-social-card"
                style={{ '--social-color': s.color }}
              >
                <span className="hm-social-icon" style={{ color: s.color }}><s.icon size={22} /></span>
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
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.newsletterEyebrow')}</span>
            <h2 className="hm-h2">{t('home.newsletterTitle')}</h2>
            <p>{t('home.newsletterSub')}</p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="hm-section">
        <div className="hm-section-head hm-section-head-center">
          <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.faqEyebrow')}</span>
          <h2 className="hm-h2">{t('home.faqTitle')}</h2>
          <p className="hm-section-sub">{t('home.faqSub')}</p>
        </div>
        <div className="hm-faq-list">
          {localizedFaqs.map((f, i) => <FAQItem key={`${lang}-${i}`} faq={f} />)}
        </div>
      </section>

      {/* ═══════════════ MILESTONES ═══════════════ */}
      {(ytSubs || ytViews || ytVideosCount || igFollowers || ttFollowers) && (
        <section className="hm-section">
          <div className="hm-section-head">
            <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.milestoneEyebrow')}</span>
            <h2 className="hm-h2">{t('home.milestoneTitle')}</h2>
            <p className="hm-section-sub">{t('home.milestoneSub')}</p>
          </div>
          <div className="hm-milestones">
            {[
              ytSubs && { value: ytSubs, label: t('home.statsYoutube'), color: '#FF0000' },
              ttFollowers && { value: ttFollowers, label: t('home.statsTiktok'), color: '#00F2EA' },
              igFollowers && { value: igFollowers, label: t('home.statsInstagram'), color: '#E4405F' },
              ytViews && { value: ytViews, label: t('home.statsViews'), color: '#f59e0b' },
              ytVideosCount && { value: ytVideosCount, label: t('home.statsVideos'), color: '#a855f7' },
            ].filter(Boolean).map((m, i) => (
              <div key={m.label} className="hm-milestone" style={{ '--milestone-color': m.color, animationDelay: `${i * 0.08}s` }}>
                <span className="hm-milestone-dot" aria-hidden="true" />
                <span className="hm-milestone-value">{m.value}</span>
                <span className="hm-milestone-label">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════ EXPLORE / QUICK ACCESS ═══════════════ */}
      <section className="hm-section">
        <div className="hm-section-head">
          <span className="hm-eyebrow"><span className="hm-eyebrow-dot" /> {t('home.exploreEyebrow')}</span>
          <h2 className="hm-h2">{t('home.exploreTitle')}</h2>
          <p className="hm-section-sub">{t('home.exploreSub')}</p>
        </div>
        <div className="hm-explore-grid">
          {[
            { to: '/videolar', icon: HiOutlineVideoCamera, title: t('home.exploreVideosTitle'), desc: t('home.exploreVideosDesc'), color: '#FF0000' },
            { to: '/setup', icon: HiOutlineWrenchScrewdriver, title: t('home.exploreSetupTitle'), desc: t('home.exploreSetupDesc'), color: '#06b6d4' },
            { to: '/sor', icon: HiOutlineQuestionMarkCircle, title: t('home.exploreAmaTitle'), desc: t('home.exploreAmaDesc'), color: '#a855f7' },
            { to: '/sponsor', icon: HiOutlineRocketLaunch, title: t('home.exploreSponsorTitle'), desc: t('home.exploreSponsorDesc'), color: '#f59e0b' },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="hm-explore-card" style={{ '--ex-color': c.color }}>
              <span className="hm-explore-icon" aria-hidden="true"><c.icon size={26} /></span>
              <h3 className="hm-explore-title">{c.title}</h3>
              <p className="hm-explore-desc">{c.desc}</p>
              <span className="hm-explore-arrow" aria-hidden="true"><HiOutlineArrowRight /></span>
            </Link>
=======
          </div>
        </div>
      </section>

      {/* ════════════════ 5 · SERVICES (1 / 2 / 3) ════════════════ */}
      <section className="g-section g-services">
        <GiantSectionHead eyebrow={lang === 'en' ? 'SERVICES' : 'HİZMETLER'} />
        <div className="g-services-grid">
          {services.map((s) => (
            <article key={s.n} className="g-service">
              <span className="g-service-num">{s.n}</span>
              <h3 className="g-service-title">{s.title}</h3>
              <p className="g-service-body">{s.body}</p>
              <ul className="g-service-sub">
                {s.sub.map((it) => <li key={it}>{it}</li>)}
              </ul>
              <Link to="/iletisim" className="g-service-link">
                {lang === 'en' ? 'Read more' : 'Devamını oku'}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ════════════════ 6 · TESTIMONIALS ════════════════ */}
      <section className="g-section g-testimonials">
        <GiantSectionHead eyebrow={lang === 'en' ? 'TESTIMONIALS' : 'SÖYLEDİKLERİ'} />
        <div className="g-testimonials-row">
          {testimonials.map((tt, i) => (
            <figure key={i} className="g-testimonial">
              <span className="g-testimonial-avatar" aria-hidden="true">"</span>
              <blockquote>{tt.quote}</blockquote>
              <figcaption>{tt.author}</figcaption>
            </figure>
>>>>>>> 6a06c4288b8cbad782f31de936e249b1c66a82a7
          ))}
        </div>
      </section>

<<<<<<< HEAD
      {/* ═══════════════ VELOCITY STRIP ═══════════════ */}
      <section className="hm-velocity" aria-hidden="true">
        <ScrollVelocity
          key={`vel-${lang}`}
          texts={[
            lang === 'en'
              ? `${brandName} • Content Creator • Istanbul •`
              : lang === 'de'
              ? `${brandName} • Content Creator • Istanbul •`
              : `${brandName} • İçerik Üreticisi • İstanbul •`,
            lang === 'en'
              ? 'Vlog • Gaming • Entertainment • Adventure •'
              : lang === 'de'
              ? 'Vlog • Gaming • Unterhaltung • Abenteuer •'
              : 'Vlog • Oyun • Eğlence • Macera •',
          ]}
          velocity={60}
        />
=======
      {/* ════════════════ 7 · WORKS (3x2 grid) ════════════════ */}
      {works.length > 0 && (
        <section className="g-section g-works-wrap">
          <GiantSectionHead eyebrow={lang === 'en' ? 'WORKS' : 'İŞLER'} />
          <div className="g-works-grid">
            {works.map((v, i) => (
              <a
                key={v.youtubeId || i}
                href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="g-work"
              >
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt={v.title} loading="lazy" />
                ) : (
                  <div className="g-work-fallback">{String(i + 1).padStart(2, '0')}</div>
                )}
                <div className="g-work-overlay">
                  <span className="g-work-cat">
                    {(v.category || (lang === 'en' ? 'VIDEO' : 'VİDEO')).toUpperCase()}
                  </span>
                  <h4 className="g-work-title">{v.title}</h4>
                  <span className="g-work-cta">
                    {lang === 'en' ? 'VIEW PROJECT' : 'PROJEYİ GÖR'}
                  </span>
                  {v.views && <span className="g-work-views">{formatViews(v.views)} {lang === 'en' ? 'views' : 'izlenme'}</span>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════ 8 · THE STORY (timeline) ════════════════ */}
      <section className="g-section g-story">
        <GiantSectionHead eyebrow={lang === 'en' ? 'THE STORY' : 'HİKÂYE'} />
        <div className="g-story-list">
          {story.map((s, i) => (
            <article key={i} className={`g-story-row ${i % 2 ? 'is-right' : 'is-left'}`}>
              <div className="g-story-meta">
                <span className="g-story-period">{s.period}</span>
              </div>
              <div className="g-story-body">
                <h3 className="g-story-role">{s.role}</h3>
                <span className="g-story-sub">{s.sub}</span>
                <p>{s.body}</p>
              </div>
              <div className="g-story-portrait" aria-hidden="true">
                <span>{String(story.length - i).padStart(2, '0')}</span>
              </div>
            </article>
          ))}
        </div>
>>>>>>> 6a06c4288b8cbad782f31de936e249b1c66a82a7
      </section>

      {/* ════════════════ 9 · CONTACT (dark band) ════════════════ */}
      <section className="g-contact" id="contact">
        <div className="g-contact-bg" aria-hidden="true">
          <img src="/kadelink-portrait.png" alt="" />
          <div className="g-contact-veil" />
        </div>
        <div className="g-contact-inner">
          <span className="g-eyebrow g-eyebrow-light">
            <span className="g-eyebrow-rule" />
            <span className="g-eyebrow-label">{lang === 'en' ? 'CONTACT' : 'İLETİŞİM'}</span>
            <span className="g-eyebrow-rule" />
          </span>
          <h2 className="g-contact-title">{lang === 'en' ? 'Let’s make something.' : 'Hadi bir şey üretelim.'}</h2>
          <div className="g-contact-grid">
            <div className="g-contact-cell">
              <span className="g-contact-label">{lang === 'en' ? 'STUDIO' : 'STÜDYO'}</span>
              <p>Kade Media<br />İstanbul, TR</p>
            </div>
            <div className="g-contact-cell">
              <span className="g-contact-label">{lang === 'en' ? 'EMAIL' : 'E-POSTA'}</span>
              <a href={`mailto:${settings.businessEmail || 'thekademedia@gmail.com'}`}>
                {settings.businessEmail || 'thekademedia@gmail.com'}
              </a>
            </div>
            <div className="g-contact-cell">
              <span className="g-contact-label">{lang === 'en' ? 'SOCIAL' : 'SOSYAL'}</span>
              <div className="g-contact-socials">
                {settings.youtube && <a href={settings.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube size={18} /></a>}
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram size={18} /></a>}
                {settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><FaTiktok size={18} /></a>}
                {settings.twitter && <a href={settings.twitter} target="_blank" rel="noopener noreferrer" aria-label="X"><FaXTwitter size={18} /></a>}
                {settings.twitch && <a href={settings.twitch} target="_blank" rel="noopener noreferrer" aria-label="Twitch"><FaTwitch size={18} /></a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ 10 · GET IN TOUCH (minimal form) ════════════════ */}
      <section className="g-section g-touch">
        <GiantSectionHead eyebrow={lang === 'en' ? 'GET IN TOUCH' : 'BANA YAZ'} />
        <form className="g-touch-form" onSubmit={(e) => { e.preventDefault(); window.location.href = '/iletisim' }}>
          <div className="g-touch-row">
            <label><span>{lang === 'en' ? 'NAME' : 'AD'}</span><input type="text" required /></label>
            <label><span>EMAIL</span><input type="email" required /></label>
            <label><span>{lang === 'en' ? 'TOPIC' : 'KONU'}</span><input type="text" /></label>
          </div>
          <label className="g-touch-message"><span>{lang === 'en' ? 'MESSAGE' : 'MESAJ'}</span><textarea rows={4} /></label>
          <button type="submit" className="g-touch-submit">{lang === 'en' ? 'SUBMIT' : 'GÖNDER'}</button>
        </form>
      </section>

      {/* Latest blogs strip — optional, keeps content discovery */}
      {blogs.length > 0 && (
        <section className="g-section g-blogs">
          <GiantSectionHead eyebrow={lang === 'en' ? 'LATEST WRITING' : 'SON YAZILAR'} />
          <div className="g-blogs-row">
            {blogs.map((b, i) => (
              <Link key={b._id || b.slug} to={`/blog/${b.slug}`} className="g-blog">
                <span className="g-blog-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="g-blog-cat">{(b.category || 'YAZI').toUpperCase().slice(0, 14)}</span>
                <h4 className="g-blog-title">{b.title}</h4>
                {b.excerpt && <p className="g-blog-excerpt">{b.excerpt.slice(0, 110)}…</p>}
                <span className="g-blog-link">{lang === 'en' ? 'Read' : 'Oku'} →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════ 11 · NEWSLETTER ════════════════ */}
      <section className="g-section g-newsletter">
        <GiantSectionHead
          eyebrow={lang === 'en' ? 'NEWSLETTER' : 'BÜLTEN'}
          title={lang === 'en' ? 'Sign up.' : 'Abone ol.'}
        />
        <div className="g-newsletter-form">
          <NewsletterForm />
        </div>
        <div className="g-newsletter-cta">
          <a href={subscribeUrl} target="_blank" rel="noopener noreferrer" className="g-touch-submit g-touch-submit--ghost">
            <FaYoutube size={16} /> {lang === 'en' ? 'SUBSCRIBE ON YOUTUBE' : 'YOUTUBE’DA ABONE OL'}
          </a>
        </div>
      </section>
    </div>
  )
}
