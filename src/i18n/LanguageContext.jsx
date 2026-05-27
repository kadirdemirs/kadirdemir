import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { translations } from './translations'

const LanguageContext = createContext()

const LS_KEY = 'kade_lang'
export const SUPPORTED_LANGS = ['tr', 'en']
const LANG_META = {
  tr: { code: 'tr', label: 'Türkçe', short: 'TR', flag: '🇹🇷' },
  en: { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
}

function detectInitialLang() {
  if (typeof window === 'undefined') return 'tr'
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored
  } catch { /* ignore */ }
  const nav = (navigator?.language || 'tr').slice(0, 2).toLowerCase()
  return SUPPORTED_LANGS.includes(nav) ? nav : 'tr'
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, lang) } catch { /* ignore */ }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang)
    }
  }, [lang])

  const setLang = useCallback((next) => {
    if (SUPPORTED_LANGS.includes(next)) setLangState(next)
  }, [])

  const t = useCallback(
    (key, fallback) => {
      const parts = String(key).split('.')
      let value = translations[lang]
      for (const k of parts) {
        if (value == null) break
        value = value[k]
      }
      if (value == null && lang !== 'tr') {
        let tr = translations.tr
        for (const k of parts) {
          if (tr == null) break
          tr = tr[k]
        }
        value = tr
      }
      return value ?? fallback ?? key
    },
    [lang]
  )

  // Toggles tr ⇄ en
  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'tr' ? 'en' : 'tr'))
  }, [])

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, langs: SUPPORTED_LANGS, meta: LANG_META, currentMeta: LANG_META[lang] }),
    [lang, setLang, toggleLang, t]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
