import { useEffect, useState } from 'react'

export default function ReadingProgress({ targetRef }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const compute = () => {
      const el = targetRef?.current
      const start = el ? el.offsetTop : 0
      const total = el ? el.offsetHeight : document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY - start
      const visible = Math.min(Math.max(scrolled, 0), Math.max(total, 1))
      const pct = total > 0 ? (visible / total) * 100 : 0
      setProgress(pct)
      raf = 0
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [targetRef])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #f59e0b 0%, #fb923c 100%)',
          boxShadow: '0 0 12px rgba(45, 212, 191, 0.6)',
          transition: 'width 0.08s linear',
        }}
      />
    </div>
  )
}
