import { useEffect, useMemo, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useSEO } from '../hooks/useSEO'
import { getKadelinkHeroApi, getKadelinkLinksApi, getKadelinkThemeApi } from '../api'
import './Links.css'

/* ─── KADELINK 1:1 React port. Tamamen kendine yeten link-in-bio sayfası. ─── */

const DEFAULT_LINKS = [
  { id: 'instagram', label: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/kadirardademir', enabled: true },
  { id: 'youtube', label: 'YouTube', icon: 'youtube', url: 'https://www.youtube.com/@kadirardademirr', enabled: true },
  { id: 'tiktok', label: 'TikTok', icon: 'tiktok', url: 'https://www.tiktok.com/@kadirardademir', enabled: true },
  { id: 'x', label: 'X', icon: 'x', url: 'https://twitter.com/kadirardademir', enabled: true },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', url: 'https://www.linkedin.com/in/kadirdemirr', enabled: true },
  { id: 'email', label: 'İletişim', icon: 'email', url: 'mailto:thekademedia@gmail.com', enabled: true },
]

const ICON_PATHS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.86a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.29z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
}

const MODAL_CONTENT = {
  cookies: {
    tr: { title: 'Çerez Tercihleri', body: 'Bu site analitik amaçlı yalnızca temel çerezleri kullanır. Üçüncü taraf izleyici yoktur.' },
    en: { title: 'Cookie Preferences', body: 'This site uses only essential cookies for analytics. No third-party trackers.' },
  },
  report: null, // dinamik — settings.email kullanılır
  privacy: {
    tr: { title: 'Gizlilik', body: 'Kişisel veri toplanmaz. Tıkladığın bağlantılar ilgili platformlara yönlendirir.' },
    en: { title: 'Privacy', body: 'No personal data is collected. Links you click go to the relevant platforms.' },
  },
  explore: {
    tr: { title: 'Keşfet', body: 'YouTube ve Instagram\'da yeni içerikler yayında. Takipte kal.' },
    en: { title: 'Explore', body: 'New content live on YouTube and Instagram. Stay tuned.' },
  },
  about: {
    tr: { title: 'Hakkında', body: 'Kadir Demir — İçerik Üreticisi. Her şey için tek adres.' },
    en: { title: 'About', body: 'Kadir Demir — Content Creator. One place for everything.' },
  },
}

