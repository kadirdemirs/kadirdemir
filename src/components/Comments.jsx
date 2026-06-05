import { useEffect, useState } from 'react'
import { HiOutlineChatAlt2, HiOutlineUserCircle } from 'react-icons/hi'
import { getCommentsApi, postCommentApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'

const NAME_STORAGE = 'kd_comment_name'

function relative(date, lang) {
  if (!date) return ''
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const min = 60 * 1000
  const hour = 60 * min
  const day = 24 * hour
  if (diff < min) return lang === 'en' ? 'just now' : 'şimdi'
  if (diff < hour) return lang === 'en' ? `${Math.floor(diff / min)}m ago` : `${Math.floor(diff / min)} dk önce`
  if (diff < day) return lang === 'en' ? `${Math.floor(diff / hour)}h ago` : `${Math.floor(diff / hour)} sa önce`
  if (diff < 7 * day) return lang === 'en' ? `${Math.floor(diff / day)}d ago` : `${Math.floor(diff / day)} gün önce`
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')
}

export default function Comments({ postSlug }) {
  const { lang } = useLanguage()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [pendingNotice, setPendingNotice] = useState(false)

  useEffect(() => {
    setAuthor(localStorage.getItem(NAME_STORAGE) || '')
  }, [])

  useEffect(() => {
    if (!postSlug) return
    setLoading(true)
    getCommentsApi(postSlug)
      .then((d) => Array.isArray(d) && setList(d))
      .catch((err) => console.error('Failed to load comments:', err))
      .finally(() => setLoading(false))
  }, [postSlug])

  const t = (k) => ({
    title:    { tr: 'Yorumlar', en: 'Comments' },
    empty:    { tr: 'Henüz yorum yok. İlk yorumu sen yap.', en: 'No comments yet. Be the first.' },
    name:     { tr: 'İsim', en: 'Name' },
    body:     { tr: 'Yorumun', en: 'Your comment' },
    send:     { tr: 'Yorum gönder', en: 'Post comment' },
    sending:  { tr: 'Gönderiliyor...', en: 'Posting...' },
    pending:  {
      tr: 'Teşekkürler! Yorumun moderasyon onayından sonra burada görünecek.',
      en: 'Thanks! Your comment will appear here after moderation.',
    },
    rules:    {
      tr: 'Saygılı dil kullan, kişisel saldırı veya spam bağlantı yok. Ekran isminin gerçek olmasına gerek yok.',
      en: 'Be respectful — no personal attacks or spam links. Display name does not have to be real.',
    },
  }[k]?.[lang] || k)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setPendingNotice(false)
    setSubmitting(true)
    try {
      const created = await postCommentApi({ postSlug, author: author.trim(), body: body.trim() })
      localStorage.setItem(NAME_STORAGE, author.trim())
      if (created?.pending) {
        setPendingNotice(true)
      } else {
        setList((arr) => [...arr, created])
      }
      setBody('')
    } catch (err) {
      setError(err.message || 'Hata')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: 'var(--white, #fff)',
    fontSize: '0.92rem',
    fontFamily: 'inherit',
  }

  return (
    <section
      className="glass-card"
      style={{ marginTop: 24, padding: '24px 24px 26px', borderRadius: 16 }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <HiOutlineChatAlt2 size={20} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
          {t('title')} {list.length > 0 && <span style={{ opacity: 0.6, fontWeight: 500 }}>({list.length})</span>}
        </h3>
      </header>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10, marginBottom: 22 }}>
        <label htmlFor="kd-comment-name" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          {t('name')}
        </label>
        <input
          id="kd-comment-name"
          style={{ ...inputStyle, maxWidth: 280, marginTop: -4 }}
          placeholder={t('name')}
          required minLength={1} maxLength={60}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          autoComplete="nickname"
        />
        <label htmlFor="kd-comment-body" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          {t('body')}
        </label>
        <textarea
          id="kd-comment-body"
          style={{ ...inputStyle, minHeight: 90, resize: 'vertical', marginTop: -4 }}
          placeholder={t('body')}
          required minLength={2} maxLength={1500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <small style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem' }}>{t('rules')}</small>
        {error && <div role="alert" style={{ color: '#f87171', fontSize: '0.82rem' }}>{error}</div>}
        {pendingNotice && (
          <div role="status" style={{ color: '#34d399', fontSize: '0.86rem', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '10px 12px', borderRadius: 10 }}>
            {t('pending')}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            justifySelf: 'start',
            background: 'linear-gradient(135deg, #f59e0b, #fb923c)',
            color: '#fff',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 999,
            fontWeight: 600,
            cursor: submitting ? 'wait' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? t('sending') : t('send')}
        </button>
      </form>

      {!loading && list.length === 0 && (
        <p style={{ color: 'var(--gray-light, #94a3b8)', fontSize: '0.92rem' }}>{t('empty')}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {list.map((c) => (
          <div
            key={c._id}
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.82rem' }}>
              <HiOutlineUserCircle size={18} color="#94a3b8" />
              <strong style={{ color: 'var(--white, #fff)' }}>{c.author}</strong>
              <span style={{ color: 'var(--gray-light, #94a3b8)', opacity: 0.7 }}>· {relative(c.createdAt, lang)}</span>
            </div>
            <p style={{ color: 'var(--gray-lighter, #cbd5e1)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
