import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSiteSettingsApi } from '../api'

export const DEFAULT_SITE_SETTINGS = {
  businessName: 'Kadir Demir',
  tagline: 'YouTube İçerik Üreticisi',
  description: "İstanbul'dan yayın yapan bir YouTuber. Oyun, vlog ve eğlence içerikleri üretiyor.",
  email: 'hello@kadirdemir.tv',
  businessEmail: 'business@kadirdemir.tv',
  phone: '',
  address: 'İstanbul, TR',
  baseUrl: 'https://kadirdemir-nu.vercel.app',

  // Social URLs
  youtube: 'https://youtube.com/@kadirdemir',
  youtubeHandle: '@kadirdemir',
  youtubeChannelId: '',
  instagram: 'https://instagram.com/kadirdemir',
  instagramHandle: '@kadirdemir',
  tiktok: 'https://tiktok.com/@kadirdemir',
  tiktokHandle: '@kadirdemir',
  twitch: 'https://twitch.tv/kadirdemir',
  twitter: 'https://x.com/kadirdemir',
  twitterHandle: '@kadirdemir',
  linkedin: '',
  whatsapp: '',
  discord: '',

  // Stats (overridable)
  statsYoutubeSubs: '2.4M',
  statsInstagramFollowers: '3.3M',
  statsTotalViews: '1.02B',
  statsTotalVideos: '3.8K',

  // SEO
  seoTitle: 'Kadir Demir | YouTube İçerik Üreticisi',
  seoDescription: "İstanbul'dan yayın yapan YouTube içerik üreticisi. Oyun, vlog ve eğlence videoları.",
  seoKeywords: 'kadir demir, kadir demir youtube, kadir demir youtuber, türk youtuber, istanbul youtuber',

  // Instagram manual grid (admin can paste post links)
  instagramPosts: [],
}

const SiteSettingsContext = createContext({
  settings: DEFAULT_SITE_SETTINGS,
  loading: true,
  refresh: () => {},
})

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    return getSiteSettingsApi()
      .then((res) => {
        if (res?.data) {
          const merged = { ...DEFAULT_SITE_SETTINGS, ...res.data }
          setSettings(merged)
          if (merged.baseUrl && typeof window !== 'undefined') {
            window.__SITE_BASE_URL__ = merged.baseUrl
          }
        }
      })
      .catch(() => { /* fall back to defaults */ })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  const value = useMemo(() => ({ settings, loading, refresh }), [settings, loading])

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
