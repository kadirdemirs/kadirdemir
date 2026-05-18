import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineSparkles, HiOutlineExternalLink, HiOutlineMail } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getPartnersApi } from '../api'
import { SkeletonGrid } from '../components/Skeleton'
import { BreadcrumbSchema } from '../components/StructuredData'

const TIER_LABEL = {
  gold:    { tr: 'Gold Sponsor', en: 'Gold Sponsor' },
  silver:  { tr: 'Silver Sponsor', en: 'Silver Sponsor' },
  bronze:  { tr: 'Bronze Sponsor', en: 'Bronze Sponsor' },
  partner: { tr: 'İş Birliği', en: 'Partner' },
}

const TIER_STYLE = {
  gold:    { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1c1917' },
  silver:  { background: 'linear-gradient(135deg, #d1d5db, #9ca3af)', color: '#1c1917' },
  bronze:  { background: 'linear-gradient(135deg, #fb923c, #c2410c)', color: '#fff' },
  partner: { background: 'linear-gradient(135deg, #2dd4bf, #818cf8)', color: '#fff' },
}

export default function Partners() {
  const { lang } = useLanguage()
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)

  useSEO({
    title: lang === 'en' ? 'Partners' : 'İş Birlikleri',
    description: lang === 'en'
      ? 'Brands and partners I work with — Kadir Demir.'
      : 'Birlikte çalıştığım markalar ve iş birlikleri — Kadir Demir.',
    path: '/partnerler',
  })

  useEffect(() => {
    getPartnersApi()
      .then((d) => Array.isArray(d) && setPartners(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const t = (k) => ({
    pill:     { tr: 'İş Birlikleri', en: 'Partners' },
    head1:    { tr: 'Birlikte ', en: 'Together ' },
    headHi:   { tr: 'büyüyoruz', en: 'we grow' },
    sub:      { tr: 'Birlikte çalıştığım markalar ve uzun soluklu iş birlikleri.', en: 'Brands and long-term collaborations.' },
    ctaTitle: { tr: 'Sen de partner olmak ister misin?', en: 'Want to become a partner?' },
    ctaDesc:  { tr: 'Marka iş birlikleri, sponsorluk ve özel projeler için iletişime geç.', en: 'Reach out for brand collaborations, sponsorship and custom projects.' },
    ctaBtn:   { tr: 'Sponsor başvurusu', en: 'Sponsor inquiry' },
    visit:    { tr: 'Web sitesi', en: 'Visit site' },
    empty:    { tr: 'Henüz partner eklenmedi.', en: 'No partners yet.' },
  }[k]?.[lang] || k)

  return (
    <div className="kd-blog">
      <BreadcrumbSchema
        items={[
          { name: lang === 'en' ? 'Home' : 'Ana Sayfa', path: '/' },
          { name: t('pill'), path: '/partnerler' },
        ]}
      />
      <header className="kd-blog-head">
        <span className="kd-blog-pill"><HiOutlineSparkles size={14} /> {t('pill')}</span>
        <h1>{t('head1')}<span className="kd-accent">{t('headHi')}</span></h1>
        <p>{t('sub')}</p>
      </header>

      {loading && <SkeletonGrid count={6} kind="video" />}

      {!loading && partners.length === 0 && (
        <div className="kd-blog-empty">
          <p>{t('empty')}</p>
        </div>
      )}

      {!loading && partners.length > 0 && (
        <div className="kd-blog-grid" style={{ marginTop: 24 }}>
          {partners.map((p) => {
            const tier = p.tier || 'partner'
            const tierLabel = (TIER_LABEL[tier] || TIER_LABEL.partner)[lang] || tier
            const tierStyle = TIER_STYLE[tier] || TIER_STYLE.partner
            const Card = p.url ? 'a' : 'div'
            const linkProps = p.url ? { href: p.url, target: '_blank', rel: 'noopener noreferrer' } : {}
            return (
              <Card key={p._id || p.name} {...linkProps} className="kd-blog-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="kd-blog-thumb"
                  style={{
                    background: p.logo ? `url(${p.logo}) center/contain no-repeat #0a0a0e` : 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(129,140,248,0.15))',
                    minHeight: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {!p.logo && (p.name?.[0] || 'P')}
                </div>
                <div className="kd-blog-info">
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '3px 10px',
                      borderRadius: 999,
                      marginBottom: 8,
                      ...tierStyle,
                    }}
                  >
                    {tierLabel}
                  </span>
                  <h4 style={{ marginBottom: 4 }}>{p.name}</h4>
                  {p.description && <p>{p.description}</p>}
                  {p.url && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: '0.78rem', color: 'var(--primary, #2dd4bf)' }}>
                      {t('visit')} <HiOutlineExternalLink size={12} />
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <section
        className="glass-card"
        style={{
          marginTop: 60,
          padding: '32px 28px',
          borderRadius: 16,
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(129,140,248,0.08))',
          border: '1px solid rgba(45,212,191,0.2)',
        }}
      >
        <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{t('ctaTitle')}</h2>
        <p style={{ color: 'var(--gray-light, #94a3b8)', marginBottom: 18 }}>{t('ctaDesc')}</p>
        <Link
          to="/sponsor"
          className="kd-btn kd-btn-ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #2dd4bf, #818cf8)',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: 999,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <HiOutlineMail size={16} /> {t('ctaBtn')}
        </Link>
      </section>
    </div>
  )
}
