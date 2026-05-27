import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaDiscord,
  FaLinkedin,
  FaXTwitter,
} from 'react-icons/fa6'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { PersonSchema, FAQSchema, VideoSchema, WebSiteSchema } from '../components/StructuredData'
import CountUp from '../components/CountUp'
import Aurora from '../components/reactbits/Aurora'
import {
  getYouTubeVideosApi, getBlogsApi, getSocialStatsApi, sendContactApi,
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
  const [blogs, setBlogs] = useState([])
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

    getBlogsApi().then((res) => {
      const list = Array.isArray(res?.blogs) ? res.blogs : Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
      setBlogs(list.filter((b) => !b?.draft && b?.published !== false).slice(0, 3))
    }).catch(() => {})

    getSocialStatsApi({ force: true }).then((data) => setSocialStats(data)).catch(() => setSocialStats(null))

    getPartnersApi?.().then?.((res) => {
      const list = Array.isArray(res?.partners) ? res.partners : Array.isArray(res) ? res : []
      setPartners(list.filter((p) => p && (p.name || p.logo)).slice(0, 12))
    }).catch(() => {})
  }, [])

  const yt = socialStats?.youtube
  const ig = socialStats?.instagram
  const tt = socialStats?.tiktok

  // Önce canlı API, yoksa admin'den girilen manuel istatistikler.
  const liveStats = [
    {
      value: yt?.followers || settings.statsYoutubeSubs,
      label: isEn ? 'YouTube subscribers' : 'YouTube abone',
    },
    {
      value: yt?.views || settings.statsTotalViews,
      label: isEn ? 'Total views' : 'Toplam izlenme',
    },
    {
      value: ig?.followers || settings.statsInstagramFollowers,
      label: isEn ? 'Instagram followers' : 'Instagram takipçi',
    },
    {
      value: tt?.followers || settings.statsTiktokFollowers,
      label: isEn ? 'TikTok followers' : 'TikTok takipçi',
    },
  ].filter((s) => s.value && s.value !== '—' && s.value !== '0')

  const aboutText = settings.description || (isEn
    ? "I've been making content for 14 years. Vlogs, gaming, live streams — whatever pulls me in that week. This site is where I park everything I do."
    : '14 yıldır içerik üretiyorum. Vlog, oyun, canlı yayın — o hafta neye ilgi duyuyorsam onu çekiyorum. Bu site de yaptıklarımın toplandığı yer.')

  const focusCards = [
    {
      n: '01',
      title: isEn ? 'Long-form videos' : 'Uzun videolar',
      body: isEn
        ? "Vlogs and storytelling pieces I actually want to watch back. No filler, no fake hype."
        : 'Geri dönüp izleyebileceğim vloglar ve hikayeli videolar. Doldurma yok, sahte heyecan yok.',
    },
    {
      n: '02',
      title: isEn ? 'Gaming & live' : 'Oyun & canlı yayın',
      body: isEn
        ? 'Streams where chat actually matters — we play, we mess up, we talk.'
        : 'Sohbetin gerçekten önemli olduğu yayınlar — oynuyoruz, batırıyoruz, konuşuyoruz.',
    },
    {
      n: '03',
      title: isEn ? 'Brand work' : 'Marka işleri',
      body: isEn
        ? "I only work with brands I'd already use. If it doesn't fit the channel, it's a no."
        : 'Sadece zaten kullanacağım markalarla çalışıyorum. Kanala uymuyorsa olmuyor.',
    },
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

  const localizedFaqs = useMemo(() => ([
    { q: 'Yeni videoları ne sıklıkla yüklüyorsun?', a: 'Genellikle haftada 1-2 video. Yayın takvimini YouTube ve sosyal hesaplardan görebilirsin.' },
    { q: 'İş birliklerine açık mısın?', a: 'Evet. Kanala yakışan marka ve fikirler için iletişim formundan yazabilirsin.' },
    { q: 'Tüm bağlantılar nerede?', a: '/links sayfasında her şey tek yerde.' },
  ]), [])

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

  return (
    <div className="g">
      <PersonSchema socials={settings} />
      <WebSiteSchema />
      <FAQSchema items={localizedFaqs} />
      {videos.length > 0 && <VideoSchema videos={videos.slice(0, 8)} />}

      <section className="g-hero" id="home">
        <div className="g-hero-aurora" aria-hidden="true">
          <Aurora colorStops={['#d4943f', '#a67428', '#e8b468']} amplitude={0.7} blend={0.5} speed={0.35} />
        </div>
        <div className="g-hero-veil" />
        <div className="g-hero-inner">
          <span className="g-hero-mark">
            {isEn ? 'Content creator · Istanbul' : 'İçerik üreticisi · İstanbul'}
          </span>
          <h1 className="g-hero-title">
            {brandName}
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
                    {parsed ? <><CountUp end={parsed.num} duration={2.2} />{parsed.suffix}</> : s.value}
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
      </section>

      {videos.length > 0 && (
        <section className="g-section g-works-wrap">
          <GiantSectionHead eyebrow={isEn ? 'LATEST VIDEOS' : 'SON VİDEOLAR'} />
          <div className="g-works-grid">
            {videos.slice(0, 6).map((v, i) => (
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

      {blogs.length > 0 && (
        <section className="g-section g-blogs">
          <GiantSectionHead eyebrow={isEn ? 'LATEST WRITING' : 'SON YAZILAR'} />
          <div className="g-blogs-row">
            {blogs.map((b, i) => (
              <Link key={b._id || b.slug} to={`/blog/${b.slug}`} className="g-blog">
                <span className="g-blog-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="g-blog-cat">{(b.category || 'YAZI').toUpperCase().slice(0, 14)}</span>
                <h4 className="g-blog-title">{b.title}</h4>
                {b.excerpt && <p className="g-blog-excerpt">{b.excerpt.slice(0, 110)}...</p>}
                <span className="g-blog-link">{isEn ? 'Read' : 'Oku'} →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
