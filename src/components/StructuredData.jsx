import { useEffect } from 'react'

const DEFAULT_BASE_URL = 'https://kadirardademir.com'

function baseUrl() {
  if (typeof window !== 'undefined' && window.__SITE_BASE_URL__) return window.__SITE_BASE_URL__
  return DEFAULT_BASE_URL
}

function injectSchema(id, schema) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(schema)
}

function removeSchema(id) {
  const el = document.getElementById(id)
  if (el) el.remove()
}

// Person schema — Kadir Demir as the YouTuber creator
export function PersonSchema({ socials }) {
  useEffect(() => {
    const url = baseUrl()
    const sameAs = []
    if (socials?.youtube) sameAs.push(socials.youtube)
    if (socials?.instagram) sameAs.push(socials.instagram)
    if (socials?.tiktok) sameAs.push(socials.tiktok)
    if (socials?.twitter) sameAs.push(socials.twitter)
    if (socials?.discord) sameAs.push(socials.discord)
    if (socials?.linkedin) sameAs.push(socials.linkedin)
    if (sameAs.length === 0) {
      sameAs.push(
        'https://youtube.com/@kadirdemir',
        'https://instagram.com/kadirardademir',
        'https://tiktok.com/@kadirdemirs',
        'https://x.com/kadirdemir'
      )
    }

    injectSchema('schema-person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Kadir Demir',
      url,
      image: `${url}/favicon.png`,
      jobTitle: 'YouTube İçerik Üreticisi',
      description: "İstanbul'dan yayın yapan bir YouTuber. Oyun, vlog ve eğlence içerikleri üretiyor.",
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'İstanbul',
        addressCountry: 'TR',
      },
      sameAs,
    })

    return () => removeSchema('schema-person')
  }, [socials])

  return null
}

// FAQ schema — used on Home page
export function FAQSchema({ items }) {
  useEffect(() => {
    if (!items || items.length === 0) return
    injectSchema('schema-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(item => ({
        '@type': 'Question',
        name: item.q || item.soru,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a || item.cevap,
        },
      })),
    })
    return () => removeSchema('schema-faq')
  }, [items])

  return null
}

// BreadcrumbList schema
export function BreadcrumbSchema({ items }) {
  useEffect(() => {
    if (!items || items.length === 0) return
    const url = baseUrl()
    injectSchema('schema-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: `${url}${item.path}`,
      })),
    })
    return () => removeSchema('schema-breadcrumb')
  }, [items])

  return null
}

// Article schema — for blog posts
export function ArticleSchema({ title, description, image, datePublished, dateModified, author }) {
  useEffect(() => {
    const url = baseUrl()
    injectSchema('schema-article', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image: image || `${url}/logo.png`,
      datePublished,
      dateModified: dateModified || datePublished,
      author: {
        '@type': 'Person',
        name: author || 'Kadir Demir',
      },
      publisher: {
        '@type': 'Person',
        name: 'Kadir Demir',
        logo: { '@type': 'ImageObject', url: `${url}/logo.png` },
      },
    })
    return () => removeSchema('schema-article')
  }, [title, description, image, datePublished, dateModified, author])

  return null
}

// VideoObject schema — for video listings
export function VideoSchema({ videos }) {
  useEffect(() => {
    if (!videos || videos.length === 0) return
    const list = videos.map((v, idx) => ({
      '@type': 'VideoObject',
      position: idx + 1,
      name: v.title,
      description: v.description || v.title,
      thumbnailUrl: v.thumbnail || `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`,
      uploadDate: v.publishedAt || new Date().toISOString(),
      contentUrl: `https://www.youtube.com/watch?v=${v.youtubeId}`,
      embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
    }))
    injectSchema('schema-video-list', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: list,
    })
    return () => removeSchema('schema-video-list')
  }, [videos])

  return null
}

// WebSite schema with SearchAction — enables Google sitelink searchbox
export function WebSiteSchema() {
  useEffect(() => {
    const url = baseUrl()
    injectSchema('schema-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Kadir Demir',
      alternateName: 'kadirdemir',
      url,
      inLanguage: ['tr-TR', 'en-US'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${url}/blog?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    })
    return () => removeSchema('schema-website')
  }, [])
  return null
}

// ItemList — for blog/listing pages (helps Google's "Article carousel")
export function BlogListSchema({ posts, lang = 'tr' }) {
  useEffect(() => {
    if (!posts || posts.length === 0) return
    const url = baseUrl()
    const items = posts.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${url}/blog/${p.slug}`,
      name: lang === 'en' ? (p.titleEn || p.titleTr) : (p.titleTr || p.titleEn),
    }))
    injectSchema('schema-blog-list', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: lang === 'en' ? 'Blog posts' : 'Blog yazıları',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: posts.length,
      itemListElement: items,
    })
    return () => removeSchema('schema-blog-list')
  }, [posts, lang])
  return null
}

// Backwards-compat alias (some pages still import OrganizationSchema)
export function OrganizationSchema(props) {
  return <PersonSchema {...props} />
}

// Backwards-compat alias for Service pages (no-op for personal site)
export function ServiceSchema() {
  return null
}
