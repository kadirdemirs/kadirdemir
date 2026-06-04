import { useEffect, useState } from 'react'
import { getActivePollApi, votePollApi } from '../api'
import './PollWidget.css'

export default function PollWidget({ isEn }) {
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [voted, setVoted] = useState(false)
  const [chosen, setChosen] = useState(null)

  useEffect(() => {
    getActivePollApi()
      .then((data) => {
        if (data) {
          setPoll(data)
          setVoted(data.voted)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const vote = async (index) => {
    if (voted || !poll || voting) return
    setVoting(true)
    setChosen(index)
    try {
      const updated = await votePollApi(poll._id, index)
      setPoll(updated)
      setVoted(true)
    } catch {
      setVoted(true)
    } finally {
      setVoting(false)
    }
  }

  if (loading || !poll) return null

  const total = poll.totalVotes || 0
  const maxVotes = Math.max(...(poll.options || []).map((o) => o.votes || 0), 1)

  return (
    <div className="pw">
      <div className="pw-head">
        <span className="pw-eyebrow">{isEn ? 'COMMUNITY POLL' : 'TOPLULUK ANKETI'}</span>
        {voted && (
          <span className="pw-total">{total} {isEn ? 'votes' : 'oy'}</span>
        )}
      </div>
      <p className="pw-question">{poll.question}</p>
      <div className="pw-options">
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0
          const isWinner = voted && (opt.votes || 0) === maxVotes
          const isChosen = chosen === i || (voted && poll.voted && i === chosen)
          return (
            <button
              key={i}
              type="button"
              className={`pw-opt ${voted ? 'pw-opt--result' : ''} ${isWinner && voted ? 'pw-opt--winner' : ''}`}
              onClick={() => vote(i)}
              disabled={voted || voting}
            >
              <div
                className="pw-opt-fill"
                style={{ width: voted ? `${pct}%` : '0%' }}
              />
              <span className="pw-opt-label">{opt.label}</span>
              {voted && (
                <span className="pw-opt-pct">{pct}%</span>
              )}
            </button>
          )
        })}
      </div>
      {!voted && (
        <p className="pw-hint">{isEn ? 'Tap to vote — anonymous.' : 'Tıkla oy ver — anonim.'}</p>
      )}
    </div>
  )
}
