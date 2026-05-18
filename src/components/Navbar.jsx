import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiMenuAlt3, HiX, HiOutlineSun, HiOutlineMoon, HiOutlineGlobeAlt, HiOutlineUserCircle, HiOutlineLogout, HiOutlineCog } from 'react-icons/hi'
import { FaYoutube } from 'react-icons/fa'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useTheme } from '../i18n/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import { getSessionApi, logoutApi } from '../api'
import './Navbar.css'

const navLinks = [
  { name: 'Ana Sayfa', path: '/' },
  { name: 'Hakkımda', path: '/hakkimda' },
  { name: 'Blog', path: '/blog' },
  { name: 'Videolar', path: '/videolar' },
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
  const [user, setUser] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    getSessionApi()
      .then((d) => { if (d?.authenticated) setUser(d.user) })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try { await logoutApi() } catch { /* ignore */ }
    setUser(null)
    setShowUserMenu(false)
    window.location.href = '/'
  }

  const youtubeUrl = settings.youtube || 'https://youtube.com/@kadirdemir'
  const subscribeUrl = `${youtubeUrl}${youtubeUrl.includes('?') ? '&' : '?'}sub_confirmation=1`
  const brandName = settings.businessName || 'Kadir Demir'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-badge">
            <FaYoutube size={18} />
          </span>
          <span className="navbar-logo-name">{brandName}</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.name}
              {location.pathname === link.path && (
                <motion.div
                  className="active-indicator"
                  layoutId="activeNav"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="navbar-right">
          <button
            type="button"
            className="navbar-icon-btn"
            onClick={toggleLang}
            aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
            title={lang === 'tr' ? 'EN' : 'TR'}
          >
            <HiOutlineGlobeAlt size={18} />
            <span className="navbar-icon-btn-label">{lang === 'tr' ? 'EN' : 'TR'}</span>
          </button>
          <button
            type="button"
            className="navbar-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aydınlık temaya geç' : 'Koyu temaya geç'}
            title={theme === 'dark' ? 'Aydınlık' : 'Koyu'}
          >
            {theme === 'dark' ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
          </button>
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="navbar-icon-btn"
                onClick={() => setShowUserMenu((v) => !v)}
                aria-label="Hesap"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                style={{ paddingRight: 12 }}
              >
                <HiOutlineUserCircle size={18} />
                <span className="navbar-icon-btn-label" style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username || (lang === 'en' ? 'Account' : 'Hesabım')}
                </span>
              </button>
              {showUserMenu && (
                <>
                  <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                  <div
                    role="menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: 200,
                      zIndex: 999,
                      background: 'rgba(20, 20, 24, 0.96)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      padding: 6,
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: '0.88rem' }}
                    >
                      <HiOutlineCog size={16} /> {lang === 'en' ? 'Admin Panel' : 'Admin Paneli'}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit', textAlign: 'left' }}
                    >
                      <HiOutlineLogout size={16} /> {lang === 'en' ? 'Logout' : 'Çıkış yap'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <a
            href={subscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-cta"
          >
            <FaYoutube size={16} />
            <span>Abone Ol</span>
          </a>
        </div>

        <div className="navbar-mobile-right">
          <button
            type="button"
            className="navbar-icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aydınlık temaya geç' : 'Koyu temaya geç'}
          >
            {theme === 'dark' ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
          </button>
          <button
            className="navbar-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menüyü aç/kapat"
          >
            {isOpen ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={link.path}
                  className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            <button
              type="button"
              className="mobile-lang-btn"
              onClick={toggleLang}
            >
              <HiOutlineGlobeAlt size={18} />
              <span>{lang === 'tr' ? 'English' : 'Türkçe'}</span>
            </button>
            <a
              href={subscribeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-cta"
            >
              <FaYoutube size={16} />
              <span>Abone Ol</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
