import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

const LS_KEY = 'theme'

function readInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* private mode / storage disabled */ }
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
    }
    try { localStorage.setItem(LS_KEY, theme) } catch { /* ignore */ }
  }, [theme])

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
