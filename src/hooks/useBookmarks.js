import { useCallback, useEffect, useState } from 'react'

// Ziyaretçinin "sonra oku" için kaydettiği blog yazıları (slug listesi, localStorage).
const LS_KEY = 'kade_bookmarks'

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(read)

  useEffect(() => {
    const sync = () => setBookmarks(read())
    window.addEventListener('kade-bookmarks', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('kade-bookmarks', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggle = useCallback((slug) => {
    if (!slug) return
    const cur = read()
    const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug, ...cur]
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    window.dispatchEvent(new Event('kade-bookmarks'))
    setBookmarks(next)
  }, [])

  const isBookmarked = useCallback((slug) => bookmarks.includes(slug), [bookmarks])

  return { bookmarks, isBookmarked, toggle }
}
