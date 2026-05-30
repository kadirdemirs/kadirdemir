import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  HiOutlineSearch,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineClock,
} from 'react-icons/hi'
import { HiOutlineBookmark } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { useBookmarks } from '../hooks/useBookmarks'
import { blogPosts as staticBlogPosts } from '../data/content'
import { getBlogsApi } from '../api'
import { getBlogImage } from '../utils/blogImage'
import { BreadcrumbSchema, BlogListSchema } from '../components/StructuredData'
import './Blog.css'

const PAGE_SIZE = 9

function pickField(post, base, lang) {
  const camel = base + (lang === 'en' ? 'En' : 'Tr')
  return post[camel] || post[base] || ''
}

export default function Blog() {
  const { lang } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState(staticBlogPosts)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTag, setActiveTag] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const { bookmarks } = useBookmarks()

  useEffect(() => {
    const current = searchParams.get('q') || ''
    if (query && query !== current) {
      setSearchParams({ q: query }, { replace: true })
    } else if (!query && current) {
      setSearchParams({}, { replace: true })
    }
  }, [query, searchParams, setSearchParams])

  useSEO({
    title: 'Blog | Kadir Demir',
    description:
      lang === 'en'
        ? 'Articles, notes and behind-the-scenes from Kadir Demir.'
        : "Kadir Demir'in yazıları, notları ve kulis gözlemleri.",
    path: '/blog',
  })

  useEffect(() => {
    let cancelled = false
    getBlogsApi()
      .then((data) => {
        if (cancelled || !Array.isArray(data) || !data.length) return
        setPosts((prev) => {
          const bySlug = new Map(data.map((p) => [p.slug, p]))
          const merged = prev.map((p) => bySlug.get(p.slug) || p)
          const existingSlugs = new Set(prev.map((p) => p.slug))
          const newOnes = data.filter((p) => !existingSlugs.has(p.slug))
          return [...newOnes, ...merged]
        })
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const tagCounts = useMemo(() => {
    const counts = new Map()
    for (const p of posts) {
      const cat = lang === 'en' ? (p.categoryEn || p.category) : (p.category || p.categoryEn)
      if (!cat) continue
      counts.set(cat, (counts.get(cat) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [posts, lang])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts.filter((p) => {
      const cat = lang === 'en' ? (p.categoryEn || p.category) : (p.category || p.categoryEn)
      const title = pickField(p, 'title', lang)
      const excerpt = pickField(p, 'excerpt', lang)
      const matchTag = activeTag === 'all'
        ? true
        : activeTag === '__saved'
          ? bookmarks.includes(p.slug)
          : cat === activeTag
      const matchQ =
        !q ||
        title.toLowerCase().includes(q) ||
        excerpt.toLowerCase().includes(q) ||
        (cat || '').toLowerCase().includes(q)
      return matchTag && matchQ
    })
  }, [posts, query, activeTag, lang, bookmarks])

  const featured = filtered.slice(0, 2)
  const others = filtered.slice(2)
  const visibleOthers = showAll ? others : others.slice(0, PAGE_SIZE)

  const t = (k) => {
    const dict = {
      pill:      { tr: 'Blog', en: 'Blog' },
      heading1:  { tr: 'Yazdığım ', en: 'Everything ' },
      headingHi: { tr: 'her şey', en: 'I write' },
      sub:       { tr: 'Gözlemler, denemeler, kulis notları.', en: 'Notes, drafts, behind-the-scenes.' },
      count:     { tr: 'makale', en: 'articles' },
      search:    { tr: 'Makaleler içinde ara...', en: 'Search articles...' },
      all:       { tr: 'Tümü', en: 'All' },
      featured:  { tr: 'ÖNE ÇIKAN', en: 'FEATURED' },
      otherTitle:{ tr: 'DİĞER MAKALELER', en: 'OTHER ARTICLES' },
      more:      { tr: 'Daha fazla görüntüle', en: 'Show more' },
      less:      { tr: 'Daha az göster', en: 'Show less' },
      empty:     { tr: 'Aradığın kritere uygun makale bulunamadı.', en: 'No articles match your filters.' },
      readTime:  { tr: 'dk okuma', en: 'min read' },
      loading:   { tr: 'Yükleniyor...', en: 'Loading...' },
    }
    return dict[k]?.[lang] || dict[k]?.tr || k
  }

  return (
    <div className="kd-blog">
      <BreadcrumbSchema items={[{ name: lang === 'en' ? 'Home' : 'Ana Sayfa', path: '/' }, { name: 'Blog', path: '/blog' }]} />
      <BlogListSchema posts={posts} lang={lang} />
      <header className="kd-blog-head">
        <span className="kd-blog-pill">
          <HiOutlineDocumentText size={14} /> {t('pill')}
        </span>
        <h1>
          {t('heading1')}<span className="kd-accent">{t('headingHi')}</span>
        </h1>
        <p>
          {t('sub')} {posts.length} {t('count')}
        </p>
      </header>

      <div className="kd-blog-search">
        <HiOutlineSearch size={18} />
        <input
          type="search"
          placeholder={t('search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="kd-blog-chips">
        <button
          type="button"
          className={`kd-chip ${activeTag === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTag('all')}
        >
          {t('all')} <span className="kd-chip-count">{posts.length}</span>
        </button>
        {tagCounts.map(([tag, count]) => (
          <button
            key={tag}
            type="button"
            className={`kd-chip ${activeTag === tag ? 'active' : ''}`}
            onClick={() => setActiveTag(tag)}
          >
            {tag} <span className="kd-chip-count">{count}</span>
          </button>
        ))}
        {bookmarks.length > 0 && (
          <button
            type="button"
            className={`kd-chip kd-chip-saved ${activeTag === '__saved' ? 'active' : ''}`}
            onClick={() => setActiveTag(activeTag === '__saved' ? 'all' : '__saved')}
          >
            <HiOutlineBookmark size={14} /> {lang === 'en' ? 'Saved' : 'Kaydedilenler'} <span className="kd-chip-count">{bookmarks.length}</span>
          </button>
        )}
      </div>

      {featured.length > 0 && (
        <section className="kd-blog-section">
          <div className="kd-blog-section-title">
            <HiOutlineSparkles size={16} /> {t('featured')}
          </div>
          <div className="kd-blog-featured-grid">
            {featured.map((a) => {
              const cat = lang === 'en' ? (a.categoryEn || a.category) : (a.category || a.categoryEn)
              const title = pickField(a, 'title', lang)
              const excerpt = pickField(a, 'excerpt', lang)
              const img = a.image || getBlogImage(cat)
              return (
                <Link key={a.slug || a.id} to={`/blog/${a.slug}`} className="kd-blog-card kd-blog-card-lg">
                  <div
                    className="kd-blog-thumb"
                    style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  >
                    {!img && <span className="kd-thumb-mono">B</span>}
                  </div>
                  <div className="kd-blog-info">
                    {cat && <span className="kd-blog-meta-cat">{cat}</span>}
                    <h3>{title}</h3>
                    <p>{excerpt}</p>
                    {a.readTime && (
                      <span className="kd-blog-meta-time">
                        <HiOutlineClock size={12} /> {a.readTime} {t('readTime')}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="kd-blog-section">
          <div className="kd-blog-section-title kd-blog-section-title-muted">
            {t('otherTitle')}
          </div>
          <div className="kd-blog-grid">
            {visibleOthers.map((a) => {
              const cat = lang === 'en' ? (a.categoryEn || a.category) : (a.category || a.categoryEn)
              const title = pickField(a, 'title', lang)
              const excerpt = pickField(a, 'excerpt', lang)
              const img = a.image || getBlogImage(cat)
              return (
                <Link key={a.slug || a.id} to={`/blog/${a.slug}`} className="kd-blog-card">
                  <div
                    className="kd-blog-thumb"
                    style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  >
                    {!img && <span className="kd-thumb-mono">B</span>}
                  </div>
                  <div className="kd-blog-info">
                    {cat && <span className="kd-blog-meta-cat">{cat}</span>}
                    <h4>{title}</h4>
                    <p>{excerpt}</p>
                    {a.readTime && (
                      <span className="kd-blog-meta-time">
                        <HiOutlineClock size={12} /> {a.readTime} {t('readTime')}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {others.length > PAGE_SIZE && (
            <div className="kd-blog-more">
              <button
                type="button"
                className="kd-blog-more-btn"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? t('less') : t('more')}
                <HiOutlineChevronDown
                  size={16}
                  style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                />
              </button>
            </div>
          )}
        </section>
      )}

      {!loading && filtered.length === 0 && (
        <div className="kd-blog-empty">
          <p>{t('empty')}</p>
        </div>
      )}
    </div>
  )
}
