import { useEffect, useState } from 'react'
import { HiOutlineDownload, HiOutlineX } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'

const DISMISS_KEY = 'kd_install_dismissed_at'
const INSTALLED_KEY = 'kd_install_done'
const DISMISS_TTL = 1000 * 60 * 60 * 24 * 14 // 14 gün

export default function InstallPrompt() {
  const { lang } = useLanguage()
  const [event, setEvent] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(INSTALLED_KEY) === '1') return
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (Date.now() - dismissedAt < DISMISS_TTL) return

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) {
      localStorage.setItem(INSTALLED_KEY, '1')
      return
    }

    const promptHandler = (e) => {
      e.preventDefault()
      setEvent(e)
      const showTimer = setTimeout(() => setVisible(true), 4000)
      return () => clearTimeout(showTimer)
    }
    const installedHandler = () => {
      localStorage.setItem(INSTALLED_KEY, '1')
      setVisible(false)
      setEvent(null)
    }
    window.addEventListener('beforeinstallprompt', promptHandler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', promptHandler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  if (!visible || !event) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  const install = async () => {
    try {
      event.prompt()
      const choice = await event.userChoice
      if (choice?.outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, '1')
        setVisible(false)
        setEvent(null)
        return
      }
    } catch { /* swallow */ }
    dismiss()
  }

  const t = (k) => {
    const dict = {
      title:  { tr: 'Siteyi uygulama olarak yükle', en: 'Install as an app' },
      body:   { tr: 'Hızlı erişim için ana ekrana ekle, çevrimdışı kullan.', en: 'Add to your home screen for fast offline access.' },
      install:{ tr: 'Yükle', en: 'Install' },
      later:  { tr: 'Sonra', en: 'Later' },
    }
    return dict[k]?.[lang] || dict[k]?.tr || k
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        maxWidth: 380,
        width: 'calc(100% - 24px)',
        zIndex: 9000,
        background: 'rgba(14, 14, 18, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <HiOutlineDownload size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', marginBottom: 4 }}>
          {t('title')}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.45 }}>
          {t('body')}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={install}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #fb923c)',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {t('install')}
          </button>
          <button
            type="button"
            onClick={dismiss}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {t('later')}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={lang === 'en' ? 'Close' : 'Kapat'}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 4,
        }}
      >
        <HiOutlineX size={18} />
      </button>
    </div>
  )
}
