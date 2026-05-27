import { useEffect, useState } from 'react'
import { HiOutlineMenuAlt2 } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import './BlogTOC.css'

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'section'
}

/**
 * Sticky table of contents. Article DOM'unda h2/h3'leri tarar,
 * her birine ID atar, scroll'a göre aktif heading'i highlight'lar.
 */
export default function BlogTOC({ articleRef, contentVersion }) {
  const { lang } = useLanguage()
  const [items, setItems] = useState([])
  const [active, setActive] = useState('')

  // 1) Article DOM'undan başlıkları çek
  useEffect(() => {
    if (!articleRef?.current) { setItems([]); return }
    const headings = Array.from(articleRef.current.querySelectorAll('h2, h3'))
    if (!headings.length) { setItems([]); return }
    const seen = new Set()
    const list = headings.map((h) => {
      let id = h.id
      if (!id) {
        let base = slugify(h.textContent)
        let candidate = base
        let i = 1
        while (seen.has(candidate)) { candidate = `${base}-${i++}` }
        id = candidate
        h.id = id
      }
      seen.add(id)
      return { id, text: h.textContent || '', level: h.tagName === 'H3' ? 3 : 2 }
    })
    setItems(list)
  }, [articleRef, contentVersion])

  // 2) Aktif heading takibi (IntersectionObserver)
  useEffect(() => {
    if (!items.length) return
    const nodes = items.map((i) => document.getElementById(i.id)).filter(Boolean)
    if (!nodes.length) return

    const visible = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio)
          else visible.delete(entry.target.id)
        })
        if (visible.size > 0) {
          const top = [...visible.entries()].sort((a, b) => b[1] - a[1])[0][0]
          setActive(top)
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: [0.1, 0.4, 0.8] }
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [items])

  if (items.length < 2) return null

  const label = lang === 'en' ? 'On this page' : 'Bu sayfada'

  return (
    <aside className="kd-toc" aria-label={label}>
      <div className="kd-toc-header">
        <HiOutlineMenuAlt2 size={16} />
        <span>{label}</span>
      </div>
      <ul className="kd-toc-list">
        {items.map((it) => (
          <li
            key={it.id}
            className={`kd-toc-item kd-toc-${it.level === 3 ? 'sub' : 'main'} ${active === it.id ? 'is-active' : ''}`}
          >
            <a href={`#${it.id}`}>{it.text}</a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
