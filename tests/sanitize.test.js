import { describe, it, expect } from 'vitest'
import { stripHtml, sanitizeBlogHtml } from '../server/api/_lib/sanitize.js'

describe('stripHtml', () => {
  it('removes tags and trims whitespace', () => {
    expect(stripHtml('  <p>Merhaba <b>dünya</b></p>  ')).toBe('Merhaba dünya')
  })

  it('respects the maxLength cap', () => {
    expect(stripHtml('a'.repeat(50), 10)).toBe('aaaaaaaaaa')
  })

  it('returns empty string for falsy input', () => {
    expect(stripHtml(undefined)).toBe('')
    expect(stripHtml(null)).toBe('')
  })

  it('drops <script> payloads', () => {
    const input = 'Hello <script>alert(1)</script> world'
    expect(stripHtml(input)).toBe('Hello  world')
  })
})

describe('sanitizeBlogHtml', () => {
  it('keeps allowed structural tags', () => {
    const html = sanitizeBlogHtml('<p>Hi</p><h2>Subhead</h2><ul><li>One</li></ul>')
    expect(html).toContain('<p>Hi</p>')
    expect(html).toContain('<h2>Subhead</h2>')
    expect(html).toContain('<li>One</li>')
  })

  it('strips disallowed tags but keeps inner text', () => {
    const html = sanitizeBlogHtml('<p>ok</p><iframe src="evil"></iframe><span>x</span>')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<span')
    expect(html).toContain('ok')
  })

  it('forces rel="noopener noreferrer" on anchors', () => {
    const html = sanitizeBlogHtml('<a href="https://example.com">go</a>')
    expect(html).toMatch(/rel="noopener noreferrer"/)
  })

  it('drops javascript: URLs', () => {
    const html = sanitizeBlogHtml('<a href="javascript:alert(1)">x</a>')
    expect(html).not.toMatch(/javascript:/i)
  })
})
