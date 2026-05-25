import { useState, useEffect, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineClock, HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineShare, HiOutlineLink, HiOutlineCheck, HiOutlineEye } from 'react-icons/hi'
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { FaWhatsapp } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { blogPosts as staticBlogPosts } from '../data/content'
import { getBlogsApi, getPostViewsApi } from '../api'
import { getBlogImage, getBlogFallback } from '../utils/blogImage'
import DOMPurify from 'dompurify'
import { analytics } from '../utils/analytics'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import ReadingProgress from '../components/ReadingProgress'
import Comments from '../components/Comments'
import BlogTOC from '../components/BlogTOC'
import BlogShareDock from '../components/BlogShareDock'
import BlogAuthorBio from '../components/BlogAuthorBio'
import './Blog.css'

const BLOG_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'strong', 'b', 'em', 'i',
    'blockquote', 'a', 'code', 'pre', 'hr', 'img',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'loading'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/(?!\/)|#|data:image\/(?:png|gif|jpeg|webp);base64,)/i,
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
}

function estimateReadTime(html) {
  if (!html) return 1
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export default function BlogDetail() {
  const { slug } = useParams()
  const { lang, t } = useLanguage()
  const [allPosts, setAllPosts] = useState(staticBlogPosts)
  const [fetchStatus, setFetchStatus] = useState('loading') // loading | ready | error
  const [copyOk, setCopyOk] = useState(false)
  const [views, setViews] = useState(null)
  const articleRef = useRef(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    getPostViewsApi(slug).then((v) => { if (!cancelled) setViews(v) })
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    let cancelled = false
    setFetchStatus('loading')
    getBlogsApi()
      .then(data => {
        if (cancelled) return
        if (Array.isArray(data) && data.length) {
          setAllPosts(prev => {
            const slugMap = new Map(data.map(p => [p.slug, p]))
            const merged = prev.map(p => slugMap.get(p.slug) || p)
            const existingSlugs = new Set(prev.map(p => p.slug))
            const newPosts = data.filter(p => !existingSlugs.has(p.slug))
            return [...newPosts, ...merged]
          })
        }
        setFetchStatus('ready')
      })
      .catch(() => { if (!cancelled) setFetchStatus('error') })
    return () => { cancelled = true }
  }, [slug])

  const post = allPosts.find((p) => p.slug === slug)

  const title = post ? (lang === 'tr' ? post.titleTr : post.titleEn) : ''
  const excerpt = post ? (lang === 'tr' ? post.excerptTr : post.excerptEn) : ''
  const content = post ? (lang === 'tr' ? post.contentTr : post.contentEn) : ''
  const category = post ? (lang === 'tr' ? post.category : post.categoryEn) : ''

  const ogImageParams = new URLSearchParams({
    title: title || 'Kadir Demir',
    subtitle: (excerpt || '').slice(0, 80),
    ...(category ? { tag: category } : {}),
  }).toString()

  useSEO({
    title: title || 'Blog | Kadir Demir',
    description: excerpt || '',
    path: `/blog/${slug}`,
    type: 'article',
    image: `https://kadirdemir-nu.vercel.app/api/og?${ogImageParams}`,
  })

  useEffect(() => {
    if (post) analytics.blogRead(slug, title)
  }, [post, slug, title])

  useEffect(() => {
    if (!post) return
    const isoOrNull = (value) => {
      if (!value) return null
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? null : d.toISOString()
    }
    const published = isoOrNull(post.date || post.publishedAt || post.createdAt)
    const modified = isoOrNull(post.updatedAt || post.modifiedAt) || published
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: excerpt,
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
      author: { '@type': 'Person', name: 'Kadir Demir', url: 'https://kadirdemir-nu.vercel.app' },
      publisher: {
        '@type': 'Organization',
        name: 'Kadir Demir',
        logo: { '@type': 'ImageObject', url: 'https://kadirdemir-nu.vercel.app/favicon.png' },
      },
      url: `https://kadirdemir-nu.vercel.app/blog/${slug}`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://kadirdemir-nu.vercel.app/blog/${slug}` },
      inLanguage: lang === 'en' ? 'en-US' : 'tr-TR',
      ...(post.coverImage && /^https?:\/\//.test(post.coverImage) ? { image: post.coverImage } : (post.image && /^https?:\/\//.test(post.image) ? { image: post.image } : {})),
    }
    const el = document.getElementById('jsonld-article')
    if (el) { el.textContent = JSON.stringify(schema) } else {
      const s = document.createElement('script')
      s.id = 'jsonld-article'
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(schema)
      document.head.appendChild(s)
    }

    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://kadirdemir-nu.vercel.app' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://kadirdemir-nu.vercel.app/blog' },
        { '@type': 'ListItem', position: 3, name: title, item: `https://kadirdemir-nu.vercel.app/blog/${slug}` },
      ],
    }
    let bcEl = document.getElementById('jsonld-breadcrumb')
    if (bcEl) { bcEl.textContent = JSON.stringify(breadcrumb) } else {
      const s2 = document.createElement('script')
      s2.id = 'jsonld-breadcrumb'
      s2.type = 'application/ld+json'
      s2.textContent = JSON.stringify(breadcrumb)
      document.head.appendChild(s2)
    }

    return () => {
      document.getElementById('jsonld-article')?.remove()
      document.getElementById('jsonld-breadcrumb')?.remove()
    }
  }, [post, slug, title, excerpt, lang])

  // Wait for the fetch to settle before deciding the slug doesn't exist.
  if (!post && fetchStatus === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
        <span>{lang === 'en' ? 'Loading…' : 'Yükleniyor…'}</span>
      </div>
    )
  }
  if (!post) return <Navigate to="/blog" replace />

  const postUrl = `https://kadirdemir-nu.vercel.app/blog/${slug}`
  const encodedUrl = encodeURIComponent(postUrl)
  const encodedTitle = encodeURIComponent(title)

  const otherPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 3)

  return (
    <PageTransition>
      <ReadingProgress targetRef={articleRef} />
      {/* Hero */}
      <section className="blog-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <Link to="/blog" className="partner-back" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
              <HiOutlineArrowLeft size={16} />
              {lang === 'tr' ? 'Tüm Yazılar' : 'All Posts'}
            </Link>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div className="blog-meta" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <span className="blog-category" style={{ color: post.color }}>{category}</span>
              <span className="blog-date">{post.date}</span>
              <span className="blog-read">
                <HiOutlineClock size={14} />
                {post.readTime || estimateReadTime(content)} {t('blog.min')}
              </span>
              {Number.isFinite(views) && views > 0 && (
                <span className="blog-read" aria-label={lang === 'en' ? 'Page views' : 'Görüntülenme'}>
                  <HiOutlineEye size={14} />
                  {views.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')}{' '}
                  {lang === 'en' ? 'views' : 'görüntülenme'}
                </span>
              )}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', maxWidth: '800px', margin: '0 auto 20px' }}>
              {title}
            </h1>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto' }}>{excerpt}</p>
          </FadeIn>
        </div>
      </section>

      {/* Content */}
      <section className="section">
        <div className="container">
          <div className="blog-detail-layout kd-blog-detail-grid">
            {/* Floating share dock (sol) */}
            <BlogShareDock title={title} url={postUrl} />

            {/* Ana içerik */}
            <div className="kd-blog-detail-main">
            {/* Featured image */}
            <FadeIn>
              <div
                className="blog-detail-image glass-card"
                style={{ background: `${post.color}15`, overflow: 'hidden', minHeight: '240px', marginBottom: '32px', borderRadius: '16px' }}
              >
                <img
                  src={getBlogImage(post)}
                  alt={title}
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px', display: 'block' }}
                  onError={e => {
                    if (e.target.dataset.fallback === '2') { e.target.dataset.failed = '1'; e.target.removeAttribute('src'); return }
                    if (e.target.dataset.fallback === '1') { e.target.dataset.fallback = '2'; e.target.src = getBlogFallback(post); return }
                    e.target.dataset.fallback = '1'; e.target.src = getBlogFallback(post)
                  }}
                />
              </div>
            </FadeIn>

            {/* Article body */}
            <FadeIn delay={0.1}>
              <div ref={articleRef} className="blog-detail-content glass-card">
                {content ? (
                  <div className="blog-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content, BLOG_SANITIZE_CONFIG) }} />
                ) : excerpt ? (
                  <p style={{ color: 'var(--gray-lighter)', lineHeight: 1.8, fontSize: '1.05rem' }}>{excerpt}</p>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {lang === 'tr'
                      ? 'Bu yazının detaylı içeriği için ekibimizle iletişime geçebilirsiniz.'
                      : 'Feel free to contact our team for more details on this topic.'}
                  </p>
                )}
              </div>
            </FadeIn>

            {/* Share */}
            <FadeIn delay={0.15}>
              <div className="blog-share-section glass-card" style={{ marginTop: '24px' }}>
                <div className="blog-share-left">
                  <HiOutlineShare size={20} />
                  <span>{lang === 'tr' ? 'Bu yazıyı paylaş' : 'Share this post'}</span>
                </div>
                <div className="blog-share-buttons">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blog-share-btn"
                    aria-label="X (Twitter)'ta paylaş"
                  >
                    <FaXTwitter size={16} />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blog-share-btn"
                    aria-label="LinkedIn'de paylaş"
                  >
                    <FaLinkedinIn size={16} />
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blog-share-btn"
                    aria-label="WhatsApp'ta paylaş"
                  >
                    <FaWhatsapp size={16} />
                  </a>
                  <button
                    type="button"
                    className="blog-share-btn"
                    aria-label={lang === 'tr' ? 'Bağlantıyı kopyala' : 'Copy link'}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(postUrl)
                        setCopyOk(true)
                        setTimeout(() => setCopyOk(false), 1800)
                      } catch { /* ignore */ }
                    }}
                  >
                    {copyOk ? <HiOutlineCheck size={16} /> : <HiOutlineLink size={16} />}
                  </button>
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      type="button"
                      className="blog-share-btn"
                      aria-label={lang === 'tr' ? 'Sistem paylaşımı' : 'System share'}
                      onClick={async () => {
                        try {
                          await navigator.share({ title, text: excerpt || title, url: postUrl })
                        } catch { /* user dismissed */ }
                      }}
                    >
                      <HiOutlineShare size={16} />
                    </button>
                  )}
                </div>
              </div>
            </FadeIn>

            {/* Yazar bio kartı */}
            <FadeIn delay={0.17}>
              <BlogAuthorBio />
            </FadeIn>
            </div>{/* /kd-blog-detail-main */}

            {/* TOC sidebar (sağ, desktop) */}
            <div className="kd-blog-detail-aside">
              <BlogTOC articleRef={articleRef} contentVersion={slug} />
            </div>
          </div>

          {/* Comments */}
          <FadeIn delay={0.18}>
            <Comments postSlug={slug} />
          </FadeIn>

          {/* Lead CTA */}
          <FadeIn delay={0.2}>
            <div className="blog-cta-section glass-card" style={{ marginTop: '32px' }}>
              <div className="blog-cta-icon">
                <HiOutlineArrowRight size={28} />
              </div>
              <h3>{t('blog.ctaTitle')}</h3>
              <p>{t('blog.ctaSub')}</p>
              <div className="blog-cta-actions">
                <Link to="/iletisim" className="btn btn-primary" onClick={() => analytics.ctaClick('blog-cta', '/iletisim')}>
                  {t('common.contact')}
                  <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/sponsor" className="btn btn-outline" onClick={() => analytics.ctaClick('blog-sponsor', '/sponsor')}>
                  {t('sponsor.pill')}
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* More Posts */}
          {otherPosts.length > 0 && (
            <FadeIn delay={0.2}>
              <div style={{ marginTop: '64px' }}>
                <h3 style={{ color: 'var(--white)', marginBottom: '24px', fontSize: '1.3rem' }}>
                  {t('blog.relatedTitle')}
                </h3>
                <div className="blog-grid">
                  {otherPosts.map((p) => (
                    <Link key={p.slug} to={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                      <motion.div className="blog-card glass-card" whileHover={{ y: -4 }}>
                        <div className="blog-card-image" style={{ background: `${p.color}15` }}>
                          <img
                            src={getBlogImage(p)}
                            alt={p.titleTr || ''}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = getBlogFallback(p) } }}
                            loading="lazy"
                          />
                        </div>
                        <div className="blog-card-content">
                          <div className="blog-meta">
                            <span className="blog-category" style={{ color: p.color }}>
                              {lang === 'tr' ? p.category : p.categoryEn}
                            </span>
                            <span className="blog-date">{p.date}</span>
                          </div>
                          <h3>{lang === 'tr' ? p.titleTr : p.titleEn}</h3>
                          <p>{lang === 'tr' ? p.excerptTr : p.excerptEn}</p>
                          <div className="blog-card-footer">
                            <span className="blog-read">
                              <HiOutlineClock size={14} />
                              {p.readTime} {t('blog.min')}
                            </span>
                            <span className="blog-read-link">
                              {t('blog.readMore')} <HiOutlineArrowRight size={12} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </section>
    </PageTransition>
  )
}
