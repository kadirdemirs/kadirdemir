import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaDiscord,
  FaLinkedin,
  FaXTwitter,
  FaVideo,
  FaGamepad,
  FaTowerBroadcast as FaBroadcastTower,
  FaFilm,
  FaRegImage,
  FaMicrophone,
} from 'react-icons/fa6'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { PersonSchema, FAQSchema, VideoSchema, WebSiteSchema } from '../components/StructuredData'
import CountUp from '../components/reactbits/CountUpRB'
import NewsletterForm from '../components/NewsletterForm'
import GradientText from '../components/reactbits/GradientText'
import LogoLoop from '../components/reactbits/LogoLoop'
import PollWidget from '../components/PollWidget'
import MilestoneTracker from '../components/MilestoneTracker'
import {
  getYouTubeVideosApi, getSocialStatsApi, sendContactApi,
  getPartnersApi,
} from '../api'
import './Home.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseStat(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    if (value >= 1e9) return { num: +(value / 1e9).toFixed(1), suffix: 'B' }
    if (value >= 1e6) return { num: +(value / 1e6).toFixed(1), suffix: 'M' }
    if (value >= 1e3) return { num: +(value / 1e3).toFixed(1), suffix: 'K' }
    return { num: value, suffix: '' }
  }
  const m = String(value).trim().match(/^([\d.,]+)\s*([KMB])?/i)
  if (!m) return null
  const num = parseFloat(m[1].replace(/,/g, ''))
  if (!Number.isFinite(num)) return null
  return { num, suffix: (m[2] || '').toUpperCase() }
}

function formatViews(n) {
  const parsed = parseStat(n)
  if (!parsed) return n || null
  return `${parsed.num}${parsed.suffix}`
}

// ── Animation variants ──────────────────────────────────────────
const vFadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } },
}
const vStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const vFadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

// ── Magnetic CTA butonu ──────────────────────────────────────────
function MagneticCTA({ children, className, href, to, onClick, target, rel, type }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 22 })
  const sy = useSpring(y, { stiffness: 220, damping: 22 })

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.32)
    y.set((e.clientY - r.top - r.height / 2) * 0.32)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  if (to) {
    return (
      <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-block' }}
        onMouseMove={onMove} onMouseLeave={onLeave}>
        <Link className={className} to={to} onClick={onClick}>{children}</Link>
      </motion.div>
    )
  }
  const El = href ? motion.a : motion.button
  return (
    <El ref={ref} className={className} href={href} onClick={onClick}
      target={target} rel={rel} type={type}
      style={{ x: sx, y: sy }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </El>
  )
}

function GiantEyebrow({ children, num }) {
  return (
    <span className="g-eyebrow">
      {num != null && <span className="g-eyebrow-num">[{String(num).padStart(2, '0')}]</span>}
      <span className="g-eyebrow-rule" />
      <span className="g-eyebrow-label">{children}</span>
      <span className="g-eyebrow-rule" />
    </span>
  )
}

function GiantSectionHead({ eyebrow, title, sub, num }) {
  return (
    <header className="g-section-head">
      <GiantEyebrow num={num}>{eyebrow}</GiantEyebrow>
      {title && <h2 className="g-section-title">{title}</h2>}
      {sub && <p className="g-section-sub">{sub}</p>}
    </header>
  )
}

