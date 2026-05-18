import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaYoutube, FaInstagram, FaTiktok, FaTwitch } from 'react-icons/fa6'
import { FaXTwitter, FaLinkedinIn, FaDiscord, FaWhatsapp } from 'react-icons/fa6'
import { HiOutlineArrowRight, HiOutlineEnvelope } from 'react-icons/hi2'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { subscribeNewsletterApi } from '../api'
import './Footer.css'

const pageLinks = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Videolar', path: '/videolar' },
  { name: 'Blog', path: '/blog' },
  { name: 'Setup', path: '/setup' },
  { name: 'Hakkımda', path: '/hakkimda' },
  { name: 'İletişim', path: '/iletisim' },
]

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
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const socials = buildSocials(settings)
  const brandName = settings.businessName || 'Kadir Demir'
  const description = settings.description || "YouTube'da oyun, vlog ve eğlence içerikleri üreten bir creator. İstanbul'dan, sevdiğim işi yapıyorum."

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setStatus(null)
    try {
      await subscribeNewsletterApi(email.trim())
      setStatus({ type: 'success', text: 'Teşekkürler! Listeye eklendin.' })
      setEmail('')
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Bir hata oluştu, tekrar dene.' })
    } finally {
      setSubmitting(false)
      setTimeout(() => setStatus(null), 5000)
    }
  }

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

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {brandName} — Tüm hakları saklıdır.</p>
          <p className="footer-bottom-made">Sevgiyle üretildi.</p>
        </div>
      </div>
    </footer>
  )
}
