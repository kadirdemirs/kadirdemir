import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineSearch,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi'
import { HiArrowUpRight } from 'react-icons/hi2'
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa6'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useTheme } from '../i18n/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import './Navbar.css'

const navLinks = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Videolar', path: '/videolar' },
  { name: 'Hakkımda', path: '/hakkimda' },
  { name: 'Blog', path: '/blog' },
  { name: 'İletişim', path: '/iletisim' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { settings } = useSiteSettings()
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  const brandName = settings.businessName || 'Kadir Demir'

  return (
    <motion.nav
      className={`nv ${scrolled ? 'nv--scrolled' : ''} ${isOpen ? 'nv--open' : ''}`}
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      <div className="nv-pill">
        <Link to="/" className="nv-brand" aria-label={brandName}>
          <span className="nv-brand-text">{brandName.split(' ')[0].toLowerCase()}</span>
          <span className="nv-brand-dot" />
        </Link>

        <div className="nv-links" role="navigation">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`nv-link ${location.pathname === l.path ? 'is-active' : ''}`}
            >
              {l.name}
            </Link>
          ))}
        </div>

        <div className="nv-actions">
          <button
            type="button"
            className="nv-icon"
            aria-label="Ara (Ctrl+K)"
            title="Ctrl+K"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          >
            <HiOutlineSearch size={16} />
          </button>
          <button
            type="button"
            className="nv-icon nv-icon-text-btn"
            aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
            onClick={toggleLang}
          >
            <span className="nv-icon-text">{lang === 'tr' ? 'EN' : 'TR'}</span>
          </button>
          <button
            type="button"
            className="nv-icon"
            aria-label="Tema değiştir"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <HiOutlineSun size={16} /> : <HiOutlineMoon size={16} />}
          </button>

          <Link to="/iletisim" className="nv-cta">
            <span>Bana Ulaş</span>
            <span className="nv-cta-arrow"><HiArrowUpRight size={14} /></span>
          </Link>

          <button
            type="button"
            className="nv-mobile-toggle"
            aria-label="Menüyü aç"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
          >
            {isOpen ? <HiOutlineX size={20} /> : <HiOutlineMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className="nv-drawer" aria-hidden={!isOpen}>
        <div className="nv-drawer-inner">
          {navLinks.map((l, i) => (
            <Link
              key={l.path}
              to={l.path}
              className={`nv-drawer-link ${location.pathname === l.path ? 'is-active' : ''}`}
            >
              <span className="nv-drawer-num">{String(i + 1).padStart(2, '0')}</span>
              {l.name}
            </Link>
          ))}
          <Link to="/iletisim" className="nv-drawer-cta">
            Bana Ulaş <HiArrowUpRight size={16} />
          </Link>
          <div className="nv-drawer-socials">
            {settings.youtube && (
              <a href={settings.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={{ '--social-color': '#FF0000' }}>
                <FaYoutube size={18} />
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ '--social-color': '#E4405F' }}>
                <FaInstagram size={18} />
              </a>
            )}
            {settings.tiktok && (
              <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" style={{ '--social-color': '#00F2EA' }}>
                <FaTiktok size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
