import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HiOutlineSearch, HiOutlineClock, HiOutlineVideoCamera, HiOutlineDocumentText } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getBlogsApi, getYouTubeVideosApi } from '../api'
import { blogPosts as staticBlogPosts } from '../data/content'
import { getBlogImage } from '../utils/blogImage'
import './Ara.css'

function normalize(s) {
  return String(s || '').toLocaleLowerCase('tr')
    .replace(/ı/g,'i').replace(/İ/g,'i').replace(/ş/g,'s').replace(/Ş/g,'s')
    .replace(/ç/g,'c').replace(/Ç/g,'c').replace(/ğ/g,'g').replace(/Ğ/g,'g')
    .replace(/ü/g,'u').replace(/Ü/g,'u').replace(/ö/g,'o').replace(/Ö/g,'o')
}

export default function Ara() {
  const { lang } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [posts, setPosts] = useState(staticBlogPosts)
  const [videos, setVideos] = useState([])
  const isEn = lang === 'en'

  useSEO({
    title: isEn ? 'Search | Kadir Demir' : 'Arama | Kadir Demir',
    description: isEn ? 'Search blog posts and videos.' : 'Blog yazıları ve videolarda arama yap.',
    path: '/ara',
    noindex: true,
  })

  useEffect(() => {
    getBlogsApi().then((d) => { const l = Array.isArray(d) ? d : d?.blogs || []; setPosts([...staticBlogPosts, ...l.filter(b => !staticBlogPosts.find(s => s.slug === b.slug))]) }).catch(() => {})
    getYouTubeVideosApi().then((r) => { if (Array.isArray(r?.videos)) setVideos(r.videos) }).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim()
      if (q) setSearchParams({ q }, { replace: true })
      else setSearchParams({}, { replace: true })
    }, 300)
    return () => clearTimeout(t)
  }, [query, setSearchParams])

  const q = normalize(query.trim())

  const filteredPosts = useMemo(() => {
    if (!q) return []
    return posts.filter((p) => {
      const haystack = normalize([p.titleTr, p.titleEn, p.excerptTr, p.excerptEn, p.category, p.categoryEn].filter(Boolean).join(' '))
      return haystack.includes(q)
    }).slice(0, 12)
  }, [posts, q])

  const filteredVideos = useMemo(() => {
    if (!q) return []
    return videos.filter((v) => normalize(v.title || '').includes(q)).slice(0, 8)
  }, [videos, q])

  const total = filteredPosts.length + filteredVideos.length

  return (
    <div className="ara-page">
      <div className="ara-hero">
        <h1>{isEn ? 'Search' : 'Arama'}</h1>
        <div className="ara-input-wrap">
          <HiOutlineSearch size={20} />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isEn ? 'Search posts and videos…' : 'Yazı ve video ara…'}
            className="ara-input"
          />
        </div>
        {q && <p className="ara-meta">{isEn ? `${total} result${total !== 1 ? 's' : ''}` : `${total} sonuç`}</p>}
      </div>

      {q && total === 0 && (
        <p className="ara-empty">{isEn ? 'No results found. Try a different keyword.' : 'Sonuç bulunamadı. Farklı bir kelime dene.'}</p>
      )}

      {filteredPosts.length > 0 && (
        <section className="ara-section">
          <h2><HiOutlineDocumentText size={18} /> {isEn ? 'Blog Posts' : 'Blog Yazıları'}</h2>
          <div className="ara-grid">
            {filteredPosts.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="ara-card">
                <div className="ara-card-img">
                  <img src={getBlogImage(p)} alt={p.titleTr} loading="lazy" onError={(e) => { e.target.style.display = 'none' }} />
                </div>
                <div className="ara-card-body">
                  <span className="ara-card-cat">{isEn ? (p.categoryEn || p.category) : (p.category || p.categoryEn)}</span>
                  <h3>{isEn ? (p.titleEn || p.titleTr) : (p.titleTr || p.titleEn)}</h3>
                  <p>{isEn ? (p.excerptEn || p.excerptTr) : (p.excerptTr || p.excerptEn)}</p>
                  {p.readTime && <span className="ara-card-meta"><HiOutlineClock size={13} /> {p.readTime} dk</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredVideos.length > 0 && (
        <section className="ara-section">
          <h2><HiOutlineVideoCamera size={18} /> {isEn ? 'Videos' : 'Videolar'}</h2>
          <div className="ara-video-grid">
            {filteredVideos.map((v) => (
              <a key={v.youtubeId} href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noopener noreferrer" className="ara-video-card">
                {v.thumbnail && <img src={v.thumbnail} alt={v.title} loading="lazy" />}
                <span>{v.title}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {!q && (
        <p className="ara-hint">{isEn ? 'Start typing to search…' : 'Aramak için yazmaya başla…'}</p>
      )}
    </div>
  )
}
