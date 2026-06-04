import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineSearch,
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineVideoCamera,
  HiOutlineDesktopComputer,
  HiOutlineMail,
  HiOutlineSparkles,
  HiOutlineQuestionMarkCircle,
  HiOutlineUserGroup,
  HiOutlineDownload,
  HiOutlineX,
} from 'react-icons/hi'
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa6'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { getBlogsApi, getYouTubeVideosApi } from '../api'
import './CommandPalette.css'

const PAGES = [
  { id: 'home', title: 'Ana Sayfa', path: '/', icon: HiOutlineHome, kind: 'Sayfa' },
  { id: 'about', title: 'Hakkımda', path: '/hakkimda', icon: HiOutlineUser, kind: 'Sayfa' },
  { id: 'blog', title: 'Blog', path: '/blog', icon: HiOutlineDocumentText, kind: 'Sayfa' },
  { id: 'videos', title: 'Videolar', path: '/videolar', icon: HiOutlineVideoCamera, kind: 'Sayfa' },
  { id: 'contact', title: 'İletişim', path: '/iletisim', icon: HiOutlineMail, kind: 'Sayfa' },
  { id: 'sponsor', title: 'Sponsorluk Başvurusu', path: '/sponsor', icon: HiOutlineSparkles, kind: 'Sayfa' },
  { id: 'mediakit', title: 'Medya Kit', path: '/medya-kit', icon: HiOutlineDownload, kind: 'Sayfa' },
  { id: 'ama', title: 'Sor Bana', path: '/sor', icon: HiOutlineQuestionMarkCircle, kind: 'Sayfa' },
]

function normalize(s) {
  return String(s || '').toLowerCase()
    .replaceAll('ı', 'i').replaceAll('İ', 'i')
    .replaceAll('ş', 's').replaceAll('Ş', 's')
    .replaceAll('ç', 'c').replaceAll('Ç', 'c')
    .replaceAll('ğ', 'g').replaceAll('Ğ', 'g')
    .replaceAll('ü', 'u').replaceAll('Ü', 'u')
    .replaceAll('ö', 'o').replaceAll('Ö', 'o')
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [blogs, setBlogs] = useState([])
  const [videos, setVideos] = useState([])
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()
  const { settings } = useSiteSettings()

  // Global Cmd-K / Ctrl-K + tek tuş kısayolları
  useEffect(() => {
    const shortcuts = {
      'g': '/',
      'h': '/hakkimda',
      'v': '/videolar',
      'b': '/blog',
      'i': '/iletisim',
      's': '/sor',
      'l': '/links',
    }
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || document.activeElement?.isContentEditable
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === '/' && !isInput) {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      } else if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey && !open) {
        const dest = shortcuts[e.key.toLowerCase()]
        if (dest) { e.preventDefault(); navigate(dest) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, navigate])

  // Lazy-load blog + video list once palette is opened
  useEffect(() => {
    if (!open) return
    if (blogs.length === 0) {
      getBlogsApi()
        .then((data) => {
          const list = Array.isArray(data) ? data : Array.isArray(data?.blogs) ? data.blogs : []
          setBlogs(list)
        })
        .catch(() => {})
    }
    if (videos.length === 0) {
      getYouTubeVideosApi()
        .then((res) => { if (Array.isArray(res?.videos)) setVideos(res.videos) })
        .catch(() => {})
    }
  }, [open, blogs.length, videos.length])

  useEffect(() => {
    if (open) {
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  const socials = useMemo(() => ([
    settings.youtube && { id: 'yt', title: `YouTube — ${settings.youtubeHandle || '@kadirardademirr'}`, href: settings.youtube, icon: FaYoutube, kind: 'Sosyal' },
    settings.instagram && { id: 'ig', title: `Instagram — ${settings.instagramHandle || ''}`, href: settings.instagram, icon: FaInstagram, kind: 'Sosyal' },
    settings.tiktok && { id: 'tt', title: `TikTok — ${settings.tiktokHandle || ''}`, href: settings.tiktok, icon: FaTiktok, kind: 'Sosyal' },
  ].filter(Boolean)), [settings])

  const items = useMemo(() => {
    const q = normalize(query.trim())
    const blogEntries = blogs.slice(0, 50).map((b) => ({
      id: `blog-${b.slug}`,
      title: b.titleTr || b.title || b.slug,
      path: `/blog/${b.slug}`,
      icon: HiOutlineDocumentText,
      kind: 'Yazı',
      search: normalize([b.titleTr, b.titleEn, b.excerptTr, b.excerptEn, b.category].filter(Boolean).join(' ')),
    }))
    const videoEntries = videos.slice(0, 50)
      .filter((v) => v?.youtubeId && v?.title)
      .map((v) => ({
        id: `video-${v.youtubeId}`,
        title: v.title,
        href: `https://www.youtube.com/watch?v=${v.youtubeId}`,
        icon: HiOutlineVideoCamera,
        kind: 'Video',
        search: normalize(v.title),
      }))

    const all = [...PAGES, ...blogEntries, ...videoEntries, ...socials]
    if (!q) return all.slice(0, 12)
    return all
      .filter((it) => normalize(it.title).includes(q) || normalize(it.kind).includes(q) || (it.search && it.search.includes(q)))
      .slice(0, 20)
  }, [query, blogs, videos, socials])

  useEffect(() => {
    if (activeIdx >= items.length) setActiveIdx(0)
  }, [items.length, activeIdx])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(items.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = items[activeIdx]
      if (!target) return
      if (target.href) {
        window.open(target.href, '_blank', 'noopener,noreferrer')
      } else if (target.path) {
        navigate(target.path)
      }
      setOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="kd-cmdk-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="kd-cmdk"
            role="dialog"
            aria-label="Site içi arama"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kd-cmdk-header">
              <HiOutlineSearch size={18} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Sayfa, yazı, video veya sosyal medya ara…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Arama"
                autoComplete="off"
              />
              <kbd>ESC</kbd>
              <button
                type="button"
                className="kd-cmdk-close"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
              >
                <HiOutlineX size={16} />
              </button>
            </div>
            <ul ref={listRef} className="kd-cmdk-list" role="listbox">
              {items.length === 0 && (
                <li className="kd-cmdk-empty">Sonuç yok. Başka bir kelime dene.</li>
              )}
              {items.map((it, idx) => {
                const Icon = it.icon
                const inner = (
                  <>
                    <span className="kd-cmdk-icon"><Icon size={16} /></span>
                    <span className="kd-cmdk-title">{it.title}</span>
                    <span className="kd-cmdk-kind">{it.kind}</span>
                  </>
                )
                return (
                  <li
                    key={it.id}
                    role="option"
                    aria-selected={idx === activeIdx}
                    className={`kd-cmdk-item ${idx === activeIdx ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    {it.href ? (
                      <a href={it.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                        {inner}
                      </a>
                    ) : (
                      <Link to={it.path} onClick={() => setOpen(false)}>
                        {inner}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
            <footer className="kd-cmdk-footer">
              <span><kbd>↑</kbd><kbd>↓</kbd> gezin</span>
              <span><kbd>↵</kbd> aç</span>
              <span><kbd>esc</kbd> kapat</span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
