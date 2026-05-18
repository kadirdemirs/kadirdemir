import { useEffect, useState } from 'react'
import { FaYoutube } from 'react-icons/fa'
import { HiX } from 'react-icons/hi'
import { getYouTubeLiveApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'

const POLL_MS = 5 * 60 * 1000
const DISMISS_KEY = 'kd_live_banner_dismissed_video'

export default function LiveBanner() {
  const { lang } = useLanguage()
  const [data, setData] = useState(null)
  const [dismissedFor, setDismissedFor] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) || '' } catch { return '' }
  })

  useEffect(() => {
    let cancelled = false
    const fetchOnce = () => {
      getYouTubeLiveApi()
        .then((d) => { if (!cancelled) setData(d) })
        .catch(() => {})
    }
    fetchOnce()
    const id = setInterval(fetchOnce, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (!data?.live || !data.videoId) return null
  if (dismissedFor === data.videoId) return null

  const t = (k) => {
    const dict = {
      live:    { tr: 'CANLI', en: 'LIVE' },
      label:   { tr: 'YouTube\'da yayındayım', en: 'I\'m live on YouTube' },
      cta:     { tr: 'Yayına katıl', en: 'Join the stream' },
      dismiss: { tr: 'Bildirimi kapat', en: 'Dismiss notification' },
    }
    return dict[k]?.[lang] || dict[k]?.tr || k
  }

  const url = `https://www.youtube.com/watch?v=${data.videoId}`

  const handleDismiss = (e) => {
    e.preventDefault()
    e.stopPropagation()
    try { sessionStorage.setItem(DISMISS_KEY, data.videoId) } catch { /* ignore */ }
    setDismissedFor(data.videoId)
  }

  return (
    <div
      role="region"
      aria-label={t('label')}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 50%, #dc2626 100%)',
        backgroundSize: '200% 100%',
        animation: 'kd-live-shimmer 3s linear infinite',
        color: '#fff',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
      }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#fff',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontWeight: 600,
          fontSize: '0.88rem',
          letterSpacing: '0.02em',
          flex: '0 1 auto',
          minWidth: 0,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.25)',
              animation: 'kd-live-pulse 1.4s ease-in-out infinite',
            }}
          />
          <strong style={{ letterSpacing: '0.12em' }}>{t('live')}</strong>
        </span>
        <FaYoutube size={18} aria-hidden="true" />
        <span style={{ flex: '0 1 auto', maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.title || t('label')}
        </span>
        <span
          style={{
            background: 'rgba(255, 255, 255, 0.22)',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {t('cta')} →
        </span>
      </a>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('dismiss')}
        title={t('dismiss')}
        style={{
          background: 'rgba(0, 0, 0, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: 999,
          width: 28,
          height: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          padding: 0,
          flex: '0 0 auto',
          marginLeft: 4,
        }}
      >
        <HiX size={16} aria-hidden="true" />
      </button>
      <style>{`
        @keyframes kd-live-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes kd-live-shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="region"][aria-label*="live" i],
          [role="region"][aria-label*="yayın" i] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
