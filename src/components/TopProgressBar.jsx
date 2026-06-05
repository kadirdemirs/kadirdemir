import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function TopProgressBar() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    setProgress(30)
    const t1 = setTimeout(() => setProgress(65), 100)
    const t2 = setTimeout(() => setProgress(90), 300)
    const t3 = setTimeout(() => setProgress(100), 600)
    const t4 = setTimeout(() => { setVisible(false); setProgress(0) }, 900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [location.pathname])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '2px',
        background: 'linear-gradient(90deg, var(--amber-deep, #a67428), var(--amber, #d4943f), var(--amber-soft, #e8b468))',
        zIndex: 9999,
        transition: 'width 0.3s ease, opacity 0.3s ease',
        opacity: progress === 100 ? 0 : 1,
        boxShadow: '0 0 12px var(--amber-glow, rgba(212,148,63,0.5))',
        pointerEvents: 'none',
      }}
    />
  )
}
