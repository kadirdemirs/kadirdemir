import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlineArrowRight,
  HiOutlinePrinter,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineGlobeAlt,
  HiOutlineCheck,
} from 'react-icons/hi'
import { FaYoutube, FaInstagram, FaTiktok, FaXTwitter } from 'react-icons/fa6'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { BreadcrumbSchema } from '../components/StructuredData'
import ScrollStack, { ScrollStackItem } from '../components/reactbits/ScrollStack'
import './MediaKit.css'

// Defaults moved to useSiteSettings → admin can override every list below.

export default function MediaKit() {
  const { settings } = useSiteSettings()
  const { t } = useLanguage()
  const audienceBreakdown = Array.isArray(settings.mediaKitAudience) ? settings.mediaKitAudience : []
  const topRegions = Array.isArray(settings.mediaKitRegions) ? settings.mediaKitRegions : []
  const kpis = Array.isArray(settings.mediaKitKpis) ? settings.mediaKitKpis : []
  const collabFormats = Array.isArray(settings.mediaKitFormats) ? settings.mediaKitFormats : []
  const principles = Array.isArray(settings.mediaKitPrinciples) ? settings.mediaKitPrinciples : []
  const themes = Array.isArray(settings.mediaKitContentThemes) ? settings.mediaKitContentThemes : []
  const dataSourceNote = settings.mediaKitDataSourceNote || ''

  useSEO({
    title: t('mediakit.pageTitle'),
    description: `${settings.businessName || 'Kadir Demir'} — ${t('mediakit.sub')}`,
    path: '/medya-kit',
  })

  useEffect(() => {
    document.body.classList.add('kd-mediakit-body')
    return () => document.body.classList.remove('kd-mediakit-body')
  }, [])

  const [reduceMotion, setReduceMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const stats = [
    { icon: FaYoutube, label: t('home.statsYoutube'), value: settings.statsYoutubeSubs || '—', color: '#ff0033' },
    { icon: FaInstagram, label: t('home.statsInstagram'), value: settings.statsInstagramFollowers || '—', color: '#e1306c' },
    { icon: FaTiktok, label: t('home.statsTiktok'), value: settings.statsTiktokFollowers || '—', color: '#ffffff' },
    { icon: FaXTwitter, label: 'X', value: settings.statsTwitterFollowers || '—', color: '#ffffff' },
  ].filter((s) => s.value && s.value !== '—')

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const businessEmail = settings.businessEmail || 'thekademedia@gmail.com'

  return (
    <div className="kd-mediakit">
      <BreadcrumbSchema
        items={[
          { name: t('nav.home'), path: '/' },
          { name: t('sponsor.pill'), path: '/sponsor' },
          { name: t('mediakit.pageTitle'), path: '/medya-kit' },
        ]}
      />

      <div className="kd-mediakit-toolbar">
        <Link to="/sponsor" className="kd-mediakit-back">
          {t('mediakit.backToSponsor')}
        </Link>
        <div className="kd-mediakit-actions">
          <button type="button" onClick={handlePrint} className="kd-mediakit-btn">
            <HiOutlineDownload size={16} />
            {t('mediakit.downloadPdf')}
          </button>
          <a href={`mailto:${businessEmail}?subject=Sponsorluk%20Talebi`} className="kd-mediakit-btn kd-mediakit-btn-primary">
            <HiOutlineMail size={16} />
            {t('mediakit.contactDirect')}
          </a>
        </div>
      </div>

      <header className="kd-mediakit-hero">
        <span className="kd-mediakit-pill">{t('mediakit.headerLabel')} · {new Date().getFullYear()}</span>
        <h1>
          {settings.businessName || 'Kadir Demir'}
          <br />
          <span className="kd-mediakit-accent">{t('mediakit.role')}</span>
        </h1>
        <p>{settings.description || t('mediakit.fallbackDesc')}</p>
      </header>

      {stats.length > 0 && (
        <section className="kd-mediakit-stats">
          {stats.map((s) => (
            <div key={s.label} className="kd-mediakit-stat-card">
              <span className="kd-mediakit-stat-icon" style={{ color: s.color }}>
                <s.icon size={22} />
              </span>
              <div className="kd-mediakit-stat-value">{s.value}</div>
              <div className="kd-mediakit-stat-label">{s.label}</div>
            </div>
          ))}
        </section>
      )}

      <section className="kd-mediakit-grid">
        <div className="kd-mediakit-card">
          <header>
            <HiOutlineUserGroup size={18} />
            <h2>{t('mediakit.audienceTitle')}</h2>
          </header>
          <ul className="kd-mediakit-bars">
            {audienceBreakdown.map((row) => (
              <li key={row.label}>
                <span className="kd-mediakit-bar-label">{row.label}</span>
                <span className="kd-mediakit-bar-track" aria-hidden="true">
                  <span className="kd-mediakit-bar-fill" style={{ width: `${row.value}%` }} />
                </span>
                <span className="kd-mediakit-bar-value">{row.value}%</span>
              </li>
            ))}
          </ul>
          {dataSourceNote && <p className="kd-mediakit-note">{dataSourceNote}</p>}
        </div>

        <div className="kd-mediakit-card">
          <header>
            <HiOutlineGlobeAlt size={18} />
            <h2>{t('mediakit.regionsTitle')}</h2>
          </header>
          <ul className="kd-mediakit-regions">
            {topRegions.map((r) => (
              <li key={r.name}>
                <span aria-hidden="true">{r.flag}</span>
                <span className="kd-mediakit-region-name">{r.name}</span>
                <span className="kd-mediakit-region-share">{r.share}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="kd-mediakit-card">
          <header>
            <HiOutlineChartBar size={18} />
            <h2>{t('mediakit.kpisTitle')}</h2>
          </header>
          <ul className="kd-mediakit-kpis">
            {kpis.map((k) => (
              <li key={k.label}>
                <strong>{k.value}</strong> {k.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="kd-mediakit-card">
          <header>
            <FaYoutube size={18} color="#ff0033" />
            <h2>{t('mediakit.themesTitle')}</h2>
          </header>
          <ul className="kd-mediakit-tags">
            {themes.map((theme) => (
              <li key={theme}>{theme}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="kd-mediakit-formats">
        <h2>{t('mediakit.formatsTitle')}</h2>
        {reduceMotion ? (
          <div className="kd-mediakit-formats-grid">
            {collabFormats.map((f) => (
              <div key={f.title} className="kd-mediakit-format">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="kd-mediakit-stack-wrap">
            <ScrollStack
              itemDistance={60}
              itemStackDistance={20}
              stackPosition="22%"
              scaleEndPosition="12%"
              baseScale={0.88}
              itemScale={0.025}
            >
              {collabFormats.map((f) => (
                <ScrollStackItem key={f.title} itemClassName="kd-mediakit-stack-card">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </ScrollStackItem>
              ))}
            </ScrollStack>
          </div>
        )}
        <p className="kd-mediakit-note">
          Bütçe aralığı kampanya formatına ve süresine göre değişir. Konuşmaya{' '}
          <Link to="/sponsor">sponsor formundan</Link> başlayabilirsin.
        </p>
      </section>

      <section className="kd-mediakit-principles">
        <h2>{t('mediakit.principlesTitle')}</h2>
        <ul>
          {principles.map((p) => (
            <li key={p}>
              <HiOutlineCheck size={18} />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="kd-mediakit-cta">
        <div>
          <h2>{t('mediakit.ctaTitle')}</h2>
          <p>{t('mediakit.ctaSub')}</p>
        </div>
        <div className="kd-mediakit-cta-actions">
          <Link to="/sponsor" className="kd-mediakit-btn kd-mediakit-btn-primary">
            {t('mediakit.sponsorForm')} <HiOutlineArrowRight size={16} />
          </Link>
          <a href={`mailto:${businessEmail}`} className="kd-mediakit-btn">
            <HiOutlineMail size={16} /> {businessEmail}
          </a>
          <button type="button" onClick={handlePrint} className="kd-mediakit-btn">
            <HiOutlinePrinter size={16} /> {t('mediakit.print')}
          </button>
        </div>
      </section>

      <footer className="kd-mediakit-footer">
        <small>
          Tüm rakamlar son 90 gün ortalamasıdır ve resmi YouTube Studio + Meta + TikTok
          Analytics dashboard’larından alınmıştır. Bu sayfa {new Date().toLocaleDateString('tr-TR')}{' '}
          tarihinde güncellendi.
        </small>
      </footer>
    </div>
  )
}
