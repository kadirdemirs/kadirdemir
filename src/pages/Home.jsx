import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaTwitch,
  FaXTwitter,
} from 'react-icons/fa6'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { PersonSchema, FAQSchema, VideoSchema, WebSiteSchema } from '../components/StructuredData'
import CountUp from '../components/CountUp'
import NewsletterForm from '../components/NewsletterForm'
import {
  getYouTubeVideosApi, getBlogsApi, getSocialStatsApi, sendContactApi,
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
  const [touchForm, setTouchForm] = useState({ name: '', email: '', topic: '', message: '' })
  const [touchStatus, setTouchStatus] = useState(null)
  const [touchSubmitting, setTouchSubmitting] = useState(false)

  const isEn = lang === 'en'
  const brandName = settings.businessName || 'Kadir Demir'

  useSEO({
    title: settings.seoTitle || 'Kadir Demir | İçerik Üreticisi',
    description: settings.seoDescription || 'Kadir Demir içerik üreticisi resmi web sitesi.',
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
  }, [])

  const yt = socialStats?.youtube
  const ig = socialStats?.instagram
  const tt = socialStats?.tiktok

  const statItems = [
    yt?.followers && { value: yt.followers, label: isEn ? 'YouTube subscribers' : 'YouTube abone', source: socialStats?.sources?.youtube },
    yt?.views && { value: yt.views, label: isEn ? 'Total views' : 'Toplam izlenme', source: socialStats?.sources?.youtube },
    yt?.videos && { value: yt.videos, label: isEn ? 'Published videos' : 'Yayınlanmış video', source: socialStats?.sources?.youtube },
    ig?.followers && { value: ig.followers, label: isEn ? 'Instagram followers' : 'Instagram takipçi', source: socialStats?.sources?.instagram },
    tt?.followers && { value: tt.followers, label: isEn ? 'TikTok followers' : 'TikTok takipçi', source: socialStats?.sources?.tiktok },
  ].filter(Boolean).slice(0, 4)

  const aboutText = settings.description || (isEn
    ? 'I create videos from Istanbul: vlogs, gaming, live streams and short stories built for people who actually watch until the end.'
    : 'İstanbul’dan video üretiyorum: vlog, oyun, canlı yayın ve sonuna kadar izlenen kısa hikayeler. Bu site, bütün içeriklerimin ve projelerimin merkezi.')

  const focusCards = [
    {
      n: '01',
      title: isEn ? 'Videos with a point' : 'Bir fikri olan videolar',
      body: isEn
        ? 'Every upload starts with a clear hook, a real moment and an edit that respects the viewer’s time.'
        : 'Her video net bir giriş, gerçek bir an ve izleyicinin zamanına saygı duyan bir kurgu ile başlıyor.',
    },
    {
      n: '02',
      title: isEn ? 'Community first' : 'Önce topluluk',
      body: isEn
        ? 'Comments, streams and messages shape what comes next. The audience is not decoration, it is the room.'
        : 'Yorumlar, yayınlar ve mesajlar sıradaki içeriği şekillendiriyor. İzleyici dekor değil, işin kendisi.',
    },
    {
      n: '03',
      title: isEn ? 'Kade Media' : 'Kade Media',
      body: isEn
        ? 'A focused production space for creator projects, brand integrations and long-form ideas.'
        : 'İçerik projeleri, marka entegrasyonları ve uzun format fikirler için odaklı bir üretim alanı.',
    },
  ]

  const story = [
    {
      period: isEn ? 'Now' : 'Bugün',
      role: isEn ? 'Content creator' : 'İçerik üreticisi',
      body: isEn
        ? 'Publishing videos, testing formats and building a creator-led media brand around Kade Media.'
        : 'Videolar yayınlıyor, formatlar deniyor ve Kade Media etrafında içerik üreticisi odaklı bir medya markası kuruyorum.',
    },
    {
      period: 'YouTube',
      role: isEn ? 'Long-form stories' : 'Uzun format hikayeler',
      body: isEn
        ? 'Vlogs, gaming episodes and videos that carry a real story instead of just filling a timeline.'
        : 'Sadece akışı dolduran değil, gerçek bir hikaye taşıyan vloglar, oyun bölümleri ve videolar.',
    },
    {
      period: isEn ? 'Everywhere' : 'Her platform',
      role: isEn ? 'Shorts, reels and live' : 'Shorts, reels ve canlı yayın',
      body: isEn
        ? 'Short-form clips and live moments keep the conversation alive between bigger uploads.'
        : 'Kısa videolar ve canlı anlar, büyük yayınların arasında sohbeti canlı tutuyor.',
    },
  ]

  const localizedFaqs = useMemo(() => ([
    { q: 'Yeni videoları ne sıklıkla yüklüyorsun?', a: 'Program ve projeye göre değişiyor; güncel içerikler YouTube ve sosyal hesaplarda.' },
    { q: 'İş birliklerine açık mısın?', a: 'Evet. Uygun marka ve içerik fikirleri için iletişim formundan yazabilirsin.' },
    { q: 'Tüm bağlantılar nerede?', a: '/links sayfasında sosyal medya ve iletişim bağlantıları tek yerde.' },
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
      setTouchStatus({ type: 'success', text: isEn ? 'Message sent. I will get back to you soon.' : 'Mesaj gönderildi. En kısa sürede dönüş yapacağım.' })
      setTouchForm({ name: '', email: '', topic: '', message: '' })
    } catch (err) {
      setTouchStatus({ type: 'error', text: err?.message || (isEn ? 'Message could not be sent.' : 'Mesaj gönderilemedi.') })
    } finally {
      setTouchSubmitting(false)
    }
  }

  return (
    <div className="g">
      <PersonSchema socials={settings} />
      <WebSiteSchema />
      <FAQSchema items={localizedFaqs} />
      {videos.length > 0 && <VideoSchema videos={videos.slice(0, 8)} />}

      <section className="g-hero" id="home">
        <div className="g-hero-bg" aria-hidden="true">
          <img src="/kadelink-portrait.png" alt="" />
          <div className="g-hero-veil" />
        </div>
        <div className="g-hero-inner">
          <span className="g-hero-mark">{brandName.split(' ')[0] || 'Kadir'}</span>
          <h1 className="g-hero-title">
            {isEn ? 'Content with a pulse.' : 'İçerik üreticisi.'}
          </h1>
          <ul className="g-hero-taglines">
            <li>{isEn ? 'YouTube' : 'YouTube'}</li>
            <li>{isEn ? 'Gaming and vlogs' : 'Oyun ve vlog'}</li>
            <li>{isEn ? 'Kade Media' : 'Kade Media'}</li>
          </ul>
          <a href="#about" className="g-hero-scroll" aria-label="Scroll"><span /></a>
        </div>
      </section>

      <section className="g-section g-about" id="about">
        <GiantSectionHead eyebrow={isEn ? 'ABOUT' : 'HAKKIMDA'} />
        <div className="g-about-grid">
          <div className="g-about-num">
            <span className="g-about-num-frame">
              <strong>{settings.statsActiveYears || '5+'}</strong>
              <em>{isEn ? 'years creating' : 'yıldır üretim'}</em>
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

      <section className="g-section g-stats-wrap">
        <div className="g-stats-bg" aria-hidden="true">
          <img src="/kadelink-portrait.png" alt="" />
          <div className="g-stats-veil" />
        </div>
        <div className="g-stats-inner">
          <span className="g-eyebrow g-eyebrow-light">
            <span className="g-eyebrow-rule" />
            <span className="g-eyebrow-label">{isEn ? 'LIVE NUMBERS' : 'CANLI SAYILAR'}</span>
            <span className="g-eyebrow-rule" />
          </span>
          <h2 className="g-stats-title">
            {isEn ? 'Pulled from the platform APIs.' : 'Sayılar API üzerinden çekiliyor.'}
          </h2>
          <div className="g-stats-row">
            {(statItems.length ? statItems : [{ value: 0, label: isEn ? 'Loading live data' : 'Canlı veri yükleniyor', source: 'api' }]).map((s, i, arr) => {
              const parsed = parseStat(s.value)
              return (
                <div key={s.label} className="g-stat" style={{ '--g-stat-i': i, '--g-stat-n': arr.length }}>
                  <span className="g-stat-value">
                    {parsed ? <><CountUp end={parsed.num} duration={2.2} />{parsed.suffix}</> : s.value}
                  </span>
                  <span className="g-stat-label">{s.label}</span>
                  {s.source && <span className="g-stat-source">{s.source}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="g-section g-focus">
        <GiantSectionHead
          eyebrow={isEn ? 'CREATOR MODE' : 'ÜRETİM MODU'}
          title={isEn ? 'What this site is actually about.' : 'Bu sitenin asıl işi.'}
          sub={isEn ? 'Less agency talk, more creator work: videos, community and projects.' : 'Ajans cümlesi değil; video, topluluk ve üretim odaklı gerçek içerik.'}
        />
        <div className="g-focus-grid">
          {focusCards.map((card) => (
            <article key={card.n} className="g-focus-card">
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
        <GiantSectionHead eyebrow={isEn ? 'CONTENT ROADMAP' : 'İÇERİK AKIŞI'} />
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

      <section className="g-contact" id="contact">
        <div className="g-contact-bg" aria-hidden="true">
          <img src="/kadelink-portrait.png" alt="" />
          <div className="g-contact-veil" />
        </div>
        <div className="g-contact-inner">
          <span className="g-eyebrow g-eyebrow-light">
            <span className="g-eyebrow-rule" />
            <span className="g-eyebrow-label">{isEn ? 'CONTACT' : 'İLETİŞİM'}</span>
            <span className="g-eyebrow-rule" />
          </span>
          <h2 className="g-contact-title">{isEn ? 'Send the idea, brief or hello.' : 'Fikir, proje ya da selam: buradan ulaş.'}</h2>
          <p className="g-contact-copy">
            {isEn
              ? 'For brand work, video ideas, events and creator projects, use the form below or send an email directly.'
              : 'Marka işleri, video fikirleri, etkinlikler ve içerik projeleri için aşağıdaki formu kullanabilir ya da direkt e-posta atabilirsin.'}
          </p>
          <div className="g-contact-grid">
            <div className="g-contact-cell">
              <span className="g-contact-label">{isEn ? 'BASE' : 'MERKEZ'}</span>
              <p>Kade Media<br />İstanbul, TR</p>
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
                {settings.twitch && <a href={settings.twitch} target="_blank" rel="noopener noreferrer" aria-label="Twitch"><FaTwitch size={18} /></a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="g-section g-touch">
        <GiantSectionHead
          eyebrow={isEn ? 'WRITE TO ME' : 'BANA YAZ'}
          title={isEn ? 'This form actually sends.' : 'Bu form gerçekten gönderiyor.'}
          sub={isEn ? 'Keep it short or send the whole brief.' : 'Kısa yazabilir ya da tüm briefi bırakabilirsin.'}
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

      <section className="g-section g-newsletter">
        <GiantSectionHead
          eyebrow={isEn ? 'NEWSLETTER' : 'BÜLTEN'}
          title={isEn ? 'New uploads, no noise.' : 'Yeni içerikler, gereksiz kalabalık yok.'}
          sub={isEn ? 'Only important updates from the channel and Kade Media.' : 'Sadece kanal ve Kade Media tarafındaki önemli güncellemeler.'}
        />
        <div className="g-newsletter-form">
          <NewsletterForm lang={lang} />
        </div>
      </section>
    </div>
  )
}
