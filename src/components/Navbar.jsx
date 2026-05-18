import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiMenuAlt3, HiX } from 'react-icons/hi'
import { FaYoutube } from 'react-icons/fa'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
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
