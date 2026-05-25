import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineMail } from 'react-icons/hi'
import { HiArrowUpRight } from 'react-icons/hi2'
import { useLanguage } from '../i18n/LanguageContext'
import './FloatingCTA.css'

/**
 * Sağ alt köşede floating "iletişime geç" butonu.
 * - Ana sayfa ve içerik sayfalarında görünür
 * - İletişim ve admin sayfalarında gizli
 * - Belirli bir scroll'tan sonra ortaya çıkar
 */
export default function FloatingCTA() {
  const location = useLocation()
  const { t } = useLanguage()
  const [show, setShow] = useState(false)

  const isHidden =
    location.pathname === '/iletisim' ||
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/')

  useEffect(() => {
    if (isHidden) { setShow(false); return }
    const onScroll = () => setShow(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHidden])

  return (
    <AnimatePresence>
      {!isHidden && show && (
        <motion.div
          className="kd-fab-wrap"
          initial={{ opacity: 0, scale: 0.7, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 30 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/iletisim"
            className="kd-fab"
            aria-label={t('common.contact')}
            data-cursor="hover"
          >
            <span className="kd-fab-ring" aria-hidden="true" />
            <span className="kd-fab-icon"><HiOutlineMail size={20} /></span>
            <span className="kd-fab-label">
              {t('common.contact')}
              <HiArrowUpRight size={14} />
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
