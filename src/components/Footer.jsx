import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaYoutube, FaInstagram, FaTiktok, FaTwitch, FaXTwitter } from 'react-icons/fa6'
import { HiArrowUpRight } from 'react-icons/hi2'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import './Footer.css'

const NAV = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Hakkımda', path: '/hakkimda' },
  { name: 'Videolar', path: '/videolar' },
  { name: 'Blog', path: '/blog' },
  { name: 'Setup', path: '/setup' },
  { name: 'İletişim', path: '/iletisim' },
]

const LEGAL = [
  { name: 'KVKK', path: '/kvkk' },
  { name: 'Gizlilik', path: '/gizlilik' },
  { name: 'Çerezler', path: '/cerez-politikasi' },
]

function buildSocials(s) {
  const list = []
  if (s.youtube) list.push({ icon: FaYoutube, name: 'YouTube', url: s.youtube, color: '#FF0000' })
  if (s.instagram) list.push({ icon: FaInstagram, name: 'Instagram', url: s.instagram, color: '#E4405F' })
  if (s.tiktok) list.push({ icon: FaTiktok, name: 'TikTok', url: s.tiktok, color: '#00F2EA' })
  if (s.twitch) list.push({ icon: FaTwitch, name: 'Twitch', url: s.twitch, color: '#9146FF' })
  if (s.twitter) list.push({ icon: FaXTwitter, name: 'X', url: s.twitter, color: '#ffffff' })
  return list
}

export default function Footer() {
  const { settings } = useSiteSettings()
  const location = useLocation()
  const brandName = settings.businessName || 'Kadir Demir'
  const socials = buildSocials(settings)
  const showMegaCta = location.pathname !== '/iletisim'

  return (
    <footer className="ft">
      {showMegaCta && (
        <motion.section
          className="ft-cta"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="ft-cta-bg" aria-hidden="true">
            <span className="ft-cta-blob ft-cta-blob-1" />
            <span className="ft-cta-blob ft-cta-blob-2" />
            <span className="ft-cta-noise" />
            <span className="ft-cta-grid" />
          </div>

          <div className="ft-cta-rail" aria-hidden="true">
            <span>İSTANBUL · {new Date().getFullYear()}</span>
            <span className="ft-cta-rail-sep" />
            <span>HAZIR MISIN?</span>
          </div>

          <div className="ft-cta-inner">
            <div className="ft-cta-text">
              <span className="ft-cta-eyebrow">
                <span className="ft-cta-dot" /> İş birliği · iletişim
              </span>
              <h2 className="ft-cta-title">
                <span className="ft-cta-line">Birlikte</span>
                <span className="ft-cta-line">
                  <span className="ft-cta-title-accent">hikâye</span> anlatalım.
                </span>
              </h2>
              <p className="ft-cta-sub">
                Marka iş birliği, sponsorluk veya sadece selam için —
                kanalıma yakışan her projeye açığım.
              </p>
            </div>

            <Link to="/iletisim" className="ft-cta-btn" aria-label="İletişime geç">
              <span className="ft-cta-btn-ring" aria-hidden="true" />
              <span className="ft-cta-btn-glyph">
                <HiArrowUpRight size={36} />
              </span>
              <span className="ft-cta-btn-label">
                <span className="ft-cta-btn-label-top">bana</span>
                <span className="ft-cta-btn-label-bottom">ulaş</span>
              </span>
            </Link>
          </div>

          <span className="ft-cta-edge" aria-hidden="true" />
        </motion.section>
      )}

      <div className="ft-mega">
        <span className="ft-mega-text">{brandName.split(' ')[0].toLowerCase()}</span>
        <span className="ft-mega-text ft-mega-accent">{(brandName.split(' ')[1] || '').toLowerCase()}<span className="ft-mega-dot">.</span></span>
      </div>

      <div className="ft-grid">
        <div className="ft-col ft-col-brand">
          <Link to="/" className="ft-brand">
            <span className="ft-brand-mark">KD</span>
            <span>{brandName}</span>
          </Link>
          <p className="ft-tagline">
            İstanbul'dan yayın yapan içerik üreticisi.<br />
            Hikâye anlatmayı seven biri.
          </p>
          {settings.businessEmail && (
            <a href={`mailto:${settings.businessEmail}`} className="ft-email">
              {settings.businessEmail}
            </a>
          )}
        </div>

        <div className="ft-col">
          <h4 className="ft-col-title">Sayfalar</h4>
          <ul className="ft-list">
            {NAV.map((l) => (
              <li key={l.path}><Link to={l.path}>{l.name}</Link></li>
            ))}
          </ul>
        </div>

        <div className="ft-col">
          <h4 className="ft-col-title">Sosyal</h4>
          <ul className="ft-list">
            {socials.map((s) => (
              <li key={s.name}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ft-social-link"
                  style={{ '--social-color': s.color }}
                >
                  <s.icon size={14} aria-hidden="true" /> {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="ft-col">
          <h4 className="ft-col-title">Yasal</h4>
          <ul className="ft-list">
            {LEGAL.map((l) => (
              <li key={l.path}><Link to={l.path}>{l.name}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ft-bottom">
        <p>© {new Date().getFullYear()} {brandName}.</p>
        <p className="ft-bottom-meta">Sevgiyle üretildi · İstanbul</p>
      </div>
    </footer>
  )
}
