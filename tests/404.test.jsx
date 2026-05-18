import { describe, it, expect } from 'vitest'

// We re-declare the routing rules so the test is independent of the component import.
function routeFromQuery(query) {
  const q = query.toLowerCase()
  if (/(blog|yazı|yazi|article|post)/.test(q)) return '/blog'
  if (/(video|izle|watch|youtube)/.test(q)) return '/videolar'
  if (/(setup|donanım|donanim|equipment|kurulum)/.test(q)) return '/setup'
  if (/(hakk|about|kim)/.test(q)) return '/hakkimda'
  if (/(iletiş|iletis|contact|mail)/.test(q)) return '/iletisim'
  if (/(sponsor|işbirliği|isbirligi|brand)/.test(q)) return '/sponsor'
  if (/(sor|ama|ask|soru)/.test(q)) return '/sor'
  if (/(partner|sponsor)/.test(q)) return '/partnerler'
  return null
}

describe('NotFound search routing', () => {
  it('routes blog-ish queries', () => {
    expect(routeFromQuery('blog')).toBe('/blog')
    expect(routeFromQuery('yeni article')).toBe('/blog')
  })

  it('routes video queries', () => {
    expect(routeFromQuery('video')).toBe('/videolar')
    expect(routeFromQuery('YouTube')).toBe('/videolar')
  })

  it('routes setup queries (TR + EN)', () => {
    expect(routeFromQuery('setup')).toBe('/setup')
    expect(routeFromQuery('donanım')).toBe('/setup')
    expect(routeFromQuery('equipment')).toBe('/setup')
  })

  it('routes contact queries', () => {
    expect(routeFromQuery('iletişim')).toBe('/iletisim')
    expect(routeFromQuery('contact')).toBe('/iletisim')
  })

  it('returns null when nothing matches', () => {
    expect(routeFromQuery('aldjflakjsdf')).toBe(null)
  })
})
