import { useState } from 'react'
import { HiOutlineSparkles, HiOutlineCheck } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { submitSponsorApi } from '../api'

const CAMPAIGN_TYPES = [
  { value: 'video', label: { tr: 'Tek video sponsorluğu', en: 'Single video sponsorship' } },
  { value: 'shorts', label: { tr: 'YouTube Shorts kampanyası', en: 'YouTube Shorts campaign' } },
  { value: 'live-stream', label: { tr: 'Canlı yayın sponsorluğu', en: 'Live stream sponsorship' } },
  { value: 'long-term', label: { tr: 'Uzun soluklu iş birliği', en: 'Long-term partnership' } },
  { value: 'event', label: { tr: 'Etkinlik / Lansman', en: 'Event / Launch' } },
  { value: 'product-review', label: { tr: 'Ürün incelemesi', en: 'Product review' } },
  { value: 'other', label: { tr: 'Diğer', en: 'Other' } },
]

const BUDGETS = [
  { value: '<5k', label: { tr: '< 5.000 TL', en: '< 5K TRY' } },
  { value: '5k-15k', label: { tr: '5.000 - 15.000 TL', en: '5K - 15K TRY' } },
  { value: '15k-50k', label: { tr: '15.000 - 50.000 TL', en: '15K - 50K TRY' } },
  { value: '50k-100k', label: { tr: '50.000 - 100.000 TL', en: '50K - 100K TRY' } },
  { value: '100k+', label: { tr: '100.000 TL+', en: '100K+ TRY' } },
  { value: 'open', label: { tr: 'Konuşalım', en: 'Let\'s talk' } },
]

export default function Sponsor() {
  const { lang } = useLanguage()
  useSEO({
    title: lang === 'en' ? 'Sponsor Inquiry' : 'Sponsor Başvurusu',
    description: lang === 'en'
      ? 'Brand collaboration & sponsorship inquiries for Kadir Demir.'
      : 'Kadir Demir ile marka iş birliği ve sponsorluk başvurusu.',
    path: '/sponsor',
  })

  const [form, setForm] = useState({
    company: '', contactName: '', email: '', phone: '', website: '',
    campaignType: 'video', budget: 'open', deadline: '', message: '',
  })
  const [status, setStatus] = useState({ state: 'idle', error: null })

  const t = (k) => ({
    head1:     { tr: 'Birlikte ', en: 'Let\'s build ' },
    headHi:    { tr: 'bir kampanya kuralım', en: 'a campaign together' },
    sub:       { tr: 'Marka iş birlikleri, sponsorluk ve özel projeler için 24 saat içinde döneriz.', en: 'Brand collaborations, sponsorships and custom projects — 24h response.' },
    company:   { tr: 'Marka / Şirket adı', en: 'Brand / Company name' },
    contact:   { tr: 'İletişim kişisi', en: 'Contact person' },
    email:     { tr: 'E-posta', en: 'Email' },
    phone:     { tr: 'Telefon (opsiyonel)', en: 'Phone (optional)' },
    website:   { tr: 'Web sitesi (opsiyonel)', en: 'Website (optional)' },
    campaign:  { tr: 'Kampanya tipi', en: 'Campaign type' },
    budget:    { tr: 'Bütçe aralığı', en: 'Budget range' },
    deadline:  { tr: 'Hedef tarih (opsiyonel)', en: 'Target date (optional)' },
    msg:       { tr: 'Mesaj — kısaca brief, hedef kitle, ürün/hizmet', en: 'Briefly — campaign brief, target audience, product/service' },
    submit:    { tr: 'Başvuruyu gönder', en: 'Submit inquiry' },
    sending:   { tr: 'Gönderiliyor...', en: 'Sending...' },
    successT:  { tr: 'Teşekkürler!', en: 'Thank you!' },
    successM:  { tr: 'Başvurun bize ulaştı. 24 saat içinde dönüş yapacağız.', en: 'Your inquiry was received. We\'ll respond within 24h.' },
  }[k]?.[lang] || k)

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus({ state: 'sending', error: null })
    try {
      await submitSponsorApi(form)
      setStatus({ state: 'success', error: null })
    } catch (err) {
      setStatus({ state: 'error', error: err.message || 'Hata' })
    }
  }

  if (status.state === 'success') {
    return (
      <div className="kd-blog" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px', borderRadius: 24, maxWidth: 480, margin: '0 auto' }}>
          <span style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #2dd4bf, #818cf8)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <HiOutlineCheck size={32} color="#fff" />
          </span>
          <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>{t('successT')}</h2>
          <p style={{ color: 'var(--gray-light, #94a3b8)' }}>{t('successM')}</p>
        </div>
      </div>
    )
  }

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: 'var(--white, #fff)',
    fontSize: '0.92rem',
    fontFamily: 'inherit',
  }

  return (
    <div className="kd-blog">
      <header className="kd-blog-head">
        <span className="kd-blog-pill"><HiOutlineSparkles size={14} /> Sponsor</span>
        <h1>{t('head1')}<span className="kd-accent">{t('headHi')}</span></h1>
        <p>{t('sub')}</p>
      </header>

      <form
        onSubmit={onSubmit}
        className="glass-card"
        style={{ padding: '28px 28px 32px', borderRadius: 16, display: 'grid', gap: 16, marginTop: 24 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <label>
            <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('company')} *</div>
            <input style={inputStyle} required maxLength={120} value={form.company} onChange={(e) => update('company', e.target.value)} />
          </label>
          <label>
            <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('contact')} *</div>
            <input style={inputStyle} required maxLength={120} value={form.contactName} onChange={(e) => update('contactName', e.target.value)} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <label>
            <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('email')} *</div>
            <input type="email" style={inputStyle} required maxLength={160} value={form.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <label>
            <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('phone')}</div>
            <input style={inputStyle} maxLength={40} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </label>
        </div>

        <label>
          <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('website')}</div>
          <input style={inputStyle} placeholder="https://..." maxLength={200} value={form.website} onChange={(e) => update('website', e.target.value)} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <label>
            <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('campaign')}</div>
            <select style={inputStyle} value={form.campaignType} onChange={(e) => update('campaignType', e.target.value)}>
              {CAMPAIGN_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label[lang] || c.label.tr}</option>)}
            </select>
          </label>
          <label>
            <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('budget')}</div>
            <select style={inputStyle} value={form.budget} onChange={(e) => update('budget', e.target.value)}>
              {BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label[lang] || b.label.tr}</option>)}
            </select>
          </label>
        </div>

        <label>
          <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('deadline')}</div>
          <input style={inputStyle} placeholder={lang === 'en' ? 'e.g. Q2 2026' : 'örn. 2026 Q2'} maxLength={40} value={form.deadline} onChange={(e) => update('deadline', e.target.value)} />
        </label>

        <label>
          <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('msg')} *</div>
          <textarea
            style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }}
            required minLength={10} maxLength={2000}
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
          />
        </label>

        {status.error && (
          <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{status.error}</div>
        )}

        <button
          type="submit"
          disabled={status.state === 'sending'}
          style={{
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #2dd4bf, #818cf8)',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: status.state === 'sending' ? 'wait' : 'pointer',
            opacity: status.state === 'sending' ? 0.7 : 1,
          }}
        >
          {status.state === 'sending' ? t('sending') : t('submit')}
        </button>
      </form>
    </div>
  )
}
