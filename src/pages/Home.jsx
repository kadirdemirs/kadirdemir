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
import GradientText from '../components/reactbits/GradientText'
import LogoLoop from '../components/reactbits/LogoLoop'
import BorderGlow from '../components/reactbits/BorderGlow'
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

    getSocialStatsApi({ force: true }).then((data) => setSocialStats(data)).catch(() => setSocialStats(null))

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

  // Sadece canlı API verisi — sahte/placeholder rakam göstermiyoruz.
  // Veri yoksa bölüm tamamen gizlenir (aşağıda liveStats.length > 0 koşulu).
  const liveStats = [
    yt?.followers && { value: yt.followers, label: isEn ? 'YouTube subscribers' : 'YouTube abone' },
    yt?.views && { value: yt.views, label: isEn ? 'Total views' : 'Toplam izlenme' },
    ig?.followers && { value: ig.followers, label: isEn ? 'Instagram followers' : 'Instagram takipçi' },
    tt?.followers && { value: tt.followers, label: isEn ? 'TikTok followers' : 'TikTok takipçi' },
  ].filter((s) => s && s.value && s.value !== '—' && Number(String(s.value).replace(/\D/g, '')) > 0)

  const aboutText = settings.description || (isEn
    ? "Lifelong content guy — 14 years and counting. I make videos, stream, and mostly just film whatever I'm into that week. Everything I do ends up here."
    : '14 senedir bu işteyim, hâlâ bırakamadım. Video çekiyorum, yayın açıyorum, o hafta neye taktıysam onu paylaşıyorum. Ne yapıyorsam burada toplanıyor.')

  const focusCards = [
    {
      n: '01',
      title: isEn ? 'Long-form videos' : 'Uzun videolar',
      body: isEn
        ? "The stuff I'd actually rewatch. No filler, no fake 'you won't believe this'."
        : 'Geri dönüp ben de izlerim dediğim videolar. Doldurma yok, "buna inanamayacaksınız" muhabbeti hiç yok.',
    },
    {
      n: '02',
      title: isEn ? 'Gaming & live' : 'Oyun & canlı yayın',
      body: isEn
        ? "Streams where the chat runs the show. We play, we lose, we laugh about it."
        : 'Sohbetin işi yönettiği yayınlar. Oynuyoruz, yeniliyoruz, gülüp geçiyoruz.',
    },
    {
      n: '03',
      title: isEn ? 'Brand work' : 'Marka işleri',
      body: isEn
        ? "I only push stuff I'd use myself. Doesn't fit the channel? Then it's a no, simple."
        : 'Sadece kendi kullanacağım şeyleri öne çıkarırım. Kanala uymuyorsa, yok — bu kadar basit.',
    },
  ]

  const contentTypes = [
    { icon: FaVideo, label: isEn ? 'Vlogs' : 'Vlog' },
    { icon: FaGamepad, label: isEn ? 'Gaming' : 'Oyun' },
    { icon: FaBroadcastTower, label: isEn ? 'Live streams' : 'Canlı yayın' },
    { icon: FaFilm, label: isEn ? 'Editing' : 'Kurgu' },
    { icon: FaRegImage, label: 'Thumbnail' },
    { icon: FaMicrophone, label: isEn ? 'Podcasts' : 'Podcast' },
  ]

  // Content roadmap with placeholder years — admin can edit later
  const story = [
    {
      period: '2011',
      role: isEn ? 'First upload' : 'İlk video',
      body: isEn
        ? "I hit publish on my first video. No plan, no gear — just a laptop camera and curiosity."
        : 'İlk videoyu yükledim. Plan yok, ekipman yok — sadece laptop kamerası ve merak.',
    },
    {
      period: '2015',
      role: isEn ? 'Gaming era' : 'Oyun dönemi',
      body: isEn
        ? "Gaming videos took off. The community started to feel like a real place."
        : 'Oyun videoları tuttu. Topluluk gerçek bir yer gibi hissettirmeye başladı.',
    },
    {
      period: '2020',
      role: isEn ? 'Going full-time' : 'Tam zamanlı',
      body: isEn
        ? "Started treating this like an actual job. Better gear, better edits, longer videos."
        : 'Bunu gerçek bir iş gibi görmeye başladım. Daha iyi ekipman, daha iyi kurgu, daha uzun videolar.',
    },
    {
      period: isEn ? 'Today' : 'Bugün',
      role: isEn ? '14 years in' : '14. yıl',
      body: isEn
        ? "Still showing up, still trying new stuff. Vlogs, streams, the occasional weird experiment."
        : 'Hâlâ devam ediyorum, hâlâ yeni şeyler deniyorum. Vloglar, yayınlar, ara sıra acayip deneyler.',
    },
  ]

  const localizedFaqs = useMemo(() => (isEn ? [
    { q: 'How often do you upload?', a: 'Usually 1-2 videos a week. You can follow the schedule on YouTube and my socials.' },
    { q: 'Are you open to collabs?', a: 'Yes. For brands and ideas that fit the channel, write me through the contact form below.' },
    { q: 'Where are all your links?', a: 'All my links are in one place on the links page.', link: '/links', linkText: 'Open links page →' },
  ] : [
    { q: 'Yeni video ne sıklıkla geliyor?', a: 'Genelde haftada 1-2 video. Takvimi YouTube ve sosyal hesaplardan takip edebilirsin.' },
    { q: 'İş birliğine açık mısın?', a: 'Evet. Kanala uyan marka ve fikirler için aşağıdaki formdan yazabilirsin.' },
    { q: 'Tüm bağlantılar nerede?', a: 'Hepsi tek sayfada — links sayfasına göz at.', link: '/links', linkText: 'Linkler sayfasını aç →' },
  ]), [isEn])

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

  // En çok izlenen videoyu öne çıkar; yoksa ilk video
  const featuredVideo = useMemo(() => {
    if (!videos.length) return null
    const withId = videos.filter((v) => v?.youtubeId)
    if (!withId.length) return null
    return [...withId].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))[0]
  }, [videos])

  const platformCards = [
    settings.youtube && { name: 'YouTube', icon: FaYoutube, url: settings.youtube, color: '#FF0000', stat: yt?.followers, statLabel: isEn ? 'subs' : 'abone' },
    settings.instagram && { name: 'Instagram', icon: FaInstagram, url: settings.instagram, color: '#E4405F', stat: ig?.followers, statLabel: isEn ? 'followers' : 'takipçi' },
    settings.tiktok && { name: 'TikTok', icon: FaTiktok, url: settings.tiktok, color: '#00F2EA', stat: tt?.followers, statLabel: isEn ? 'followers' : 'takipçi' },
    settings.discord && { name: 'Discord', icon: FaDiscord, url: settings.discord, color: '#5865F2' },
    settings.linkedin && { name: 'LinkedIn', icon: FaLinkedin, url: settings.linkedin, color: '#0A66C2' },
    settings.twitter && { name: 'X', icon: FaXTwitter, url: settings.twitter, color: '#ffffff' },
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
              ? `${yearsActive} years on YouTube. Vlogs, gaming and live streams.`
              : `${yearsActive} yıldır YouTube'dayım. Vlog, oyun ve canlı yayın.`}
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
                <div key={s.label} className="g-stat" style={{ '--g-stat-i': i, '--g-stat-n': arr.length }}>
                  <span className="g-stat-value">
                    {parsed ? <><CountUp to={parsed.num} duration={2} separator="," />{parsed.suffix}</> : s.value}
                  </span>
                  <span className="g-stat-label">{s.label}</span>
                </div>
              )
            })}
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
            <article
              key={card.n}
              className="g-focus-card"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
                e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
              }}
            >
              <span>{card.n}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
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
          <h2 className="g-contact-title">{isEn ? 'Got an idea? Just write.' : 'Aklında bir şey mi var? Yaz yeter.'}</h2>
          <p className="g-contact-copy">
            {isEn
              ? 'Brand collabs, video ideas, podcast invites or just a quick hello — all fair game.'
              : 'Marka iş birlikleri, video fikirleri, podcast davetleri ya da kısaca selam — hepsi olur.'}
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

      <section className="g-section g-touch">
        <GiantSectionHead
          eyebrow={isEn ? 'WRITE ME' : 'BANA YAZ'}
          title={isEn ? 'Drop a line.' : 'Bir iki satır yaz.'}
          sub={isEn ? 'Short hello or full brief — both land in the same inbox.' : 'Kısa selam ya da uzun brief — ikisi de aynı gelen kutusuna düşüyor.'}
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