export default function Home() {
  const { settings } = useSiteSettings()
  const { lang } = useLanguage()
  const [videos, setVideos] = useState([])
  const [socialStats, setSocialStats] = useState(null)
  const [partners, setPartners] = useState([])
  const [touchForm, setTouchForm] = useState({ name: '', email: '', topic: '', message: '' })
  const [touchStatus, setTouchStatus] = useState(null)
  const [touchSubmitting, setTouchSubmitting] = useState(false)

  const isEn = lang === 'en'
  const brandName = settings.businessName || 'Kadir Demir'

  useSEO({
    title: settings.seoTitle || 'Kadir Demir | İçerik Üreticisi',
    description: settings.seoDescription || 'Kadir Demir — 14 yıldır içerik üretiyorum. YouTube, vlog, oyun.',
    keywords: settings.seoKeywords,
    path: '/',
  })

  useEffect(() => {
    getYouTubeVideosApi().then((res) => {
      if (Array.isArray(res?.videos)) setVideos(res.videos)
    }).catch(() => {})

    getSocialStatsApi().then((data) => setSocialStats(data)).catch(() => setSocialStats(null))

    if (typeof getPartnersApi === 'function') {
      getPartnersApi()
        .then((res) => {
          const list = Array.isArray(res?.partners) ? res.partners : Array.isArray(res) ? res : []
          setPartners(list.filter((p) => p && (p.name || p.logo)).slice(0, 12))
        })
        .catch(() => {})
    }
  }, [])

  const yt = socialStats?.youtube
  const ig = socialStats?.instagram
  const tt = socialStats?.tiktok

  // Önce canlı API verisi, yoksa admin'den girilen manuel istatistikler.
  // Hiçbiri yoksa bölüm gizlenir (liveStats.length > 0 koşulu).
  const liveStats = [
    { value: yt?.followers || settings.statsYoutubeSubs, label: isEn ? 'YouTube subscribers' : 'YouTube abone' },
    { value: yt?.views || settings.statsTotalViews, label: isEn ? 'Total views' : 'Toplam izlenme' },
    { value: ig?.followers || settings.statsInstagramFollowers, label: isEn ? 'Instagram followers' : 'Instagram takipçi' },
    { value: tt?.followers || settings.statsTiktokFollowers, label: isEn ? 'TikTok followers' : 'TikTok takipçi' },
    { value: settings.statsTwitterFollowers, label: isEn ? 'X followers' : 'X takipçi' },
  ].filter((s) => s && s.value && s.value !== '—' && String(s.value).trim() !== '' && Number(String(s.value).replace(/[^\d.]/g, '')) > 0)

  const aboutText = settings.description || (isEn
    ? "Started in 2011 with a laptop and zero followers. Still here, 14 years later — same curiosity, better gear. I make stuff I actually want to watch. It all lands here."
    : '2011\'de bir laptopla başladım, sıfır takipçiyle. 14 yıl sonra hâlâ aynı yerdeyim. Aynı merak, biraz daha iyi ekipman. İzlemeye değer bulmadığım şeyi çekmiyorum. Her şey buraya geliyor.')

  const defaultFocus = [
    {
      title: isEn ? 'Long-form videos' : 'Uzun videolar',
      body: isEn
        ? "Videos I'd actually sit and rewatch. No padding, no clickbait energy — just stuff worth your time."
        : 'Oturup yeniden izleyebileceğim şeyler. Dolgu yok, tıklama tuzağı yok — sadece vaktine değer içerik.',
    },
    {
      title: isEn ? 'Gaming & live streams' : 'Oyun & canlı yayın',
      body: isEn
        ? "Chat makes the show, not me. We win sometimes, lose more often, always good fun."
        : 'Şovu ben değil sohbet yönetiyor. Bazen kazanıyoruz, çoğunlukla yeniliyoruz, her zaman iyi vakit.',
    },
    {
      title: isEn ? 'Brand collabs' : 'Marka işleri',
      body: isEn
        ? "Only things I'd genuinely buy. If it doesn't fit how I make content, I pass — no exceptions."
        : 'Gerçekten satın alacağım şeyler. İçerik tarzıma uymuyorsa geçiyorum — istisna yok.',
    },
  ]
  // Admin'den girilen focus varsa onu kullan, yoksa default
  const focusCards = (Array.isArray(settings.homeFocus) && settings.homeFocus.length > 0
    ? settings.homeFocus
    : defaultFocus
  ).map((c, i) => ({ ...c, n: String(i + 1).padStart(2, '0') }))

  const contentTypes = [
    { icon: FaVideo, label: isEn ? 'Vlogs' : 'Vlog' },
    { icon: FaGamepad, label: isEn ? 'Gaming' : 'Oyun' },
    { icon: FaBroadcastTower, label: isEn ? 'Live streams' : 'Canlı yayın' },
    { icon: FaFilm, label: isEn ? 'Editing' : 'Kurgu' },
    { icon: FaRegImage, label: 'Thumbnail' },
    { icon: FaMicrophone, label: isEn ? 'Podcasts' : 'Podcast' },
  ]

  // Yolculuk/timeline — placeholder; admin Site Ayarları'ndan düzenleyebilir
  const defaultStory = [
    {
      period: '2011',
      role: isEn ? 'First upload' : 'İlk video',
      body: isEn
        ? "Pressed publish on my first video. Phone camera, zero script, no idea what I was doing. Best decision I ever made."
        : 'Telefon kamerasıyla ilk videoyu yükledim. Senaryo yok, plan yok, ne yaptığımı bilmiyordum. Hayatımın en iyi kararı.',
    },
    {
      period: '2015',
      role: isEn ? 'Gaming era' : 'Oyun dönemi',
      body: isEn
        ? "Found my people through gaming. The comment section stopped being just comments — it became a proper community."
        : 'Oyun üzerinden gerçek insanlarla bağlantı kurdum. Yorum bölümü artık sadece yorum değil, gerçek bir topluluktu.',
    },
    {
      period: '2020',
      role: isEn ? 'Going full-time' : 'Tam zamanlı',
      body: isEn
        ? "Took the jump. Quit the day job, went all in. Scary as hell, best thing I did."
        : 'Atladım. Günlük işi bıraktım, tamamen buraya döndüm. Korkunçtu ama yaptığım en iyi şeydi.',
    },
    {
      period: isEn ? 'Now' : 'Şimdi',
      role: isEn ? '14 years in' : '14. yıl',
      body: isEn
        ? "Still at it, still figuring things out. New formats, random experiments, same audience that somehow stuck around."
        : 'Hâlâ buradayım, hâlâ bir şeyler deniyorum. Yeni formatlar, gelişigüzel deneyler, bir şekilde hâlâ burada olan izleyici kitlesi.',
    },
  ]
  const story = Array.isArray(settings.homeStory) && settings.homeStory.length > 0
    ? settings.homeStory
    : defaultStory

  const localizedFaqs = useMemo(() => {
    // Admin'den girilen SSS varsa onu kullan
    if (Array.isArray(settings.homeFaq) && settings.homeFaq.length > 0) {
      return settings.homeFaq.filter((f) => f && f.q && f.a)
    }
    return isEn ? [
      { q: 'How often do you post?', a: '1-2 times a week most weeks. Some weeks more, some less — I\'d rather take extra time and make it worth watching.' },
      { q: 'Up for collabs?', a: 'Yeah, but only if it actually fits. I don\'t take every offer — drop me a message below and let\'s see.' },
      { q: 'Where can I find everything?', a: 'Links page has it all — socials, contact, everything in one spot.', link: '/links', linkText: 'Go to links →' },
    ] : [
      { q: 'Yeni video ne zaman çıkıyor?', a: 'Haftada 1-2, genelde öyle. Bazen daha fazla, bazen daha az — izlemeye değmeyecekse geciktirmeyi tercih ederim.' },
      { q: 'İş birliği yapıyor musun?', a: 'Yapıyorum ama her teklifi almıyorum. Uyanı alıyorum, uymayan geçiyorum. Yazmaktan çekinme, bakarız.' },
      { q: 'Linkler nerede?', a: 'Hepsi links sayfasında — sosyal medya, iletişim, her şey tek yerde.', link: '/links', linkText: 'Linkler sayfasına git →' },
    ]
  }, [isEn, settings.homeFaq])

  const updateTouch = (key) => (e) => {
    setTouchForm((form) => ({ ...form, [key]: e.target.value }))
  }

  const submitTouch = async (e) => {
    e.preventDefault()
    const payload = {
      name: touchForm.name.trim(),
      email: touchForm.email.trim(),
      subject: touchForm.topic.trim() || (isEn ? 'Homepage message' : 'Ana sayfa mesajı'),
      service: touchForm.topic.trim() || (isEn ? 'Homepage message' : 'Ana sayfa mesajı'),
      message: touchForm.message.trim(),
      source: 'home-bana-yaz',
    }
    if (payload.name.length < 2 || !EMAIL_RE.test(payload.email) || payload.message.length < 10) {
      setTouchStatus({ type: 'error', text: isEn ? 'Name, valid email and a message of at least 10 characters are required.' : 'Ad, geçerli e-posta ve en az 10 karakterlik mesaj gerekli.' })
      return
    }
    setTouchSubmitting(true)
    setTouchStatus(null)
    try {
      await sendContactApi(payload)
      setTouchStatus({ type: 'success', text: isEn ? 'Got it — I will write back soon.' : 'Aldım — en kısa sürede dönüş yapacağım.' })
      setTouchForm({ name: '', email: '', topic: '', message: '' })
    } catch (err) {
      setTouchStatus({ type: 'error', text: err?.message || (isEn ? 'Could not send the message.' : 'Mesaj gönderilemedi.') })
    } finally {
      setTouchSubmitting(false)
    }
  }

  const yearsActive = settings.statsActiveYears || '14'

  // Admin'den seçilen video varsa onu, yoksa en çok izleneni öne çıkar
  const featuredVideo = useMemo(() => {
    if (!videos.length) return null
    const withId = videos.filter((v) => v?.youtubeId)
    if (!withId.length) return null
    if (settings.featuredVideoId) {
      const picked = withId.find((v) => v.youtubeId === settings.featuredVideoId)
      if (picked) return picked
    }
    // Admin seçimi yoksa → her zaman en yeni video öne çıkar
    return [...withId].sort((a, b) => {
      const da = new Date(a.publishedAt || a.date || 0).getTime()
      const db = new Date(b.publishedAt || b.date || 0).getTime()
      return db - da
    })[0]
  }, [videos, settings.featuredVideoId])

  const platformCards = [
    settings.youtube && { name: 'YouTube', icon: FaYoutube, url: settings.youtube, color: '#FF0000', stat: yt?.followers || settings.statsYoutubeSubs, statLabel: isEn ? 'subs' : 'abone' },
    settings.instagram && { name: 'Instagram', icon: FaInstagram, url: settings.instagram, color: '#E4405F', stat: ig?.followers || settings.statsInstagramFollowers, statLabel: isEn ? 'followers' : 'takipçi' },
    settings.tiktok && { name: 'TikTok', icon: FaTiktok, url: settings.tiktok, color: '#00F2EA', stat: tt?.followers || settings.statsTiktokFollowers, statLabel: isEn ? 'followers' : 'takipçi' },
    settings.discord && { name: 'Discord', icon: FaDiscord, url: settings.discord, color: '#5865F2' },
    settings.linkedin && { name: 'LinkedIn', icon: FaLinkedin, url: settings.linkedin, color: '#0A66C2' },
    settings.twitter && { name: 'X', icon: FaXTwitter, url: settings.twitter, color: '#ffffff', stat: settings.statsTwitterFollowers, statLabel: isEn ? 'followers' : 'takipçi' },
  ].filter(Boolean)

  return (
    <div className="g">
      <PersonSchema socials={settings} />
      <WebSiteSchema />
      <FAQSchema items={localizedFaqs} />
      {videos.length > 0 && <VideoSchema videos={videos.slice(0, 8)} />}

      <section className="g-hero" id="home">
        <div className="g-hero-veil" />
        <div className="g-hero-deco" aria-hidden="true">{yearsActive}</div>
        <motion.div
          className="g-hero-inner"
          initial="hidden"
          animate="visible"
          variants={vStagger}
        >
          <motion.span variants={vFadeUp} className="g-hero-mark">
            {isEn ? 'Content creator · Istanbul' : 'İçerik üreticisi · İstanbul'}
          </motion.span>
          <motion.h1 variants={vFadeUp} className="g-hero-title">
            <GradientText
              colors={['#f4ebe0', '#e8b468', '#d4943f', '#e8b468', '#f4ebe0']}
              animationSpeed={9}
              direction="horizontal"
            >
              {brandName}
            </GradientText>
            <span className="g-hero-title-accent">.</span>
          </motion.h1>
          <motion.p variants={vFadeUp} className="g-hero-lede">
            {isEn ? (
              <>{yearsActive} years in. <em className="g-em">Still</em> making videos, <em className="g-em">still</em> enjoying it.</>
            ) : (
              <>{yearsActive} yıldır <em className="g-em">video</em> çekiyorum. <em className="g-em">Hâlâ</em> devam ediyorum.</>
            )}
          </motion.p>
          <motion.div variants={vFadeUp} className="g-hero-actions">
            <MagneticCTA href="#about" className="g-hero-cta g-hero-cta--primary">
              {isEn ? 'About me' : 'Beni tanı'}
            </MagneticCTA>
            <MagneticCTA to="/iletisim" className="g-hero-cta g-hero-cta--ghost">
              {isEn ? 'Write me' : 'Bana yaz'}
            </MagneticCTA>
          </motion.div>
        </motion.div>
        <a href="#about" className="g-hero-scroll-hint" aria-label="Kaydır">
          <span className="g-hero-scroll-dot" />
        </a>
      </section>

      <motion.section
        className="g-section g-about" id="about"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'ABOUT' : 'HAKKIMDA'}
            num={1}
            title={isEn
              ? <>{yearsActive} years. <em className="g-em">Still here.</em></>
              : <>{yearsActive} yıl. <em className="g-em">Hâlâ devam.</em></>}
          />
        </motion.div>
        <motion.div variants={vFadeUp} className="g-about-grid">
          <div className="g-about-num">
            <span className="g-about-num-frame">
              <strong>{yearsActive}</strong>
              <em>{isEn ? 'years creating' : 'yıldır üretiyorum'}</em>
            </span>
          </div>
          <div className="g-about-body">
            <span className="g-quote g-quote-open">"</span>
            <p>{aboutText}</p>
            <span className="g-quote g-quote-close">"</span>
            <p className="g-about-sign">— {brandName}</p>
          </div>
        </motion.div>
      </motion.section>

      {liveStats.length > 0 && (
        <motion.section
          className="g-section g-stats"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={vStagger}
        >
          <motion.h2 variants={vFadeUp} className="g-results-title">
            {isEn ? <>Results<em className="g-em">.</em></> : <>Sonuçlar<em className="g-em">.</em></>}
          </motion.h2>
          <motion.div variants={vStagger} className="g-stats-row">
            {liveStats.map((s, i) => {
              const parsed = parseStat(s.value)
              return (
                <motion.div key={s.label} variants={vFadeUp} className="g-stat">
                  <span className="g-stat-value">
                    {parsed ? <><CountUp to={parsed.num} duration={2} separator="," />{parsed.suffix}</> : s.value}
                  </span>
                  <span className="g-stat-label">{s.label}</span>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.section>
      )}

      {/* Milestone tracker */}
      {(liveStats.some((s) => s.label.toLowerCase().includes('abone') || s.label.toLowerCase().includes('subscriber')) || settings.statsYoutubeSubs) && (
        <section className="g-section g-milestone">
          <GiantSectionHead
            eyebrow={isEn ? 'NEXT GOAL' : 'SONRAKI HEDEF'}
            title={isEn ? 'We\'re getting there.' : 'Yavaş yavaş gidiyoruz.'}
          />
          <MilestoneTracker
            subs={liveStats.find((s) => s.label.toLowerCase().includes('abone') || s.label.toLowerCase().includes('subscriber'))?.value || settings.statsYoutubeSubs}
            targetOverride={settings.milestoneTarget}
            isEn={isEn}
          />
        </section>
      )}

      {/* Şu an ne izliyorum / ne oynuyorum */}
      {(settings.currentlyWatching || settings.currentlyPlaying) && (
        <section className="g-section g-now">
          <GiantSectionHead
            eyebrow={isEn ? 'RIGHT NOW' : 'ŞU AN'}
            title={isEn ? 'What I\'m into.' : 'Şu sıralar bunlarla vakit geçiriyorum.'}
          />
          <div className="g-now-grid">
            {settings.currentlyWatching && (
              <div className="g-now-card">
                <span className="g-now-type">{isEn ? '📺 WATCHING' : '📺 İZLİYORUM'}</span>
                <h3>{settings.currentlyWatching}</h3>
                {settings.currentlyNote && <p>{settings.currentlyNote}</p>}
              </div>
            )}
            {settings.currentlyPlaying && (
              <div className="g-now-card">
                <span className="g-now-type">{isEn ? '🎮 PLAYING' : '🎮 OYNUYORUM'}</span>
                <h3>{settings.currentlyPlaying}</h3>
              </div>
            )}
          </div>
        </section>
      )}

      <motion.section
        className="g-section g-focus"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'WHAT I DO' : 'NE YAPIYORUM'}
            num={2}
          title={isEn
            ? <>Three things, <em className="g-em">done properly.</em></>
            : <>Üç şey, <em className="g-em">doğru düzgün.</em></>}
          sub={isEn ? 'Less talk, more actual content.' : 'Az laf, çok iş.'}
          />
        </motion.div>
        <motion.div variants={vStagger} className="g-focus-grid">
          {focusCards.map((card) => (
            <motion.div key={card.n} variants={vFadeUp} className="g-focus-card">
              <span className="g-focus-num">{card.n}</span>
              <div className="g-focus-body">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={vFadeIn} className="g-types-loop">
          <LogoLoop
            logos={contentTypes.map((c) => ({
              node: (
                <span className="g-type-node">
                  <c.icon size={18} />
                  {c.label}
                </span>
              ),
              title: c.label,
            }))}
            speed={45}
            direction="left"
            logoHeight={20}
            gap={28}
            pauseOnHover
            fadeOut
            scaleOnHover
            ariaLabel={isEn ? 'Content types' : 'İçerik türleri'}
          />
        </motion.div>
      </motion.section>

      {/* Öne çıkan video — varsa ilk video, yoksa kanal CTA */}
      <motion.section
        className="g-section g-feature"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'FEATURED' : 'ÖNE ÇIKAN'}
            num={3}
            title={featuredVideo
              ? <><em className="g-em">{isEn ? 'Latest' : 'Son'}</em> video.</>
              : (isEn ? 'On the channel.' : 'Kanalda.')}
          />
        </motion.div>
        <motion.div variants={vFadeUp} className="g-feature-frame">
          {featuredVideo ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${featuredVideo.youtubeId}`}
              title={featuredVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <a className="g-feature-cta" href={settings.youtube || 'https://youtube.com/@kadirdemir'} target="_blank" rel="noopener noreferrer">
              <FaYoutube size={44} />
              <span>{isEn ? 'Watch on YouTube' : "YouTube'da izle"}</span>
              <small>{isEn ? 'New videos every week' : 'Her hafta yeni video'}</small>
            </a>
          )}
        </motion.div>
      </motion.section>

      {/* Sırada ne var — admin'den girilirse göster */}
      {settings.nextVideoTitle && (
        <section className="g-section g-next">
          <div className="g-next-card">
            <span className="g-next-eyebrow">{isEn ? 'COMING UP' : 'SIRADA'}</span>
            <h3 className="g-next-title">{settings.nextVideoTitle}</h3>
            {(settings.nextVideoDate || settings.nextVideoNote) && (
              <p className="g-next-meta">
                {settings.nextVideoDate && <strong>{settings.nextVideoDate}</strong>}
                {settings.nextVideoDate && settings.nextVideoNote && ' · '}
                {settings.nextVideoNote}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Son videolar — yatay liste */}
      <section className="g-section g-works-wrap">
        <GiantSectionHead
          eyebrow={isEn ? 'LATEST VIDEOS' : 'SON VİDEOLAR'}
          num={4}
          title={isEn
            ? <>What I've <em className="g-em">made.</em></>
            : <>Son <em className="g-em">videolarım.</em></>}
          sub={videos.length === 0 ? (isEn ? 'Head to the channel for the latest uploads.' : 'En yeni videolar için kanala göz at.') : undefined}
        />
        {videos.length > 0 ? (
          <motion.div
            className="g-works-list"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={vStagger}
          >
            {videos.slice(featuredVideo ? 1 : 0, featuredVideo ? 9 : 8).map((v, i) => (
              <motion.a
                key={v.youtubeId || i}
                href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="g-work-row"
                variants={vFadeUp}
              >
                <span className="g-work-row-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="g-work-row-title">{v.title}</span>
                <span className="g-work-row-meta">
                  {v.views ? `${formatViews(v.views)} ${isEn ? 'views' : 'izlenme'}` : 'YouTube'}
                </span>
                <span className="g-work-row-arrow">↗</span>
              </motion.a>
            ))}
          </motion.div>
        ) : (
          <div className="g-works-empty">
            <a className="g-hero-cta g-hero-cta--primary" href={settings.youtube || 'https://youtube.com/@kadirdemir'} target="_blank" rel="noopener noreferrer">
              <FaYoutube size={18} /> {isEn ? 'Open channel' : 'Kanala git'}
            </a>
            <Link className="g-hero-cta g-hero-cta--ghost" to="/videolar">
              {isEn ? 'All videos' : 'Tüm videolar'}
            </Link>
          </div>
        )}
      </section>

      {/* Process — İçerik nasıl doğuyor (Wibify "From briefly to launch") */}
      <motion.section
        className="g-section g-process"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'PROCESS' : 'SÜREÇ'}
            num={5}
            title={isEn
              ? <>From <em className="g-em">idea</em> to publish.</>
              : <>Fikirden <em className="g-em">yayına.</em></>}
          />
        </motion.div>
        <div className="g-process-rows">
          {[
            {
              num: '01',
              title: isEn ? 'Idea' : 'Fikir',
              body: isEn
                ? "Everything starts with a question worth asking. I don't press record unless I have something to say."
                : "Her şey sorulmaya değer bir soruyla başlar. Söyleyecek bir şeyim yoksa kayıt başlamaz.",
            },
            {
              num: '02',
              title: isEn ? 'Production' : 'Çekim',
              body: isEn
                ? "Camera, mic, location. Capturing real moments that actually happened."
                : "Kamera, mikrofon, mekan. Gerçekten yaşanan anları yakalama işi.",
            },
            {
              num: '03',
              title: isEn ? 'Edit' : 'Kurgu',
              body: isEn
                ? "Where the story is actually made. Cutting, pacing, adding what makes you stay."
                : "Hikayenin gerçekten yazıldığı yer. Kesme, tempo, seni bağlayan detayları ekleme.",
            },
            {
              num: '04',
              title: isEn ? 'Publish' : 'Yayın',
              body: isEn
                ? "Thumbnail, title, description. Then the best part: reading the first comments."
                : "Thumbnail, başlık, açıklama. Sonra en iyi kısım: ilk yorumları okumak.",
            },
          ].map((step) => (
            <motion.div key={step.num} className="g-process-row" variants={vFadeUp}>
              <span className="g-process-num">{step.num}</span>
              <div className="g-process-content">
                <h3 className="g-process-title">{step.title}</h3>
                <p className="g-process-body">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Location — İstanbul'dan üretiyorum */}
      <motion.section
        className="g-location"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={vStagger}
      >
        <div className="g-location-inner">
          <motion.span variants={vFadeUp} className="g-location-tag">📍 Istanbul, TR</motion.span>
          <motion.h2 variants={vFadeUp} className="g-location-title">
            {isEn
              ? <>Creating from <em className="g-em">Istanbul.</em></>
              : <>İstanbul'dan <em className="g-em">üretiyorum.</em></>}
          </motion.h2>
          <motion.p variants={vFadeUp} className="g-location-sub">
            {isEn ? `${yearsActive} years, one city, one channel.` : `${yearsActive} yıl, bir şehir, bir kanal.`}
          </motion.p>
        </div>
      </motion.section>

      {/* Platform kartları */}
      <motion.section
        className="g-section g-platforms"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'FIND ME' : 'BENİ BUL'}
            num={6}
            title={isEn
              ? <>Everywhere, <em className="g-em">one me.</em></>
              : <>Her yerde, <em className="g-em">tek ben.</em></>}
          />
        </motion.div>
        <motion.div variants={vStagger} className="g-platforms-grid">
          {platformCards.map((p) => (
            <motion.a
              key={p.name}
              variants={vFadeUp}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="g-platform"
              style={{ '--pc': p.color }}
            >
              <span className="g-platform-icon"><p.icon size={22} /></span>
              <span className="g-platform-name">{p.name}</span>
              {p.stat && <span className="g-platform-stat">{formatViews(p.stat)} {p.statLabel}</span>}
              <span className="g-platform-go">{isEn ? 'Follow' : 'Takip et'} ↗</span>
            </motion.a>
          ))}
        </motion.div>
      </motion.section>

      {/* Topluluk anketi */}
      <motion.section
        className="g-section g-poll"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'COMMUNITY' : 'TOPLULUK'}
            title={isEn ? <>Your vote <em className="g-em">matters.</em></> : <>Senin oyun <em className="g-em">önemli.</em></>}
            sub={isEn ? 'Help decide what comes next.' : 'Sıradakine sen karar ver.'}
          />
        </motion.div>
        <motion.div variants={vFadeUp}><PollWidget isEn={isEn} /></motion.div>
      </motion.section>

      {/* İçerik takvimi */}
      {Array.isArray(settings.contentCalendar) && settings.contentCalendar.length > 0 && (
        <section className="g-section g-calendar">
          <GiantSectionHead
            eyebrow={isEn ? 'SCHEDULE' : 'TAKVİM'}
            title={isEn ? 'What\'s coming.' : 'Yakında ne geliyor.'}
          />
          <div className="g-cal-list">
            {settings.contentCalendar.slice(0, 5).map((item, i) => (
              <div key={i} className="g-cal-item">
                <div className="g-cal-meta">
                  <span className="g-cal-type g-cal-type--{item.type || 'video'}">{
                    item.type === 'live' ? '🔴' : item.type === 'short' ? '▮' : '▶'
                  }</span>
                  {item.date && <span className="g-cal-date">{item.date}</span>}
                </div>
                <div className="g-cal-body">
                  <strong>{item.title}</strong>
                  {item.note && <span>{item.note}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {Array.isArray(settings.instagramPosts) && settings.instagramPosts.filter((p) => p?.thumbnail).length > 0 && (
        <section className="g-section g-instagram">
          <GiantSectionHead
            eyebrow="INSTAGRAM"
            title={isEn ? 'From the feed.' : 'Akıştan.'}
          />
          <div className="g-ig-grid">
            {settings.instagramPosts.filter((p) => p?.thumbnail).slice(0, 8).map((p, i) => (
              <a
                key={i}
                href={p.url || settings.instagram || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="g-ig-tile"
                aria-label={isEn ? 'Instagram post' : 'Instagram gönderisi'}
              >
                <img src={p.thumbnail} alt={isEn ? 'Instagram post' : 'Instagram gönderisi'} loading="lazy" />
                <span className="g-ig-overlay"><FaInstagram size={24} /></span>
              </a>
            ))}
          </div>
          {settings.instagram && (
            <div className="g-ig-cta">
              <a className="g-hero-cta g-hero-cta--ghost" href={settings.instagram} target="_blank" rel="noopener noreferrer">
                <FaInstagram size={18} /> {isEn ? 'Follow on Instagram' : "Instagram'da takip et"}
              </a>
            </div>
          )}
        </section>
      )}

      <motion.section
        className="g-section g-story"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'THE TIMELINE' : 'YOLCULUK'}
            num={7}
          title={isEn
            ? <>The <em className="g-em">story.</em></>
            : <>Kameranın <em className="g-em">iki tarafında.</em></>}
          />
        </motion.div>
        <motion.div variants={vStagger} className="g-story-list">
          {story.map((s, i) => (
            <motion.article key={s.period} variants={vFadeUp} className={`g-story-row ${i % 2 ? 'is-right' : 'is-left'}`}>
              <div className="g-story-meta">
                <span className="g-story-period">{s.period}</span>
              </div>
              <div className="g-story-body">
                <h3 className="g-story-role">{s.role}</h3>
                <p>{s.body}</p>
              </div>
              <div className="g-story-portrait" aria-hidden="true">
                <span>{String(i + 1).padStart(2, '0')}</span>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      {partners.length > 0 && (
        <motion.section
          className="g-section g-partners"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={vStagger}
        >
          <motion.div variants={vFadeUp}>
            <GiantSectionHead
              eyebrow={isEn ? 'WORKED WITH' : 'BİRLİKTE ÇALIŞTIKLARIM'}
              title={isEn
                ? <>Brands I&apos;ve <em className="g-em">worked with.</em></>
                : <>Birlikte <em className="g-em">ürettiklerim.</em></>}
              sub={isEn ? "Brands and people I've actually built things with." : 'Gerçekten bir şeyler ürettiğim markalar ve insanlar.'}
            />
          </motion.div>
          <div className="g-partners-grid">
            {partners.map((p, i) => (
              <a
                key={p._id || p.name || i}
                href={p.url || '#'}
                target={p.url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="g-partner"
                title={p.name}
              >
                {p.logo ? (
                  <img src={p.logo} alt={p.name || 'partner'} loading="lazy" />
                ) : (
                  <span>{p.name}</span>
                )}
              </a>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section
        className="g-contact" id="contact"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={vStagger}
      >
        <div className="g-contact-veil" />
        <div className="g-contact-inner">
          <span className="g-eyebrow g-eyebrow-light">
            <span className="g-eyebrow-rule" />
            <span className="g-eyebrow-label">{isEn ? 'CONTACT' : 'İLETİŞİM'}</span>
            <span className="g-eyebrow-rule" />
          </span>
          <h2 className="g-contact-title">
            {isEn ? <>Say <em className="g-em">hello.</em></> : <>Bir şey <em className="g-em">söyle.</em></>}
          </h2>
          <p className="g-contact-copy">
            {isEn
              ? 'Collab pitch, random video idea, podcast invite, or just saying hi — I actually read all of them.'
              : 'Sponsorluk teklifi, video fikri, podcast daveti ya da sadece selam — hepsini okuyorum, gerçekten.'}
          </p>
          <div className="g-contact-grid">
            <div className="g-contact-cell">
              <span className="g-contact-label">{isEn ? 'BASE' : 'ŞEHİR'}</span>
              <p>İstanbul, TR</p>
            </div>
            <div className="g-contact-cell">
              <span className="g-contact-label">EMAIL</span>
              <a href={`mailto:${settings.businessEmail || settings.email || 'thekademedia@gmail.com'}`}>
                {settings.businessEmail || settings.email || 'thekademedia@gmail.com'}
              </a>
            </div>
            <div className="g-contact-cell">
              <span className="g-contact-label">{isEn ? 'SOCIAL' : 'SOSYAL'}</span>
              <div className="g-contact-socials">
                {settings.youtube && <a href={settings.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube size={18} /></a>}
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram size={18} /></a>}
                {settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><FaTiktok size={18} /></a>}
                {settings.twitter && <a href={settings.twitter} target="_blank" rel="noopener noreferrer" aria-label="X"><FaXTwitter size={18} /></a>}
                {settings.discord && <a href={settings.discord} target="_blank" rel="noopener noreferrer" aria-label="Discord"><FaDiscord size={18} /></a>}
                {settings.linkedin && <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin size={18} /></a>}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="g-section g-faq"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'FAQ' : 'SIKÇA SORULANLAR'}
            num={8}
          title={isEn
            ? <><em className="g-em">Quick</em> answers.</>
            : <><em className="g-em">Kısa</em> cevaplar.</>}
          />
        </motion.div>
        <motion.div variants={vFadeUp} className="g-faq-list">
          {localizedFaqs.map((f, i) => (
            <details key={i} className="g-faq-item">
              <summary>
                <span>{f.q}</span>
                <span className="g-faq-plus" aria-hidden="true" />
              </summary>
              <p>
                {f.a}
                {f.link && <> <Link to={f.link} className="g-faq-link">{f.linkText}</Link></>}
              </p>
            </details>
          ))}
        </motion.div>
      </motion.section>

      {settings.newsletterEnabled && (
        <section className="g-section g-newsletter">
          <GiantSectionHead
            eyebrow={isEn ? 'NEWSLETTER' : 'BÜLTEN'}
            title={isEn ? 'New video? You hear first.' : 'Yeni video çıkınca ilk sen duy.'}
            sub={isEn ? 'No spam — just a heads-up when something new drops.' : 'Spam yok — sadece yeni bir şey çıkınca kısa bir haber.'}
          />
          <div className="g-newsletter-wrap">
            <NewsletterForm lang={lang} />
          </div>
        </section>
      )}

      <motion.section
        className="g-section g-touch"
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={vStagger}
      >
        <motion.div variants={vFadeUp}>
          <GiantSectionHead
            eyebrow={isEn ? 'WRITE ME' : 'BANA YAZ'}
            num={9}
          title={isEn
            ? <>Let's <em className="g-em">talk.</em></>
            : <>Konuşa<em className="g-em">lım.</em></>}
          sub={isEn ? "Two lines or a full brief — doesn't matter, I'll write back." : 'İki satır da olur, sayfalarca da — fark etmez, dönerim.'}
          />
        </motion.div>
        <motion.form variants={vFadeUp} className="g-touch-form" onSubmit={submitTouch}>
          <div className="g-touch-row">
            <label><span>{isEn ? 'NAME' : 'AD'}</span><input type="text" value={touchForm.name} onChange={updateTouch('name')} required /></label>
            <label><span>EMAIL</span><input type="email" value={touchForm.email} onChange={updateTouch('email')} required /></label>
            <label><span>{isEn ? 'TOPIC' : 'KONU'}</span><input type="text" value={touchForm.topic} onChange={updateTouch('topic')} /></label>
          </div>
          <label className="g-touch-message"><span>{isEn ? 'MESSAGE' : 'MESAJ'}</span><textarea rows={4} value={touchForm.message} onChange={updateTouch('message')} required minLength={10} /></label>
          <MagneticCTA type="submit" className="g-touch-submit" onClick={undefined}>
            {touchSubmitting ? (isEn ? 'SENDING...' : 'GÖNDERİLİYOR...') : (isEn ? 'SEND' : 'GÖNDER')}
          </MagneticCTA>
          {touchStatus && <p className={`g-touch-status is-${touchStatus.type}`}>{touchStatus.text}</p>}
        </motion.form>
      </motion.section>

    </div>
  )
}
