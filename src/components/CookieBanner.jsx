import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import './CookieBanner.css'

const LS_KEY = 'kade_cookie_consent_v1'

function readStoredConsent() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && (parsed.value === 'accept' || parsed.value === 'decline')) return parsed
    return null
  } catch { return null }
}

function applyConsent(value) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ value, ts: Date.now() }))
  } catch { /* ignore */ }
  // Eğer 'decline' ise GA4'ü pasif yap
  if (value === 'decline' && typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try { window.gtag('consent', 'update', { analytics_storage: 'denied' }) } catch { /* ignore */ }
  } else if (value === 'accept' && typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try { window.gtag('consent', 'update', { analytics_storage: 'granted' }) } catch { /* ignore */ }
  }
}

export default function CookieBanner() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after small delay so it doesn't pop on first paint
    const stored = readStoredConsent()
    if (stored) return
    const id = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(id)
  }, [])

  const accept = () => { applyConsent('accept'); setVisible(false) }
  const decline = () => { applyConsent('decline'); setVisible(false) }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Cookie consent"
          className="kd-cookie"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="kd-cookie-inner">
            <div className="kd-cookie-text">
              <strong className="kd-cookie-title">{t('cookie.title')}</strong>
              <p>{t('cookie.body')}</p>
              <Link to="/cerez-politikasi" className="kd-cookie-link">
                {t('cookie.policy')} ↗
              </Link>
            </div>
            <div className="kd-cookie-actions">
              <button type="button" className="kd-cookie-btn kd-cookie-btn-ghost" onClick={decline}>
                {t('cookie.decline')}
              </button>
              <button type="button" className="kd-cookie-btn kd-cookie-btn-primary" onClick={accept}>
                {t('cookie.accept')}
              </button>
              <button type="button" className="kd-cookie-close" aria-label="dismiss" onClick={decline}>
                <HiOutlineX size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
