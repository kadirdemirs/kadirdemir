import { useEffect, useState } from 'react'
import { HiOutlineSparkles, HiOutlineCheck } from 'react-icons/hi'
import { getActivePollApi, votePollApi } from '../api'
import { useLanguage } from '../i18n/LanguageContext'

const STORAGE_KEY = 'kd_poll_voted'

export default function PollWidget() {
  const { lang } = useLanguage()
  const [poll, setPoll] = useState(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getActivePollApi()
      .then((p) => {
        if (!p) return
        const localVoted = localStorage.getItem(`${STORAGE_KEY}_${p._id}`)
        setPoll({ ...p, voted: p.voted || !!localVoted })
      })
      .catch(() => {})
  }, [])

  if (!poll) return null

  const t = (k) => ({
    pill:    { tr: 'ANKET', en: 'POLL' },
    voted:   { tr: 'Oyladığın için teşekkürler!', en: 'Thanks for voting!' },
    totalT:  { tr: 'oy', en: 'votes' },
    vote:    { tr: 'Oyla', en: 'Vote' },
    err:     { tr: 'Oy verilemedi.', en: 'Could not vote.' },
  }[k]?.[lang] || k)

  const submit = async (idx) => {
    setPending(idx)
    setError(null)
    try {
      const updated = await votePollApi(poll._id, idx)
      localStorage.setItem(`${STORAGE_KEY}_${poll._id}`, String(idx))
      setPoll({ ...updated, voted: true })
    } catch (e) {
      setError(e.message || t('err'))
    } finally {
      setPending(null)
    }
  }

  const total = poll.totalVotes || 0

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px 24px 22px',
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(45,212,191,0.06), rgba(129,140,248,0.06))',
        border: '1px solid rgba(45,212,191,0.18)',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#f59e0b',
            padding: '4px 10px',
            background: 'rgba(45, 212, 191, 0.12)',
            borderRadius: 999,
          }}
        >
          <HiOutlineSparkles size={12} /> {t('pill')}
        </span>
        {total > 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--gray-light, #94a3b8)' }}>
            {total} {t('totalT')}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16, color: 'var(--white, #fff)' }}>
        {poll.question}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(poll.options || []).map((opt, idx) => {
          const votes = opt.votes || 0
          const pct = total > 0 ? Math.round((votes / total) * 100) : 0
          const isPending = pending === idx
          if (poll.voted) {
            return (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, rgba(45, 212, 191, 0.18) 0%, rgba(129, 140, 248, 0.18) 100%)',
                    transition: 'width 0.6s ease',
                  }}
                />
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--white, #fff)', fontWeight: 500, fontSize: '0.92rem' }}>
                    {opt.label}
                  </span>
                  <span style={{ color: 'var(--gray-light, #94a3b8)', fontSize: '0.85rem', fontWeight: 600 }}>
                    {pct}% <span style={{ opacity: 0.6 }}>({votes})</span>
                  </span>
                </div>
              </div>
            )
          }
          return (
            <button
              key={idx}
              type="button"
              disabled={!!pending}
              onClick={() => submit(idx)}
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: 12,
                background: isPending ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--white, #fff)',
                cursor: pending ? 'wait' : 'pointer',
                fontWeight: 500,
                fontSize: '0.92rem',
                transition: 'background 0.15s ease, transform 0.15s ease',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {error && (
        <p style={{ marginTop: 12, color: '#f87171', fontSize: '0.82rem' }}>{error}</p>
      )}
      {poll.voted && (
        <p style={{ marginTop: 14, color: '#f59e0b', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <HiOutlineCheck size={14} /> {t('voted')}
        </p>
      )}
    </div>
  )
}
