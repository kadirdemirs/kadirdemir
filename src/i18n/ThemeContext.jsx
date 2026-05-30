import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

const LS_KEY = 'theme'

// Kullanıcının kayıtlı açık tercihi (varsa). Yoksa null → "auto" demektir.
function readStoredTheme() {
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* private mode / storage disabled */ }
  return null
}

// İşletim sistemi tercihi — "auto" modunun temeli.
function getSystemTheme() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  } catch { /* ignore */ }
  return 'dark'
}

function readInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  return readStoredTheme() || getSystemTheme()
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme)

  // DOM'a uygula (otomatik persist YOK — auto modunu bozmamak için).
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  // Kullanıcı henüz açık bir seçim yapmadıysa OS temasını canlı izle.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    if (readStoredTheme()) return // açık seçim var → OS'u izleme
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => { if (!readStoredTheme()) setThemeState(getSystemTheme()) }
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // Açık seçim → kalıcı kaydet.
  const setTheme = (next) => {
    try { localStorage.setItem(LS_KEY, next) } catch { /* ignore */ }
    setThemeState(next)
  }

  const toggleTheme = (e) => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (typeof document === 'undefined') { setTheme(next); return }
    if (!document.startViewTransition) { setTheme(next); return }

    // Tıklanan elemanın merkezini al — yoksa ekran ortası
    let cx = window.innerWidth / 2
    let cy = window.innerHeight / 2
    try {
      const target = e?.currentTarget || e?.target
      if (target && target.getBoundingClientRect) {
        const rect = target.getBoundingClientRect()
        cx = rect.left + rect.width / 2
        cy = rect.top + rect.height / 2
      }
    } catch { /* ignore */ }

    const maxR = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    )
    document.documentElement.style.setProperty('--kd-theme-origin-x', `${cx}px`)
    document.documentElement.style.setProperty('--kd-theme-origin-y', `${cy}px`)
    document.documentElement.style.setProperty('--kd-theme-max-radius', `${maxR}px`)

    const transition = document.startViewTransition(() => setTheme(next))
    transition.ready?.then?.(() => { /* triggered via CSS */ }).catch?.(() => {})
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
