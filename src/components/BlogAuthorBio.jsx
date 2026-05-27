import { Link } from 'react-router-dom'
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa6'
import { HiOutlineMail } from 'react-icons/hi'
import { HiArrowUpRight } from 'react-icons/hi2'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import ResponsivePortrait from './ResponsivePortrait'
import './BlogAuthorBio.css'

export default function BlogAuthorBio() {
  const { settings } = useSiteSettings()
  const { lang } = useLanguage()
  const brandName = settings.businessName || 'Kadir Demir'

  const bioLine = lang === 'en'
    ? 'YouTube creator broadcasting from Istanbul. Sharing stories about gaming, vlogs and the creative process.'
    : "İstanbul'dan yayın yapan YouTube içerik üreticisi. Oyun, vlog ve yaratıcı süreç üzerine yazıyor."

  const aboutCta = lang === 'en' ? 'Read more about me' : 'Hakkımda daha fazlası'

  return (
    <aside className="kd-author-bio glass-card" aria-label={brandName}>
      <div className="kd-author-bio-portrait">
        <ResponsivePortrait
          alt={brandName}
          className="kd-author-bio-img"
          sizes="120px"
        />
      </div>
      <div className="kd-author-bio-content">
        <div className="kd-author-bio-eyebrow">
          {lang === 'en' ? 'Author' : 'Yazar'}
        </div>
        <h3 className="kd-author-bio-name">{brandName}</h3>
        <p className="kd-author-bio-line">{bioLine}</p>
        <div className="kd-author-bio-actions">
          <Link to="/hakkimda" className="kd-author-bio-link">
            {aboutCta} <HiArrowUpRight size={14} />
          </Link>
          <div className="kd-author-bio-socials">
            {settings.youtube && (
              <a href={settings.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={{ '--c': '#FF0000' }}>
                <FaYoutube size={16} />
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ '--c': '#E4405F' }}>
                <FaInstagram size={16} />
              </a>
            )}
            {settings.tiktok && (
              <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" style={{ '--c': '#00F2EA' }}>
                <FaTiktok size={16} />
              </a>
            )}
            {(settings.businessEmail || settings.email) && (
              <a href={`mailto:${settings.businessEmail || settings.email}`} aria-label="Email" style={{ '--c': 'var(--primary)' }}>
                <HiOutlineMail size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
