import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineSearch,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineChevronDown,
} from 'react-icons/hi'
import './Blog.css'

const allArticles = [
  { id: 1, slug: 'test2test2test2', title: 'test2test2test2', sub: 'vtest2test2test3', tag: 'test', featured: true },
  { id: 2, slug: 'test2test2', title: 'test2test2', sub: '5453453', tag: 'test', featured: true },
  { id: 3, slug: 'test24574574', title: 'test24574574', sub: '6546456', tag: 'test' },
  { id: 4, slug: 'test24535', title: 'test24535', sub: 'test2', tag: 'test' },
  { id: 5, slug: 'test2234', title: 'test2234', sub: '54', tag: 'test' },
  { id: 6, slug: 'test2214', title: 'test2214', sub: 'test2', tag: 'test' },
  { id: 7, slug: 'test253', title: 'test253', sub: '7', tag: 'test' },
  { id: 8, slug: 'test27', title: 'test27', sub: 'test2', tag: 'test' },
  { id: 9, slug: 'test25', title: 'test25', sub: 'test2', tag: 'test' },
  { id: 10, slug: 'test23', title: 'test23', sub: 'test2', tag: 'test' },
  { id: 11, slug: 'test2', title: 'test2', sub: '2', tag: 'test' },
]

const PAGE_SIZE = 9

export default function Blog() {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('all')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allArticles.filter((a) => {
      const matchTag = activeTag === 'all' || a.tag === activeTag
      const matchQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.sub.toLowerCase().includes(q)
      return matchTag && matchQ
    })
  }, [query, activeTag])

  const featured = filtered.filter((a) => a.featured)
  const others = filtered.filter((a) => !a.featured)
  const visibleOthers = showAll ? others : others.slice(0, PAGE_SIZE)

  return (
    <div className="kd-blog">
      <header className="kd-blog-head">
        <span className="kd-blog-pill">
          <HiOutlineDocumentText size={14} /> Blog
        </span>
        <h1>
          Yazdığım <span className="kd-accent">her şey</span>
        </h1>
        <p>
          Gözlemler, denemeler, kulis notları. {allArticles.length} makale
        </p>
      </header>

      <div className="kd-blog-search">
        <HiOutlineSearch size={18} />
        <input
          type="search"
          placeholder="Makaleler içinde ara..."
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
          Tümü <span className="kd-chip-count">{allArticles.length}</span>
        </button>
        <button
          type="button"
          className={`kd-chip ${activeTag === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTag('test')}
        >
          test <span className="kd-chip-count">{allArticles.filter((a) => a.tag === 'test').length}</span>
        </button>
      </div>

      {featured.length > 0 && (
        <section className="kd-blog-section">
          <div className="kd-blog-section-title">
            <HiOutlineSparkles size={16} /> ÖNE ÇIKAN
          </div>
          <div className="kd-blog-featured-grid">
            {featured.map((a) => (
              <Link key={a.id} to={`/blog/${a.slug}`} className="kd-blog-card kd-blog-card-lg">
                <div className="kd-blog-thumb">
                  <span className="kd-thumb-mono">B</span>
                </div>
                <div className="kd-blog-info">
                  <h3>{a.title}</h3>
                  <p>{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="kd-blog-section">
          <div className="kd-blog-section-title kd-blog-section-title-muted">
            DİĞER MAKALELER
          </div>
          <div className="kd-blog-grid">
            {visibleOthers.map((a) => (
              <Link key={a.id} to={`/blog/${a.slug}`} className="kd-blog-card">
                <div className="kd-blog-thumb">
                  <span className="kd-thumb-mono">B</span>
                </div>
                <div className="kd-blog-info">
                  <h4>{a.title}</h4>
                  <p>{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {others.length > PAGE_SIZE && (
            <div className="kd-blog-more">
              <button
                type="button"
                className="kd-blog-more-btn"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? 'Daha az göster' : 'Daha fazla görüntüle'}
                <HiOutlineChevronDown
                  size={16}
                  style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                />
              </button>
            </div>
          )}
        </section>
      )}

      {filtered.length === 0 && (
        <div className="kd-blog-empty">
          <p>Aradığın kritere uygun makale bulunamadı.</p>
        </div>
      )}
    </div>
  )
}
