import { useEffect, useMemo, useState } from 'react'
import { FaYoutube } from 'react-icons/fa'
import {
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlinePlay,
  HiOutlineFire,
  HiOutlineX,
  HiOutlineExternalLink,
} from 'react-icons/hi'
import { getYouTubeVideosApi } from '../api'
import { useSEO } from '../hooks/useSEO'
import { BreadcrumbSchema, VideoSchema } from '../components/StructuredData'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { SkeletonGrid } from '../components/Skeleton'
import './Videolar.css'

function formatViews(n) {
  if (!n) return null
  const num = Number(n)
  if (!Number.isFinite(num)) return n
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(num)
}

function parseDuration(iso) {
  if (!iso) return ''
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return ''
  const h = Number(m[1] || 0)
  const min = Number(m[2] || 0)
  const s = Number(m[3] || 0)
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`
}

export default function Videolar() {
  const { settings } = useSiteSettings()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(12)
  const [activeVideo, setActiveVideo] = useState(null)

  useSEO({
    title: 'Tüm Videolar',
    description: 'Kadir Demir YouTube kanalındaki tüm videolar — oyun, vlog ve eğlence içerikleri.',
    path: '/videolar',
  })

  useEffect(() => {
    getYouTubeVideosApi()
      .then((res) => { if (res?.videos) setVideos(res.videos) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const arr = videos.filter((v) => !q || (v.title || '').toLowerCase().includes(q))
    arr.sort((a, b) => {
      if (sort === 'popular') {
        return (Number(b.views) || 0) - (Number(a.views) || 0)
      }
      const da = new Date(a.publishedAt || 0).getTime()
      const db = new Date(b.publishedAt || 0).getTime()
      return sort === 'newest' ? db - da : da - db
    })
    return arr
  }, [query, sort, videos])

  useEffect(() => {
    if (!activeVideo) return
    const onKey = (e) => { if (e.key === 'Escape') setActiveVideo(null) }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [activeVideo])

  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="kd-videos">
      <BreadcrumbSchema items={[{ name: 'Ana Sayfa', path: '/' }, { name: 'Videolar', path: '/videolar' }]} />
      {videos.length > 0 && <VideoSchema videos={videos.slice(0, 12)} />}

      <header className="kd-videos-head">
        <span className="kd-videos-pill">
          <FaYoutube size={14} /> YouTube Kütüphanesi
        </span>
        <div className="kd-videos-head-row">
          <div>
            <h1>
              Tüm <span className="kd-accent">videolar</span>
            </h1>
            <p>{settings.businessName || 'Kadir Demir'} kanalından son içerikler. Aramak, sıralamak ya da göz atmak için kullan.</p>
          </div>
          <div className="kd-videos-count">
            <div className="kd-videos-count-num">{videos.length}</div>
            <div className="kd-videos-count-label">video listeleniyor</div>
          </div>
        </div>
      </header>

      <div className="kd-videos-toolbar">
        <div className="kd-videos-search">
          <HiOutlineSearch size={18} />
          <input
            type="search"
            placeholder="Video başlığı ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="kd-videos-sort">
          <button
            type="button"
            className={`kd-sort-btn ${sort === 'newest' ? 'active' : ''}`}
            onClick={() => setSort('newest')}
          >
            <HiOutlineSparkles size={16} /> En Yeni
          </button>
          <button
            type="button"
            className={`kd-sort-btn ${sort === 'popular' ? 'active' : ''}`}
            onClick={() => setSort('popular')}
          >
            <HiOutlineFire size={16} /> En Çok İzlenen
          </button>
          <button
            type="button"
            className={`kd-sort-btn ${sort === 'oldest' ? 'active' : ''}`}
            onClick={() => setSort('oldest')}
          >
            <HiOutlineCalendar size={16} /> En Eski
          </button>
        </div>
      </div>

      {loading && <SkeletonGrid count={9} kind="video" />}

      {!loading && videos.length === 0 && (
        <div className="kd-videos-empty">
          <p>Henüz video yüklenmedi. Admin panelinden YouTube videolarını senkronize et.</p>
          {settings.youtube && (
            <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="kd-sort-btn active" style={{ marginTop: 16 }}>
              <FaYoutube size={14} /> YouTube'da görüntüle
            </a>
          )}
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div className="kd-videos-grid">
          {visible.map((v, idx) => (
            <button
              key={v.youtubeId || idx}
              type="button"
              onClick={() => setActiveVideo(v)}
              className="kd-video-tile-link"
              style={{ textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' }}
            >
              <article className="kd-video-tile">
                <div className="kd-video-tile-thumb" style={{ backgroundImage: `url(${v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {idx === 0 && sort === 'newest' && <span className="kd-video-badge">YENİ</span>}
                  {parseDuration(v.duration) && (
                    <span className="kd-video-duration-tile">{parseDuration(v.duration)}</span>
                  )}
                  <span className="kd-video-hover-play-tile"><HiOutlinePlay size={28} /></span>
                </div>
                <h4 className="kd-video-tile-title">{v.title}</h4>
                {v.views && <div className="kd-video-tile-meta">{formatViews(v.views)} izlenme</div>}
              </article>
            </button>
          ))}
        </div>
      )}

      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveVideo(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9500,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 960,
              background: '#0a0a0e',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.title || 'Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
              />
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Kapat"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                <HiOutlineX size={20} />
              </button>
            </div>
            <div style={{ padding: '14px 20px 18px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.05rem', flex: '1 1 60%' }}>{activeVideo.title}</h3>
              <a
                href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  padding: '8px 14px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 999,
                }}
              >
                <FaYoutube size={14} /> YouTube'da aç <HiOutlineExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {visible.length < filtered.length && (
        <div className="kd-videos-more">
          <button
            type="button"
            className="kd-videos-more-btn"
            onClick={() => setVisibleCount((c) => c + 12)}
          >
            Daha fazla görüntüle <HiOutlineChevronDown size={16} />
          </button>
        </div>
      )}

      {!loading && filtered.length === 0 && videos.length > 0 && (
        <div className="kd-videos-empty">
          <p>Aradığın videoyu bulamadık.</p>
        </div>
      )}
    </div>
  )
}
