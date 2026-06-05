import { useEffect, useMemo, useState } from 'react'
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa6'
import {
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlinePlay,
  HiOutlineFire,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlineFilm,
} from 'react-icons/hi'
import { getYouTubeVideosApi } from '../api'
import { useSEO } from '../hooks/useSEO'
import { BreadcrumbSchema, VideoSchema } from '../components/StructuredData'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
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

function durationSecs(iso) {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return null
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)
}

function isShort(video) {
  const s = durationSecs(video.duration)
  return s !== null && s <= 62
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
  const { t, lang } = useLanguage()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [typeFilter, setTypeFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(12)
  const [activeVideo, setActiveVideo] = useState(null)

  const isEn = lang === 'en'

  const TYPE_TABS = [
    { key: 'all',       label: isEn ? 'All' : 'Tümü',       icon: null },
    { key: 'yatay',     label: isEn ? 'Videos' : 'Yatay',   icon: <HiOutlineFilm size={14} /> },
    { key: 'shorts',    label: 'Shorts',                      icon: <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>▮</span> },
    { key: 'tiktok',    label: 'TikTok',                      icon: <FaTiktok size={13} /> },
    { key: 'instagram', label: 'Instagram',                   icon: <FaInstagram size={13} /> },
  ]

  useSEO({
    title: `${t('videos.titleA')} ${t('videos.titleB')}`,
    description: `${settings.businessName || 'Kadir Demir'} — ${t('videos.sub')}`,
    path: '/videolar',
  })

  useEffect(() => {
    getYouTubeVideosApi()
      .then((res) => { if (res?.videos) setVideos(res.videos) })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (typeFilter === 'tiktok' || typeFilter === 'instagram') return []
    const q = query.trim().toLowerCase()
    const arr = videos.filter((v) => {
      if (q && !(v.title || '').toLowerCase().includes(q)) return false
      if (typeFilter === 'shorts') return isShort(v)
      if (typeFilter === 'yatay') return !isShort(v)
      return true
    })
    arr.sort((a, b) => {
      if (sort === 'popular') return (Number(b.views) || 0) - (Number(a.views) || 0)
      const da = new Date(a.publishedAt || 0).getTime()
      const db = new Date(b.publishedAt || 0).getTime()
      return sort === 'newest' ? db - da : da - db
    })
    return arr
  }, [query, sort, videos, typeFilter])

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

  const featuredVideo = useMemo(() => {
    if (!videos.length) return null
    return [...videos].sort(
      (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
    )[0]
  }, [videos])

  return (
    <div className="kd-videos">
      <BreadcrumbSchema items={[{ name: t('nav.home'), path: '/' }, { name: t('nav.videos'), path: '/videolar' }]} />
      {videos.length > 0 && <VideoSchema videos={videos.slice(0, 12)} />}

      <header className="kd-videos-head">
        <span className="kd-videos-pill">
          <FaYoutube size={14} /> {t('videos.pill')}
        </span>
        <div className="kd-videos-head-row">
          <div>
            <h1>
              {t('videos.titleA')} <span className="kd-accent">{t('videos.titleB')}</span>
            </h1>
            <p>{settings.businessName || 'Kadir Demir'} {t('videos.sub')}</p>
          </div>
          <div className="kd-videos-count">
            <div className="kd-videos-count-num">{videos.length}</div>
            <div className="kd-videos-count-label">{t('videos.countLabel')}</div>
          </div>
        </div>
      </header>

      {/* Öne çıkan — en yeni video */}
      {!loading && featuredVideo && typeFilter === 'all' && (
        <section className="kd-videos-featured">
          <p className="kd-videos-featured-eyebrow">
            <HiOutlineSparkles size={13} /> {isEn ? 'Latest video' : 'Son video'}
          </p>
          <button
            type="button"
            className="kd-featured-card"
            onClick={() => setActiveVideo(featuredVideo)}
          >
            <div
              className="kd-featured-thumb"
              style={{ backgroundImage: `url(${featuredVideo.thumbnail || `https://i.ytimg.com/vi/${featuredVideo.youtubeId}/hqdefault.jpg`})` }}
            >
              <span className="kd-video-badge">{t('videos.badgeNew')}</span>
              {parseDuration(featuredVideo.duration) && (
                <span className="kd-video-duration-tile">{parseDuration(featuredVideo.duration)}</span>
              )}
              <div className="kd-featured-play-wrap">
                <span className="kd-video-hover-play-tile"><HiOutlinePlay size={36} /></span>
              </div>
            </div>
            <div className="kd-featured-info">
              <h3>{featuredVideo.title}</h3>
              {featuredVideo.views && (
                <div className="kd-featured-meta">
                  <span>👁 {formatViews(featuredVideo.views)} {t('home.platformsSub_views').toLowerCase()}</span>
                </div>
              )}
              <a
                href={`https://www.youtube.com/watch?v=${featuredVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kd-sort-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <FaYoutube size={14} /> {t('videos.open')} <HiOutlineExternalLink size={12} />
              </a>
            </div>
          </button>
        </section>
      )}

      {/* Birleşik filtre paneli */}
      <div className="kd-videos-filters">
        <div className="kd-videos-filters-row">
          <div className="kd-videos-type-tabs">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`kd-type-tab ${typeFilter === tab.key ? 'active' : ''}`}
                onClick={() => { setTypeFilter(tab.key); setVisibleCount(12) }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          {typeFilter !== 'tiktok' && typeFilter !== 'instagram' && (
            <div className="kd-videos-sort">
              <button
                type="button"
                className={`kd-sort-btn ${sort === 'newest' ? 'active' : ''}`}
                onClick={() => setSort('newest')}
              >
                <HiOutlineSparkles size={16} /> {t('videos.sortNewest')}
              </button>
              <button
                type="button"
                className={`kd-sort-btn ${sort === 'popular' ? 'active' : ''}`}
                onClick={() => setSort('popular')}
              >
                <HiOutlineFire size={16} /> {t('videos.sortPopular')}
              </button>
              <button
                type="button"
                className={`kd-sort-btn ${sort === 'oldest' ? 'active' : ''}`}
                onClick={() => setSort('oldest')}
              >
                <HiOutlineCalendar size={16} /> {t('videos.sortOldest')}
              </button>
            </div>
          )}
        </div>
        {typeFilter !== 'tiktok' && typeFilter !== 'instagram' && (
          <div className="kd-videos-search">
            <HiOutlineSearch size={18} />
            <input
              type="search"
              placeholder={t('videos.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* TikTok & Instagram — dış platform CTA */}
      {typeFilter === 'tiktok' && (
        <div className="kd-videos-platform-cta">
          <FaTiktok size={48} />
          <h3>TikTok</h3>
          <p>{isEn ? 'Short clips, quick moments.' : 'Kısa klipler, anlık anlar.'}</p>
          {settings.tiktok ? (
            <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="kd-sort-btn active">
              {isEn ? 'Open TikTok profile' : 'TikTok profilini aç'} <HiOutlineExternalLink size={14} />
            </a>
          ) : (
            <p className="kd-videos-platform-note">{isEn ? 'TikTok link not set in admin.' : 'TikTok linki admin\'den girilmemiş.'}</p>
          )}
        </div>
      )}
      {typeFilter === 'instagram' && (
        <div className="kd-videos-platform-cta">
          <FaInstagram size={48} />
          <h3>Instagram</h3>
          <p>{isEn ? 'Posts, stories and reels.' : 'Gönderiler, hikayeler ve reels.'}</p>
          {settings.instagram ? (
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="kd-sort-btn active">
              {isEn ? 'Open Instagram profile' : 'Instagram profilini aç'} <HiOutlineExternalLink size={14} />
            </a>
          ) : (
            <p className="kd-videos-platform-note">{isEn ? 'Instagram link not set in admin.' : 'Instagram linki admin\'den girilmemiş.'}</p>
          )}
        </div>
      )}

      {loading && <SkeletonGrid count={9} kind="video" />}

      {!loading && videos.length === 0 && (
        <div className="kd-videos-empty">
          <p>{t('videos.empty')}</p>
          {settings.youtube && (
            <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="kd-sort-btn active" style={{ marginTop: 16 }}>
              <FaYoutube size={14} /> {t('videos.open')}
            </a>
          )}
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div className={`kd-videos-grid ${typeFilter === 'shorts' ? 'kd-videos-grid--shorts' : ''}`}>
          {visible.map((v, idx) => (
            <button
              key={v.youtubeId || idx}
              type="button"
              onClick={() => setActiveVideo(v)}
              className="kd-video-tile-link"
              style={{ textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' }}
            >
              <article className="kd-video-tile kd-video-tile-hoverable">
                <div className="kd-video-tile-thumb" style={{ backgroundImage: `url(${v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {idx === 0 && sort === 'newest' && <span className="kd-video-badge">{t('videos.badgeNew')}</span>}
                  {parseDuration(v.duration) && (
                    <span className="kd-video-duration-tile">{parseDuration(v.duration)}</span>
                  )}
                  <div className="kd-video-hover-overlay">
                    <span className="kd-video-hover-play-tile"><HiOutlinePlay size={32} /></span>
                    {v.views && (
                      <span className="kd-video-hover-views">
                        👁 {formatViews(v.views)}
                      </span>
                    )}
                  </div>
                </div>
                <h4 className="kd-video-tile-title">{v.title}</h4>
                {v.views && <div className="kd-video-tile-meta">{formatViews(v.views)} {t('home.platformsSub_views').toLowerCase()}</div>}
              </article>
            </button>
          ))}
        </div>
      )}

      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kd-video-modal-title"
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
                aria-label={t('common.close')}
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
              <h3 id="kd-video-modal-title" style={{ color: '#fff', margin: 0, fontSize: '1.05rem', flex: '1 1 60%' }}>{activeVideo.title}</h3>
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
                <FaYoutube size={14} /> {t('videos.open')} <HiOutlineExternalLink size={12} />
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
            {t('videos.loadMore')} <HiOutlineChevronDown size={16} />
          </button>
        </div>
      )}

      {!loading && filtered.length === 0 && videos.length > 0 && (
        <div className="kd-videos-empty">
          <p>{t('videos.noResults')}</p>
        </div>
      )}
    </div>
  )
}
