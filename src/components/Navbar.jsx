import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineSearch,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineGlobeAlt,
} from 'react-icons/hi'
import { HiArrowUpRight, HiOutlineCheck } from 'react-icons/hi2'
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa6'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useTheme } from '../i18n/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import './Navbar.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const location = useLocation()
  const { settings } = useSiteSettings()
  const { theme, toggleTheme } = useTheme()
  const { lang, setLang, t, langs, meta, currentMeta } = useLanguage()
  const langRef = useRef(null)

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.videos'), path: '/videolar' },
    { name: t('nav.about'), path: '/hakkimda' },
    { name: t('nav.blog'), path: '/blog' },
    { name: t('nav.contact'), path: '/iletisim' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setLangOpen(false)
  }, [location])

  useEffect(() => {
    if (!langOpen) return
    const onDoc = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [langOpen])

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
            aria-label={`${t('nav.search')} (Ctrl+K)`}
            title="Ctrl+K"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          >
            <HiOutlineSearch size={16} />
          </button>

          {/* Language switcher (3-state dropdown) */}
          <div className="nv-lang" ref={langRef}>
            <button
              type="button"
              className="nv-icon nv-icon-text-btn nv-lang-trigger"
              aria-label={t('nav.changeLanguage')}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              onClick={() => setLangOpen((v) => !v)}
            >
              <HiOutlineGlobeAlt size={14} aria-hidden="true" />
              <span className="nv-icon-text">{currentMeta.short}</span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.ul
                  role="listbox"
                  className="nv-lang-menu"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  {langs.map((code) => {
                    const m = meta[code]
                    const active = code === lang
                    return (
                      <li key={code}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`nv-lang-option ${active ? 'is-active' : ''}`}
                          onClick={() => { setLang(code); setLangOpen(false) }}
                        >
                          <span className="nv-lang-flag" aria-hidden="true">{m.flag}</span>
                          <span className="nv-lang-label">{m.label}</span>
                          <span className="nv-lang-short">{m.short}</span>
                          {active && <HiOutlineCheck size={14} className="nv-lang-check" />}
                        </button>
                      </li>
                    )
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="nv-icon nv-theme-toggle"
            aria-label={t('nav.changeTheme')}
            onClick={toggleTheme}
            data-theme-active={theme}
          >
            <span className="nv-theme-icon nv-theme-sun" aria-hidden="true"><HiOutlineSun size={16} /></span>
            <span className="nv-theme-icon nv-theme-moon" aria-hidden="true"><HiOutlineMoon size={16} /></span>
          </button>

          <Link to="/iletisim" className="nv-cta">
            <span>{t('nav.contactCta')}</span>
            <span className="nv-cta-arrow"><HiArrowUpRight size={14} /></span>
          </Link>

          <button
            type="button"
            className="nv-mobile-toggle"
            aria-label={t('nav.menu')}
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
            {t('nav.contactCta')} <HiArrowUpRight size={16} />
          </Link>
          <div className="nv-drawer-lang" role="group" aria-label={t('nav.changeLanguage')}>
            {langs.map((code) => (
              <button
                key={code}
                type="button"
                className={`nv-drawer-lang-btn ${code === lang ? 'is-active' : ''}`}
                onClick={() => setLang(code)}
                aria-pressed={code === lang}
              >
                <span aria-hidden="true">{meta[code].flag}</span> {meta[code].short}
              </button>
            ))}
          </div>
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
