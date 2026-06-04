import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
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
import SpotlightCard from '../components/reactbits/SpotlightCard'
import GlareHover from '../components/reactbits/GlareHover'
import LogoLoop from '../components/reactbits/LogoLoop'
import BorderGlow from '../components/reactbits/BorderGlow'
import TiltedCard from '../components/reactbits/TiltedCard'
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
        <div className="g-hero-inner">
          <span className="g-hero-mark">
            {isEn ? 'Content creator · Istanbul' : 'İçerik üreticisi · İstanbul'}
          </span>
          <h1 className="g-hero-title">
            <GradientText
              colors={['#f4ebe0', '#e8b468', '#d4943f', '#e8b468', '#f4ebe0']}
              animationSpeed={9}
              direction="horizontal"
            >
              {brandName}
            </GradientText>
            <span className="g-hero-title-accent">.</span>
          </h1>
          <p className="g-hero-lede">
            {isEn
              ? `${yearsActive} years in. Still making videos, still enjoying it.`
              : `${yearsActive} yıldır video çekiyorum. Hâlâ devam ediyorum, hâlâ zevk alıyorum.`}
          </p>
          <div className="g-hero-actions">
            <a href="#about" className="g-hero-cta g-hero-cta--primary">
              {isEn ? 'About me' : 'Beni tanı'}
            </a>
            <Link to="/iletisim" className="g-hero-cta g-hero-cta--ghost">
              {isEn ? 'Write me' : 'Bana yaz'}
            </Link>
          </div>
        </div>
        <a href="#about" className="g-hero-scroll-hint" aria-label="Kaydır">
          <span className="g-hero-scroll-dot" />
        </a>
      </section>

      <section className="g-section g-about" id="about">
        <GiantSectionHead eyebrow={isEn ? 'ABOUT' : 'HAKKIMDA'} />
        <div className="g-about-grid">
          <div className="g-about-num">
            <span className="g-about-num-frame">
              <strong>{yearsActive}</strong>
              <em>{isEn ? 'years creating' : 'yıldır üretiyorum'}</em>
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

      {liveStats.length > 0 && (
        <section className="g-section g-stats">
          <div className="g-stats-row">
            {liveStats.map((s, i, arr) => {
              const parsed = parseStat(s.value)
              return (
                <GlareHover
                  key={s.label}
                  className="g-stat"
                  style={{ '--g-stat-i': i, '--g-stat-n': arr.length }}
                  glareColor="rgba(212,148,63,0.25)"
                  glareSize={200}
                  glareOpacity={0.5}
                >
                  <span className="g-stat-value">
                    {parsed ? <><CountUp to={parsed.num} duration={2} separator="," />{parsed.suffix}</> : s.value}
                  </span>
                  <span className="g-stat-label">{s.label}</span>
                </GlareHover>
              )
            })}
          </div>
        </section>
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

      <section className="g-section g-focus">
        <GiantSectionHead
          eyebrow={isEn ? 'WHAT I DO' : 'NE YAPIYORUM'}
          title={isEn ? 'Three things, done properly.' : 'Üç şey, doğru düzgün.'}
          sub={isEn ? 'Less talk, more actual content.' : 'Az laf, çok iş.'}
        />
        <div className="g-focus-grid">
          {focusCards.map((card) => (
            <SpotlightCard
              key={card.n}
              className="g-focus-card"
              spotlightColor="rgba(212,148,63,0.14)"
            >
              <span>{card.n}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </SpotlightCard>
          ))}
        </div>

        <div className="g-types-loop">
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
        </div>
      </section>

      {/* Öne çıkan video — varsa ilk video, yoksa kanal CTA */}
      <section className="g-section g-feature">
        <GiantSectionHead
          eyebrow={isEn ? 'FEATURED' : 'ÖNE ÇIKAN'}
          title={featuredVideo ? featuredVideo.title : (isEn ? 'On the channel' : 'Kanalda')}
        />
        <div className="g-feature-frame">
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
        </div>
      </section>

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

      {/* Son videolar — varsa grid, yoksa kanal daveti */}
      <section className="g-section g-works-wrap">
        <GiantSectionHead
          eyebrow={isEn ? 'LATEST VIDEOS' : 'SON VİDEOLAR'}
          sub={videos.length === 0 ? (isEn ? 'Head to the channel for the latest uploads.' : 'En yeni videolar için kanala göz at.') : undefined}
        />
        {videos.length > 0 ? (
          <div className="g-works-grid">
            {videos.slice(featuredVideo ? 1 : 0, featuredVideo ? 7 : 6).map((v, i) => (
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
                  <span className="g-work-cat">YouTube</span>
                  <h4 className="g-work-title">{v.title}</h4>
                  <span className="g-work-cta">{isEn ? 'WATCH' : 'İZLE'}</span>
                  {v.views && <span className="g-work-views">{formatViews(v.views)} {isEn ? 'views' : 'izlenme'}</span>}
                </div>
              </a>
            ))}
          </div>
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

      {/* Platform kartları */}
      <section className="g-section g-platforms">
        <GiantSectionHead
          eyebrow={isEn ? 'FIND ME' : 'BENİ BUL'}
          title={isEn ? 'Everywhere, one me.' : 'Her yerde, tek ben.'}
        />
        <div className="g-platforms-grid">
          {platformCards.map((p) => (
            <BorderGlow
              key={p.name}
              className="g-platform-glow"
              borderRadius={14}
              glowColor="38 75 55"
              backgroundColor="rgba(10,9,7,0.6)"
              colors={['#e8b468', '#d4943f', '#a67428']}
              edgeSensitivity={35}
              glowRadius={32}
            >
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="g-platform" style={{ '--pc': p.color }}>
                <span className="g-platform-icon"><p.icon size={26} /></span>
                <span className="g-platform-name">{p.name}</span>
                {p.stat && <span className="g-platform-stat">{formatViews(p.stat)} {p.statLabel}</span>}
                <span className="g-platform-go">{isEn ? 'Follow' : 'Takip et'} →</span>
              </a>
            </BorderGlow>
          ))}
        </div>
      </section>

      {/* Topluluk anketi */}
      <section className="g-section g-poll">
        <GiantSectionHead
          eyebrow={isEn ? 'COMMUNITY' : 'TOPLULUK'}
          title={isEn ? 'Your vote matters.' : 'Senin oyun önemli.'}
          sub={isEn ? 'Help decide what comes next.' : 'Sıradakine sen karar ver.'}
        />
        <PollWidget isEn={isEn} />
      </section>

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

      <section className="g-section g-story">
        <GiantSectionHead eyebrow={isEn ? 'THE TIMELINE' : 'YOLCULUK'} />
        <div className="g-story-list">
          {story.map((s, i) => (
            <article key={s.period} className={`g-story-row ${i % 2 ? 'is-right' : 'is-left'}`}>
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
            </article>
          ))}
        </div>
      </section>

      {partners.length > 0 && (
        <section className="g-section g-partners">
          <GiantSectionHead
            eyebrow={isEn ? 'WORKED WITH' : 'BİRLİKTE ÇALIŞTIKLARIM'}
            sub={isEn ? 'Brands and people I’ve actually built things with.' : 'Gerçekten bir şeyler ürettiğim markalar ve insanlar.'}
          />
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
        </section>
      )}

      <section className="g-contact" id="contact">
        <div className="g-contact-veil" />
        <div className="g-contact-inner">
          <span className="g-eyebrow g-eyebrow-light">
            <span className="g-eyebrow-rule" />
            <span className="g-eyebrow-label">{isEn ? 'CONTACT' : 'İLETİŞİM'}</span>
            <span className="g-eyebrow-rule" />
          </span>
          <h2 className="g-contact-title">{isEn ? 'Say hello.' : 'Bir şey söylemek istiyorsan yaz.'}</h2>
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
      </section>

      <section className="g-section g-faq">
        <GiantSectionHead
          eyebrow={isEn ? 'FAQ' : 'SIKÇA SORULANLAR'}
          title={isEn ? 'Quick answers.' : 'Kısa cevaplar.'}
        />
        <div className="g-faq-list">
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
        </div>
      </section>

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

      <section className="g-section g-touch">
        <GiantSectionHead
          eyebrow={isEn ? 'WRITE ME' : 'BANA YAZ'}
          title={isEn ? 'Let\'s talk.' : 'Konuşalım.'}
          sub={isEn ? 'Two lines or a full brief — doesn\'t matter, I\'ll write back.' : 'İki satır da olur, sayfalarca da — fark etmez, dönerim.'}
        />
        <form className="g-touch-form" onSubmit={submitTouch}>
          <div className="g-touch-row">
            <label><span>{isEn ? 'NAME' : 'AD'}</span><input type="text" value={touchForm.name} onChange={updateTouch('name')} required /></label>
            <label><span>EMAIL</span><input type="email" value={touchForm.email} onChange={updateTouch('email')} required /></label>
            <label><span>{isEn ? 'TOPIC' : 'KONU'}</span><input type="text" value={touchForm.topic} onChange={updateTouch('topic')} /></label>
          </div>
          <label className="g-touch-message"><span>{isEn ? 'MESSAGE' : 'MESAJ'}</span><textarea rows={4} value={touchForm.message} onChange={updateTouch('message')} required minLength={10} /></label>
          <button type="submit" className="g-touch-submit" disabled={touchSubmitting}>
            {touchSubmitting ? (isEn ? 'SENDING...' : 'GÖNDERİLİYOR...') : (isEn ? 'SEND' : 'GÖNDER')}
          </button>
          {touchStatus && <p className={`g-touch-status is-${touchStatus.type}`}>{touchStatus.text}</p>}
        </form>
      </section>

    </div>
  )
}
