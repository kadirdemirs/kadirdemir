import { Link } from 'react-router-dom'
import { FaYoutube, FaInstagram, FaTiktok, FaTwitch } from 'react-icons/fa6'
import { FaXTwitter, FaLinkedinIn, FaDiscord, FaWhatsapp, FaPatreon } from 'react-icons/fa6'
import { SiKofi, SiBuymeacoffee } from 'react-icons/si'
import { HiOutlineArrowRight, HiOutlineEnvelope, HiOutlineHeart } from 'react-icons/hi2'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useNewsletterSubscribe } from '../hooks/useNewsletterSubscribe'
import './Footer.css'

const pageLinks = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Videolar', path: '/videolar' },
  { name: 'Blog', path: '/blog' },
  { name: 'Setup', path: '/setup' },
  { name: 'Hakkımda', path: '/hakkimda' },
  { name: 'İletişim', path: '/iletisim' },
  { name: 'Partnerler', path: '/partnerler' },
  { name: 'Sponsor', path: '/sponsor' },
]

function buildSupportLinks(settings) {
  const list = []
  if (settings.patreon) list.push({ icon: FaPatreon, name: 'Patreon', url: settings.patreon, color: '#ff424d' })
  if (settings.kofi) list.push({ icon: SiKofi, name: 'Ko-fi', url: settings.kofi, color: '#ff5e5b' })
  if (settings.buymeacoffee) list.push({ icon: SiBuymeacoffee, name: 'Buy Me a Coffee', url: settings.buymeacoffee, color: '#ffdd00' })
  if (settings.youtubeMembership) list.push({ icon: FaYoutube, name: 'YouTube Member', url: settings.youtubeMembership, color: '#ff0000' })
  return list
}

const legalLinks = [
  { name: 'KVKK', path: '/kvkk' },
  { name: 'Gizlilik', path: '/gizlilik' },
  { name: 'Çerez Politikası', path: '/cerez-politikasi' },
]

function buildSocials(settings) {
  const list = []
  if (settings.youtube) list.push({ icon: FaYoutube, name: 'YouTube', url: settings.youtube })
  if (settings.instagram) list.push({ icon: FaInstagram, name: 'Instagram', url: settings.instagram })
  if (settings.tiktok) list.push({ icon: FaTiktok, name: 'TikTok', url: settings.tiktok })
  if (settings.twitch) list.push({ icon: FaTwitch, name: 'Twitch', url: settings.twitch })
  if (settings.twitter) list.push({ icon: FaXTwitter, name: 'X', url: settings.twitter })
  if (settings.linkedin) list.push({ icon: FaLinkedinIn, name: 'LinkedIn', url: settings.linkedin })
  if (settings.discord) list.push({ icon: FaDiscord, name: 'Discord', url: settings.discord })
  if (settings.whatsapp) list.push({ icon: FaWhatsapp, name: 'WhatsApp', url: settings.whatsapp })
  return list
}

export default function Footer() {
  const { settings } = useSiteSettings()
  const { email, setEmail, status, submitting, submit } = useNewsletterSubscribe()

  const socials = buildSocials(settings)
  const supportLinks = buildSupportLinks(settings)
  const brandName = settings.businessName || 'Kadir Demir'
  const description = settings.description || "YouTube'da oyun, vlog ve eğlence içerikleri üreten bir creator. İstanbul'dan, sevdiğim işi yapıyorum."

  const handleSubmit = submit

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-badge">
                <FaYoutube size={18} />
              </span>
              <span className="footer-logo-name">{brandName}</span>
            </Link>
            <p className="footer-desc">{description}</p>
            <div className="footer-socials">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="footer-social"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Sayfalar</h4>
            <ul className="footer-list">
              {pageLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">İletişim</h4>
            <ul className="footer-list footer-contact-list">
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  <span className="footer-contact-label">Genel</span>
                </li>
              )}
              {settings.businessEmail && (
                <li>
                  <a href={`mailto:${settings.businessEmail}`}>{settings.businessEmail}</a>
                  <span className="footer-contact-label">İş birlikleri</span>
                </li>
              )}
            </ul>
            <ul className="footer-list footer-legal-list">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col footer-newsletter-col">
            <h4 className="footer-col-title">Bültenime katıl</h4>
            <p className="footer-newsletter-desc">
              Yeni video duyurularını ve perde arkası içerikleri kaçırma.
            </p>
            <form className="footer-newsletter" onSubmit={handleSubmit}>
              <div className="footer-input-wrap">
                <HiOutlineEnvelope className="footer-input-icon" size={18} />
                <input
                  type="email"
                  placeholder="E-posta adresin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
              <button type="submit" aria-label="Abone ol" disabled={submitting}>
                <HiOutlineArrowRight size={18} />
              </button>
            </form>
            {status && (
              <p className={`footer-newsletter-${status.type === 'success' ? 'success' : 'error'}`}>
                {status.text}
              </p>
            )}
          </div>
        </div>

        {supportLinks.length > 0 && (
          <div
            style={{
              marginTop: 24,
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(255, 66, 77, 0.06), rgba(255, 221, 0, 0.06))',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ec4899, #f97316)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <HiOutlineHeart size={20} />
              </span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--white, #fff)', fontSize: '0.95rem' }}>
                  İçeriklere destek ol
                </div>
                <div style={{ color: 'var(--gray-light, #94a3b8)', fontSize: '0.82rem' }}>
                  Bağışın yeni ekipman ve daha iyi içerik demek.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {supportLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social"
                  title={s.name}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', textDecoration: 'none', color: 'var(--white, #fff)', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <s.icon size={14} color={s.color} /> {s.name}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {brandName} — Tüm hakları saklıdır.</p>
          <p className="footer-bottom-made">Sevgiyle üretildi.</p>
        </div>
      </div>
    </footer>
  )
}
