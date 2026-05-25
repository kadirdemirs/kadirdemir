import { useState } from 'react'
import { HiOutlineLink, HiOutlineCheck, HiOutlineShare } from 'react-icons/hi'
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { FaWhatsapp } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import './BlogShareDock.css'

/**
 * Sticky floating share dock — left side, desktop only.
 */
export default function BlogShareDock({ title, url }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const encodedTitle = encodeURIComponent(title || '')
  const encodedUrl = encodeURIComponent(url || (typeof window !== 'undefined' ? window.location.href : ''))

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* ignore */ }
  }

  const handleSystemShare = async () => {
    try {
      await navigator.share({ title, url: url || window.location.href })
    } catch { /* user dismissed */ }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <aside className="kd-share-dock" aria-label={t('blog.share')}>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="kd-share-dock-btn"
        aria-label={t('blog.shareTwitter')}
      >
        <FaXTwitter size={16} />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="kd-share-dock-btn"
        aria-label={t('blog.shareLinkedin')}
      >
        <FaLinkedinIn size={16} />
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="kd-share-dock-btn"
        aria-label="WhatsApp"
      >
        <FaWhatsapp size={16} />
      </a>
      <button
        type="button"
        className="kd-share-dock-btn"
        onClick={handleCopy}
        aria-label={copied ? t('blog.shareCopied') : t('blog.shareCopy')}
        title={copied ? t('blog.shareCopied') : t('blog.shareCopy')}
      >
        {copied ? <HiOutlineCheck size={16} /> : <HiOutlineLink size={16} />}
      </button>
      {hasNativeShare && (
        <button
          type="button"
          className="kd-share-dock-btn"
          onClick={handleSystemShare}
          aria-label={t('blog.share')}
        >
          <HiOutlineShare size={16} />
        </button>
      )}
    </aside>
  )
}
