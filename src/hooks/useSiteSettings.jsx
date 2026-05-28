import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSiteSettingsApi } from '../api'

export const DEFAULT_SITE_SETTINGS = {
  businessName: 'Kadir Demir',
  tagline: 'YouTube İçerik Üreticisi',
  description: "İstanbul'dan yayın yapan bir YouTuber. Oyun, vlog ve eğlence içerikleri üretiyor.",
  email: 'thekademedia@gmail.com',
  businessEmail: 'thekademedia@gmail.com',
  phone: '',
  address: 'İstanbul, TR',
  baseUrl: 'https://kadirardademir.com',

  // Social URLs
  youtube: 'https://youtube.com/@kadirardademirr',
  youtubeHandle: '@kadirardademirr',
  youtubeChannelId: '',
  instagram: 'https://instagram.com/kadirardademir',
  instagramHandle: '@kadirardademir',
  tiktok: 'https://tiktok.com/@kadirardademir',
  tiktokHandle: '@kadirardademir',
  twitter: 'https://x.com/kadirardademir',
  twitterHandle: '@kadirardademir',
  linkedin: 'https://www.linkedin.com/in/kadirdemirr',
  discord: '',
  whatsapp: '',

  // Stats — gerçek değerler YouTube API + admin'den gelir; sahte placeholder yok
  statsYoutubeSubs: '',
  statsInstagramFollowers: '',
  statsTotalViews: '',
  statsTotalVideos: '',
  statsTiktokFollowers: '',
  statsTiktokLikes: '',
  statsInstagramPosts: '',
  statsActiveYears: '14',

  // SEO
  seoTitle: 'Kadir Demir | YouTube İçerik Üreticisi',
  seoDescription: "İstanbul'dan yayın yapan YouTube içerik üreticisi. Oyun, vlog ve eğlence videoları.",
  seoKeywords: 'kadir demir, kadir demir youtube, kadir demir youtuber, türk youtuber, istanbul youtuber',

  // Instagram manual grid (admin can paste post links)
  instagramPosts: [],

  // Media Kit (editable from admin → site settings)
  mediaKitAudience: [
    { label: '18–24', value: 38 },
    { label: '25–34', value: 34 },
    { label: '35–44', value: 16 },
    { label: '13–17', value: 9 },
    { label: '45+', value: 3 },
  ],
  mediaKitRegions: [
    { name: 'Türkiye', flag: '🇹🇷', share: '72%' },
    { name: 'Almanya', flag: '🇩🇪', share: '8%' },
    { name: 'Hollanda', flag: '🇳🇱', share: '4%' },
    { name: 'Azerbaycan', flag: '🇦🇿', share: '3%' },
    { name: 'Diğer', flag: '🌍', share: '13%' },
  ],
  mediaKitKpis: [
    { label: 'Ortalama etkileşim oranı', value: '%6.4' },
    { label: 'Long-form ilk 48 saat izlenme', value: '180–250K' },
    { label: 'İzleyici tamamlama oranı', value: '%72' },
    { label: 'Aylık benzersiz erişim', value: '1.4M+' },
  ],
  mediaKitFormats: [
    { title: 'Entegrasyon (60–90 sn)', desc: 'Video içinde organik anlatım, hikâyeye yedirilmiş ürün/marka kullanımı.' },
    { title: 'Dedicated Video', desc: 'Tek başına markaya/ürüne odaklanan komple bir video.' },
    { title: 'Shorts Serisi', desc: '3-5 kısa video ile yüksek erişim ve hızlı sosyal yayılma.' },
    { title: 'Canlı Yayın Sponsorluğu', desc: 'YouTube canlı yayınında banner + söz konusu marka anısı.' },
    { title: 'Uzun Soluklu İş Birliği', desc: '3-6 ay süreli, sezon temalı, çoklu format paketi.' },
    { title: 'Etkinlik / Lansman', desc: 'Ürün lansmanı veya etkinlik için özel içerik + sosyal medya kapsamı.' },
  ],
  mediaKitPrinciples: [
    'Yalnızca gerçekten kullanacağım ya da denediğim ürünlerle çalışırım.',
    'İçeriği ben yazar, ben kurgularım — markalar onay sürecinde feedback verebilir.',
    'Sponsorlu içeriği mevzuata uygun etiketle açıkça belirtirim.',
    'Tek seferlik kampanyalarda ödeme %50 başlangıçta, %50 yayın sonrası kesilir.',
  ],
  mediaKitContentThemes: ['Oyun', 'Vlog', 'Eğlence', 'Teknoloji & setup', 'Yaşam tarzı', 'Topluluk etkinlikleri'],
  mediaKitDataSourceNote: 'YouTube Studio + Meta Insights, son 90 gün ortalama.',

  // Setup equipment (editable from admin → site settings)
  setupPC: [],
  setupEquipment: [],
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
          // Legacy DB temizliği — eski kayıtlar Kade Media içeriyor olabilir.
          // thekademedia@gmail.com bilerek korunuyor (gerçek e-posta).
          // Lookbehind kullanmıyoruz (Safari/iOS uyumsuzluğu) — manuel split.
          const fixBrand = (s) => {
            if (typeof s !== 'string') return s
            try {
              let out = s
                .replace(/Kade Media/g, 'Kadir Demir')
                .replace(/kade media/gi, 'Kadir Demir')
              // "kademedia" → "kadirdemir" ama "thekademedia@" hariç
              out = out.replace(/([a-z]?)kademedia(@?)/gi, (m, before, after) => {
                if (before.toLowerCase() === 'e' && after === '@') return m // thekademedia@... korumaya al
                if (m.toLowerCase().startsWith('thekademedia') && after === '@') return m
                return `${before}kadirdemir${after}`
              })
              out = out.replace(/\bKade\b/g, 'Kadir')
              return out
            } catch {
              return s
            }
          }
          for (const key of ['businessName', 'tagline', 'description', 'seoTitle', 'seoDescription', 'seoKeywords']) {
            if (merged[key]) merged[key] = fixBrand(merged[key])
          }
          if (!merged.businessName || merged.businessName === 'Kadir') {
            merged.businessName = 'Kadir Demir'
          }
          // Sosyal medya: DB'deki eski/yanlış handle'lar (kadirdemir, kadirdemirs vb.)
          // güvenilmez. Doğru hesapları her zaman koddaki default'tan zorla.
          // Discord yok — DB'de dolu gelse bile gizle.
          const SOCIAL_KEYS = ['youtube', 'youtubeHandle', 'instagram', 'instagramHandle',
            'tiktok', 'tiktokHandle', 'twitter', 'twitterHandle', 'linkedin']
          for (const key of SOCIAL_KEYS) {
            merged[key] = DEFAULT_SITE_SETTINGS[key]
          }
          merged.discord = ''
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
