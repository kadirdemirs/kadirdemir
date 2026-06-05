import { useEffect } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

const LOCALE_MAP = {
  tr: 'tr_TR',
  en: 'en_US',
  de: 'de_DE',
}

const DEFAULT_BASE_URL = 'https://kadirardademir.com'
const DEFAULT_SITE_NAME = 'Kadir Demir'

function getBaseUrl() {
  if (typeof window !== 'undefined' && window.__SITE_BASE_URL__) return window.__SITE_BASE_URL__
  return DEFAULT_BASE_URL
}

function getSiteName() {
  if (typeof window !== 'undefined' && window.__SITE_NAME__) return window.__SITE_NAME__
  return DEFAULT_SITE_NAME
}

function setMeta(name, content, property = false) {
  if (!content) return
  const attr = property ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(name, property = false) {
  const attr = property ? 'property' : 'name'
  const el = document.querySelector(`meta[${attr}="${name}"]`)
  if (el) el.remove()
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

function setHreflang(canonicalUrl) {
  // Reset previous hreflang links
  document.querySelectorAll('link[data-managed-hreflang="true"]').forEach((el) => el.remove())
  const langs = [
    { hreflang: 'tr', code: 'tr' },
    { hreflang: 'tr-TR', code: 'tr' },
    { hreflang: 'en', code: 'en' },
    { hreflang: 'en-US', code: 'en' },
    { hreflang: 'x-default', code: 'tr' },
  ]
  // The site does not currently expose distinct /en/ paths; SPA toggles language client-side.
  // We still emit hreflang pointing to the same canonical so Google understands the URL serves both languages.
  langs.forEach(({ hreflang }) => {
    const link = document.createElement('link')
    link.setAttribute('rel', 'alternate')
    link.setAttribute('hreflang', hreflang)
    link.setAttribute('href', canonicalUrl)
    link.setAttribute('data-managed-hreflang', 'true')
    document.head.appendChild(link)
  })
}

export function useSEO({
  title,
  description,
  keywords,
  path = '/',
  image,
  imageAlt,
  type = 'website',
  noindex = false,
  twitterHandle,
  // Makale (blog) meta'ları — type === 'article' iken kullanılır
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
}) {
  const { lang } = useLanguage()
  useEffect(() => {
    const baseUrl = getBaseUrl()
    const siteName = getSiteName()
    const resolvedHandle = twitterHandle || (typeof window !== 'undefined' && window.__TWITTER_HANDLE__) || '@kadirardademir'
    const resolvedAuthor = author || siteName

    let fullTitle
    if (!title) {
      fullTitle = `${siteName} | YouTube İçerik Üreticisi`
    } else if (title.includes(siteName)) {
      fullTitle = title
    } else {
      fullTitle = `${title} | ${siteName}`
    }

    const canonicalUrl = `${baseUrl}${path}`
    // If no explicit image was passed, generate a per-page OG via the /api/og endpoint.
    // The route renders a Satoshi-based card with the given title + subtitle.
    let ogImage = image
    if (!ogImage) {
      if (title) {
        const params = new URLSearchParams({
          title: String(title).slice(0, 120),
          subtitle: String(description || '').slice(0, 140),
        })
        ogImage = `${baseUrl}/api/og?${params.toString()}`
      } else {
        ogImage = `${baseUrl}/og-cover.png`
      }
    }

    document.title = fullTitle

    setMeta('description', description)
    if (keywords) setMeta('keywords', keywords)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('author', siteName)

    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:url', canonicalUrl, true)
    setMeta('og:image', ogImage, true)
    setMeta('og:type', type, true)
    setMeta('og:site_name', siteName, true)
    setMeta('og:locale', LOCALE_MAP[lang] || 'tr_TR', true)

    setMeta('og:image:alt', imageAlt || fullTitle, true)
    // Çift dilli site — diğer dili alternate olarak bildir
    const altLocale = (LOCALE_MAP[lang] || 'tr_TR') === 'tr_TR' ? 'en_US' : 'tr_TR'
    setMeta('og:locale:alternate', altLocale, true)

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', ogImage)
    setMeta('twitter:image:alt', imageAlt || fullTitle)
    setMeta('twitter:site', resolvedHandle)
    setMeta('twitter:creator', resolvedHandle)

    // Makale meta'ları — yalnızca blog yazılarında; değilse temizle
    if (type === 'article') {
      setMeta('article:published_time', publishedTime, true)
      setMeta('article:modified_time', modifiedTime || publishedTime, true)
      setMeta('article:author', resolvedAuthor, true)
      if (section) setMeta('article:section', section, true)
      removeMeta('article:tag', true)
      if (Array.isArray(tags) && tags.length) {
        setMeta('article:tag', tags.slice(0, 8).join(', '), true)
      }
    } else {
      ;['article:published_time', 'article:modified_time', 'article:author', 'article:section', 'article:tag']
        .forEach((m) => removeMeta(m, true))
    }

    setCanonical(canonicalUrl)
    setHreflang(canonicalUrl)
  }, [title, description, keywords, path, image, imageAlt, type, noindex, twitterHandle, lang, publishedTime, modifiedTime, author, section, tags]) // eslint-disable-line react-hooks/exhaustive-deps
}
