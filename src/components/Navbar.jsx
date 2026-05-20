import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineSearch,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useTheme } from '../i18n/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import './Navbar.css'

const navLinks = [
  { name: 'Hakkımda', path: '/hakkimda' },
  { name: 'Videolar', path: '/videolar' },
  { name: 'Blog', path: '/blog' },
  { name: 'Setup', path: '/setup' },
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
    <nav className={`nv ${scrolled ? 'nv--scrolled' : ''} ${isOpen ? 'nv--open' : ''}`}>
      <div className="nv-inner">
        <Link to="/" className="nv-brand" aria-label={brandName}>
          <span className="nv-brand-mark">KD</span>
          <span className="nv-brand-text">{brandName.toLowerCase()}<span className="nv-brand-dot">.</span></span>
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
            <HiOutlineSearch size={18} />
          </button>
          <button
            type="button"
            className="nv-icon"
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
            {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
          </button>
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
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`nv-drawer-link ${location.pathname === l.path ? 'is-active' : ''}`}
            >
              <span className="nv-drawer-num">{String(navLinks.indexOf(l) + 1).padStart(2, '0')}</span>
              {l.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
