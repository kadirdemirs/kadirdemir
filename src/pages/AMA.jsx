import { useEffect, useState } from 'react'
import { HiOutlineQuestionMarkCircle, HiOutlineChatAlt2, HiOutlineCheck, HiOutlineUser } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getAMAApi, askAMAApi } from '../api'
import { BreadcrumbSchema } from '../components/StructuredData'

function relative(date, lang) {
  if (!date) return ''
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const day = 1000 * 60 * 60 * 24
  if (diff < day) return lang === 'en' ? 'today' : 'bugün'
  if (diff < day * 2) return lang === 'en' ? 'yesterday' : 'dün'
  const days = Math.floor(diff / day)
  if (days < 30) return lang === 'en' ? `${days} days ago` : `${days} gün önce`
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')
}

export default function AMA() {
  const { lang } = useLanguage()
  useSEO({
    title: lang === 'en' ? 'AMA — Ask Me Anything' : 'Sor Bana — Soru & Cevap',
    description: lang === 'en'
      ? 'Ask anything and read the answers — Kadir Demir.'
      : 'Aklındaki soruları sor, cevaplarımı oku — Kadir Demir.',
    path: '/sor',
  })

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ question: '', author: '' })
  const [status, setStatus] = useState({ state: 'idle', error: null })

  const refresh = () => {
    setLoading(true)
    getAMAApi()
      .then((d) => Array.isArray(d) && setItems(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const t = (k) => ({
    pill:      { tr: 'Sor Bana', en: 'Ask Me Anything' },
    head1:     { tr: 'Aklındaki ', en: 'Got ' },
    headHi:    { tr: 'her şeyi sor', en: 'a question?' },
    sub:       { tr: 'Soruları okuyup cevaplayacağım. İsimsiz de gönderebilirsin.', en: 'I\'ll read and answer. You can stay anonymous.' },
    qLabel:    { tr: 'Sorun', en: 'Your question' },
    nameLabel: { tr: 'İsim (opsiyonel)', en: 'Name (optional)' },
    submit:    { tr: 'Gönder', en: 'Submit' },
    sending:   { tr: 'Gönderiliyor...', en: 'Sending...' },
    successT:  { tr: 'Soru alındı!', en: 'Question received!' },
    successM:  { tr: 'Cevaplandığında bu sayfada görünür.', en: 'Once answered it will appear on this page.' },
    askMore:   { tr: 'Başka bir soru sor', en: 'Ask another' },
    emptyT:    { tr: 'Henüz yanıtlanmış soru yok', en: 'No answered questions yet' },
    emptyM:    { tr: 'İlk soruyu sen sor.', en: 'Be the first to ask.' },
  }[k]?.[lang] || k)

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus({ state: 'sending', error: null })
    try {
      await askAMAApi(form.question, form.author)
      setStatus({ state: 'success', error: null })
      setForm({ question: '', author: '' })
    } catch (err) {
      setStatus({ state: 'error', error: err.message || 'Hata' })
    }
  }

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
      <BreadcrumbSchema
        items={[
          { name: lang === 'en' ? 'Home' : 'Ana Sayfa', path: '/' },
          { name: t('pill'), path: '/sor' },
        ]}
      />
      <header className="kd-blog-head">
        <span className="kd-blog-pill"><HiOutlineQuestionMarkCircle size={14} /> {t('pill')}</span>
        <h1>{t('head1')}<span className="kd-accent">{t('headHi')}</span></h1>
        <p>{t('sub')}</p>
      </header>

      {status.state === 'success' ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '32px 24px', borderRadius: 16, marginTop: 16 }}>
          <span style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #2dd4bf, #818cf8)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <HiOutlineCheck size={26} color="#fff" />
          </span>
          <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>{t('successT')}</h3>
          <p style={{ color: 'var(--gray-light, #94a3b8)', marginBottom: 14 }}>{t('successM')}</p>
          <button
            type="button"
            onClick={() => setStatus({ state: 'idle', error: null })}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white, #fff)', padding: '10px 20px', borderRadius: 999, cursor: 'pointer', fontWeight: 600 }}
          >
            {t('askMore')}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="glass-card" style={{ padding: '22px 22px 24px', borderRadius: 16, display: 'grid', gap: 12, marginTop: 16 }}>
          <label>
            <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('qLabel')} *</div>
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              required minLength={5} maxLength={500}
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            />
          </label>
          <label style={{ maxWidth: 320 }}>
            <div style={{ marginBottom: 6, fontSize: '0.82rem', fontWeight: 600 }}>{t('nameLabel')}</div>
            <input
              style={inputStyle}
              maxLength={60}
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            />
          </label>
          {status.error && <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{status.error}</div>}
          <button
            type="submit"
            disabled={status.state === 'sending'}
            style={{
              justifySelf: 'start',
              padding: '12px 22px',
              background: 'linear-gradient(135deg, #2dd4bf, #818cf8)',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              fontWeight: 600,
              cursor: status.state === 'sending' ? 'wait' : 'pointer',
              opacity: status.state === 'sending' ? 0.7 : 1,
            }}
          >
            {status.state === 'sending' ? t('sending') : t('submit')}
          </button>
        </form>
      )}

      <section style={{ marginTop: 40 }}>
        {!loading && items.length === 0 && (
          <div className="kd-blog-empty">
            <h3 style={{ marginBottom: 6 }}>{t('emptyT')}</h3>
            <p>{t('emptyM')}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.map((it) => (
            <article
              key={it._id}
              className="glass-card"
              style={{
                padding: '20px 22px 22px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--gray-light, #94a3b8)', fontSize: '0.78rem' }}>
                <HiOutlineUser size={14} />
                <strong style={{ color: 'var(--white, #fff)' }}>{it.author}</strong>
                <span style={{ opacity: 0.6 }}>· {relative(it.askedAt, lang)}</span>
              </div>
              <p style={{ fontSize: '1.05rem', color: 'var(--white, #fff)', marginBottom: 14, lineHeight: 1.6 }}>
                {it.question}
              </p>
              <div
                style={{
                  borderLeft: '3px solid #2dd4bf',
                  paddingLeft: 14,
                  background: 'rgba(45, 212, 191, 0.04)',
                  borderRadius: 4,
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', fontWeight: 700, color: '#2dd4bf', letterSpacing: '0.1em', marginBottom: 6 }}>
                  <HiOutlineChatAlt2 size={14} /> {lang === 'en' ? 'KADIR' : 'KADIR'}
                </div>
                <p style={{ color: 'var(--gray-lighter, #cbd5e1)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {it.answer}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