export default function Links() {
  const { settings } = useSiteSettings()
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('kade_links_lang')
      if (saved === 'tr' || saved === 'en') return saved
    } catch { /* ignore */ }
    return 'tr'
  })
  const [hero, setHero] = useState(null)
  const [links, setLinks] = useState(null)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState(null)
  const [showToTop, setShowToTop] = useState(false)

  useSEO({
    title: 'Kadir Demir — @kadirardademir',
    description: 'İçerik Üreticisi. Tüm bağlantılar tek yerde.',
    path: '/links',
  })

  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('kade_links_lang', lang) } catch { /* ignore */ }
  }, [lang])

  useEffect(() => {
    getKadelinkHeroApi().then((doc) => setHero(doc?.data || null)).catch(() => {})
    getKadelinkLinksApi().then((doc) => {
      const arr = Array.isArray(doc?.data?.links) ? doc.data.links : null
      setLinks(arr)
    }).catch(() => {})
    getKadelinkThemeApi().then((doc) => {
      const t = doc?.data
      if (!t) return
      const root = document.documentElement
      if (t.accent) root.style.setProperty('--amber', t.accent)
      if (t.accentLight) root.style.setProperty('--amber-soft', t.accentLight)
      if (t.accentDeep) root.style.setProperty('--amber-deep', t.accentDeep)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setShowToTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!modal) return
    const onKey = (e) => { if (e.key === 'Escape') setModal(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modal])

  const portrait = hero?.portrait || '/kadelink-portrait.png'
  const handle = hero?.handle || `@${(settings.instagramHandle || 'kadirardademir').replace(/^@/, '')}`
  const tagline = (lang === 'en' ? hero?.taglineEn : hero?.tagline) || (lang === 'en' ? 'Content Creator' : 'İçerik Üreticisi')
  const showVerified = hero?.showVerified !== false

  const linkList = useMemo(() => {
    const source = Array.isArray(links) && links.length > 0
      ? links.filter((l) => l && l.enabled !== false && l.url && l.label)
      : DEFAULT_LINKS.filter((l) => {
          if (l.id === 'instagram') return settings.instagram || l.url
          if (l.id === 'youtube') return settings.youtube || l.url
          if (l.id === 'tiktok') return settings.tiktok || l.url
          if (l.id === 'x') return settings.twitter || l.url
          return true
        }).map((l) => ({
          ...l,
          url:
            l.id === 'instagram' ? (settings.instagram || l.url)
            : l.id === 'youtube' ? (settings.youtube || l.url)
            : l.id === 'tiktok' ? (settings.tiktok || l.url)
            : l.id === 'x' ? (settings.twitter || l.url)
            : l.id === 'email' && settings.businessEmail ? `mailto:${settings.businessEmail}`
            : l.url,
        }))
    return source
  }, [links, settings])

  const onShare = async () => {
    const url = window.location.origin + '/links'
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(url)
      showToast(lang === 'en' ? 'Link copied!' : 'Link kopyalandı!')
    } catch {
      showToast(lang === 'en' ? 'Could not copy' : 'Kopyalanamadı')
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const openModal = (key) => setModal(key)
  const closeModal = () => setModal(null)

  const reportEmail = settings?.email || settings?.businessEmail || 'thekademedia@gmail.com'
  const dynamicModal = {
    ...MODAL_CONTENT,
    report: {
      tr: { title: 'Bildir', body: `Bir sorun mu var? Bana ulaş: ${reportEmail}` },
      en: { title: 'Report', body: `Is there an issue? Reach out: ${reportEmail}` },
    },
  }
  const modalData = modal ? dynamicModal[modal]?.[lang] || dynamicModal[modal]?.tr : null

  return (
    <div className="kdl-page">
      <main className="kdl-card-wrap">
        <section className="kdl-hero">
          <img className="kdl-hero-photo" src={portrait} alt={handle} />
          <div className="kdl-hero-overlay" />

          <div className="kdl-top-bar">
            <div className="kdl-lang-toggle" role="tablist">
              <button
                type="button"
                className={`kdl-lang-btn ${lang === 'tr' ? 'active' : ''}`}
                onClick={() => setLang('tr')}
                role="tab"
                aria-selected={lang === 'tr'}
              >TR</button>
              <button
                type="button"
                className={`kdl-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                role="tab"
                aria-selected={lang === 'en'}
              >EN</button>
            </div>
            <button
              type="button"
              className="kdl-share-btn"
              onClick={onShare}
              aria-label={lang === 'en' ? 'Share' : 'Paylaş'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>

          <div className="kdl-hero-text">
            <h1 className="kdl-name">
              {handle}
              {showVerified && (
                <span className="kdl-verified" aria-label={lang === 'en' ? 'Verified' : 'Doğrulanmış'}>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1.5l2.09 2.14 2.99-.32.85 2.89 2.89.85-.32 2.99L22.5 12l-2.14 2.09.32 2.99-2.89.85-.85 2.89-2.99-.32L12 22.5l-2.09-2.14-2.99.32-.85-2.89-2.89-.85.32-2.99L1.5 12l2.14-2.09-.32-2.99 2.89-.85.85-2.89 2.99.32L12 1.5z" fill="currentColor" />
                    <path d="M8 12.2l2.6 2.6L16.2 9.2" fill="none" stroke="#0a0907" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </h1>
            <p className="kdl-title">{tagline}</p>
          </div>

          {/* tabs kaldırıldı — tek sayfa */}
        </section>

        <section className="kdl-links" id="panel-links">
          {linkList.map((link) => (
            <a
              key={link.id || link.label}
              className="kdl-link"
              href={link.url}
              target={link.url.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
            >
              <span className="kdl-link-icon">{ICON_PATHS[link.icon] || ICON_PATHS.website}</span>
              <span className="kdl-link-label">{link.label}</span>
              <span className="kdl-link-meta">⋮</span>
            </a>
          ))}
        </section>

        <footer className="kdl-footer">
          <nav className="kdl-footer-links">
            {[
              { key: 'cookies', tr: 'Çerez Tercihleri', en: 'Cookie Preferences' },
              { key: 'report', tr: 'Bildir', en: 'Report' },
              { key: 'privacy', tr: 'Gizlilik', en: 'Privacy' },
              { key: 'explore', tr: 'Keşfet', en: 'Explore' },
              { key: 'about', tr: 'Hakkında', en: 'About' },
            ].map((item, i, arr) => (
              <span key={item.key}>
                <button type="button" className="kdl-footer-link" onClick={() => openModal(item.key)}>
                  {lang === 'en' ? item.en : item.tr}
                </button>
                {i < arr.length - 1 && <span className="kdl-dot">•</span>}
              </span>
            ))}
          </nav>
          <p className="kdl-footer-sign">© {new Date().getFullYear()} Kadir Demir</p>
        </footer>
      </main>

      <button
        type="button"
        className={`kdl-to-top ${showToTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label={lang === 'en' ? 'Back to top' : 'Yukarı çık'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {toast && <div className="kdl-toast">{toast}</div>}

      {modalData && (
        <div className="kdl-modal open" role="dialog" aria-modal="true">
          <div className="kdl-modal-backdrop" onClick={closeModal} />
          <div className="kdl-modal-panel">
            <button type="button" className="kdl-modal-close" onClick={closeModal} aria-label={lang === 'en' ? 'Close' : 'Kapat'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h2 className="kdl-modal-title">{modalData.title}</h2>
            <p className="kdl-modal-body">{modalData.body}</p>
          </div>
        </div>
      )}

    </div>
  )
}
