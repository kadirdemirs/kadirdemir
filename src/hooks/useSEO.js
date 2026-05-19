import { useEffect } from 'react'

const DEFAULT_BASE_URL = 'https://kadirdemir-nu.vercel.app'
const SITE_NAME = 'Kadir Demir'
const DEFAULT_TITLE = 'Kadir Demir | YouTube İçerik Üreticisi'

function getBaseUrl() {
  if (typeof window !== 'undefined' && window.__SITE_BASE_URL__) return window.__SITE_BASE_URL__
  return DEFAULT_BASE_URL
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
  type = 'website',
  noindex = false,
  twitterHandle = '@kadirdemir',
}) {
  useEffect(() => {
    const baseUrl = getBaseUrl()

    let fullTitle
    if (!title) {
      fullTitle = DEFAULT_TITLE
    } else if (title.includes(SITE_NAME)) {
      fullTitle = title
    } else {
      fullTitle = `${title} | ${SITE_NAME}`
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
        ogImage = `${baseUrl}/logo.png`
      }
    }

    document.title = fullTitle

    setMeta('description', description)
    if (keywords) setMeta('keywords', keywords)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('author', SITE_NAME)

    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:url', canonicalUrl, true)
    setMeta('og:image', ogImage, true)
    setMeta('og:type', type, true)
    setMeta('og:site_name', SITE_NAME, true)
    setMeta('og:locale', 'tr_TR', true)

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', ogImage)
    setMeta('twitter:site', twitterHandle)

    setCanonical(canonicalUrl)
    setHreflang(canonicalUrl)
  }, [title, description, keywords, path, image, type, noindex, twitterHandle])
}
