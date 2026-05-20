import { Link } from 'react-router-dom'
import { FaYoutube, FaInstagram, FaTiktok, FaTwitch, FaXTwitter } from 'react-icons/fa6'
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
  if (s.youtube) list.push({ icon: FaYoutube, name: 'YouTube', url: s.youtube })
  if (s.instagram) list.push({ icon: FaInstagram, name: 'Instagram', url: s.instagram })
  if (s.tiktok) list.push({ icon: FaTiktok, name: 'TikTok', url: s.tiktok })
  if (s.twitch) list.push({ icon: FaTwitch, name: 'Twitch', url: s.twitch })
  if (s.twitter) list.push({ icon: FaXTwitter, name: 'X', url: s.twitter })
  return list
}

export default function Footer() {
  const { settings } = useSiteSettings()
  const brandName = settings.businessName || 'Kadir Demir'
  const socials = buildSocials(settings)

  return (
    <footer className="ft">
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
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name}
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
