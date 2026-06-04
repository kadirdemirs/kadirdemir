import { useEffect, useRef, useState } from 'react'
import './MilestoneTracker.css'

function parseSubs(val) {
  if (!val) return null
  const s = String(val).trim().toUpperCase()
  const m = s.match(/^([\d.,]+)\s*([KMB])?$/)
  if (!m) return null
  const num = parseFloat(m[1].replace(/,/g, ''))
  if (!Number.isFinite(num)) return null
  if (m[2] === 'M') return num * 1_000_000
  if (m[2] === 'K') return num * 1_000
  if (m[2] === 'B') return num * 1_000_000_000
  return num
}

function nextMilestone(current) {
  const thresholds = [
    1_000, 5_000, 10_000, 25_000, 50_000,
    100_000, 250_000, 500_000,
    1_000_000, 2_000_000, 5_000_000, 10_000_000,
  ]
  return thresholds.find((t) => t > current) || current * 2
}

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

export default function MilestoneTracker({ subs, targetOverride, isEn }) {
  const current = parseSubs(subs)
  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)

  const target = targetOverride ? parseSubs(targetOverride) : (current ? nextMilestone(current) : null)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setAnimated(true) },
      { threshold: 0.3 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  if (!current || !target) return null

  const pct = Math.min(Math.round((current / target) * 100), 99)
  const remaining = target - current

  return (
    <div className="ms" ref={ref}>
      <div className="ms-labels">
        <span className="ms-current">
          <strong>{fmt(current)}</strong>
          <em>{isEn ? 'subscribers' : 'abone'}</em>
        </span>
        <span className="ms-target">
          {isEn ? 'goal' : 'hedef'} <strong>{fmt(target)}</strong>
        </span>
      </div>
      <div className="ms-track">
        <div
          className="ms-fill"
          style={{ width: animated ? `${pct}%` : '0%' }}
        >
          <span className="ms-pct">{pct}%</span>
        </div>
      </div>
      <p className="ms-note">
        {isEn
          ? `${fmt(remaining)} more to reach ${fmt(target)}`
          : `${fmt(target)} hedefine ${fmt(remaining)} kişi kaldı`}
      </p>
    </div>
  )
}
