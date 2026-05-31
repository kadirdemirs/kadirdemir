import { Link } from 'react-router-dom'
import { FaYoutube, FaInstagram, FaTiktok, FaDiscord, FaLinkedin, FaXTwitter } from 'react-icons/fa6'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import './Footer.css'

function buildSocials(s) {
  const list = []
  if (s.youtube) list.push({ icon: FaYoutube, name: 'YouTube', url: s.youtube, color: '#FF0000' })
  if (s.instagram) list.push({ icon: FaInstagram, name: 'Instagram', url: s.instagram, color: '#E4405F' })
  if (s.tiktok) list.push({ icon: FaTiktok, name: 'TikTok', url: s.tiktok, color: '#00F2EA' })
  if (s.twitter) list.push({ icon: FaXTwitter, name: 'X', url: s.twitter, color: '#ffffff' })
  if (s.discord) list.push({ icon: FaDiscord, name: 'Discord', url: s.discord, color: '#5865F2' })
  if (s.linkedin) list.push({ icon: FaLinkedin, name: 'LinkedIn', url: s.linkedin, color: '#0A66C2' })
  return list
}

export default function Footer() {
  const { settings } = useSiteSettings()
  const { t } = useLanguage()
  const brandName = settings.businessName || 'Kadir Demir'
  const socials = buildSocials(settings)

  const NAV = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.about'), path: '/hakkimda' },
    { name: t('nav.videos'), path: '/videolar' },
    { name: t('nav.blog'), path: '/blog' },
    { name: t('nav.contact'), path: '/iletisim' },
  ]

  const COLLAB = [
    { name: t('footer.collab'), path: '/sponsor' },
    { name: t('footer.mediaKit'), path: '/medya-kit' },
    { name: t('footer.askMe'), path: '/sor' },
    { name: t('nav.search') || 'Arama', path: '/ara' },
  ]

  const LEGAL = [
    { name: 'KVKK', path: '/kvkk' },
    { name: t('footer.legal') === 'Yasal' ? 'Gizlilik' : 'Privacy', path: '/gizlilik' },
    { name: t('footer.legal') === 'Yasal' ? 'Çerezler' : 'Cookies', path: '/cerez-politikasi' },
  ]

  return (
    <footer className="ft">
      <div className="ft-mega">
        <span className="ft-mega-text">{brandName.split(' ')[0].toLowerCase()}</span>
        {(brandName.split(' ')[1] || '') && (
          <span className="ft-mega-text ft-mega-accent">{(brandName.split(' ')[1] || '').toLowerCase()}<span className="ft-mega-dot">.</span></span>
        )}
      </div>

      <div className="ft-grid">
        <div className="ft-col ft-col-brand">
          <Link to="/" className="ft-brand">
            <span className="ft-brand-mark">KD</span>
            <span>{brandName}</span>
          </Link>
          <p className="ft-tagline">
            {t('footer.tagline')}<br />
            {t('footer.taglineSub')}
          </p>
          {settings.businessEmail && (
            <a href={`mailto:${settings.businessEmail}`} className="ft-email">
              {settings.businessEmail}
            </a>
          )}
        </div>

        <div className="ft-col">
          <h4 className="ft-col-title">{t('footer.pages')}</h4>
          <ul className="ft-list">
            {NAV.map((l) => (
              <li key={l.path}><Link to={l.path}>{l.name}</Link></li>
            ))}
          </ul>
        </div>

        <div className="ft-col">
          <h4 className="ft-col-title">{t('footer.social')}</h4>
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
          <h4 className="ft-col-title">{t('footer.collabTitle')}</h4>
          <ul className="ft-list">
            {COLLAB.map((l) => (
              <li key={l.path}><Link to={l.path}>{l.name}</Link></li>
            ))}
          </ul>
        </div>

        <div className="ft-col">
          <h4 className="ft-col-title">{t('footer.legal')}</h4>
          <ul className="ft-list">
            {LEGAL.map((l) => (
              <li key={l.path}><Link to={l.path}>{l.name}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ft-bottom">
        <p>© {new Date().getFullYear()} {brandName}. {t('footer.copyright')}.</p>
      </div>
    </footer>
  )
}
