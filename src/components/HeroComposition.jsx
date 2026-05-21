import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { HiOutlinePlay } from 'react-icons/hi2'
import './HeroComposition.css'

/**
 * Premium content-creator hero composition.
 * Layered glass + kinetic type + animated brush stroke + waveform + dual badges.
 */
export default function HeroComposition({ brandName = 'KADIR' }) {
  const wordmark = (brandName || 'KADIR').toUpperCase().split(' ')[0]
  const reduce = useReducedMotion()
  const rootRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (reduce) return
    const el = rootRef.current
    if (!el) return
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / rect.width
      const dy = (e.clientY - cy) / rect.height
      setTilt({ x: dx * 6, y: -dy * 6 })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [reduce])

  const BAR_COUNT = 32

  return (
    <div className="hc" ref={rootRef} aria-hidden="true">
      {/* Premium layered backdrop */}
      <div className="hc-backdrop">
        <div className="hc-noise" />
        <div className="hc-vignette" />
      </div>

      {/* Conic-gradient border ring */}
      <div className="hc-ring" />

      {/* Editorial timestamp/meta strip — top */}
      <div className="hc-meta-strip">
        <span className="hc-meta-item">
          <span className="hc-meta-label">REC</span>
          <span className="hc-meta-dot" />
        </span>
        <span className="hc-meta-divider" />
        <span className="hc-meta-item">EP · 042</span>
        <span className="hc-meta-divider" />
        <span className="hc-meta-item">04K · 60FPS</span>
      </div>

      {/* Soft drifting glow */}
      <div className="hc-glow" />

      {/* Animated brush stroke */}
      <motion.svg
        className="hc-stroke"
        viewBox="0 0 800 220"
        preserveAspectRatio="none"
        initial={reduce ? { opacity: 0.92 } : { pathLength: 0, opacity: 0 }}
        animate={reduce ? { opacity: 0.92 } : { pathLength: 1, opacity: 0.92 }}
        transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1], delay: 0.4 }}
      >
        <defs>
          <linearGradient id="hcStrokeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#e11d2e" stopOpacity="0" />
            <stop offset="18%" stopColor="#ff2a3d" stopOpacity="1" />
            <stop offset="55%" stopColor="#e11d2e" stopOpacity="1" />
            <stop offset="85%" stopColor="#8a0f17" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8a0f17" stopOpacity="0" />
          </linearGradient>
          <filter id="hcRough">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="5" />
            <feDisplacementMap in="SourceGraphic" scale="18" />
          </filter>
          <filter id="hcRoughThin">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" />
            <feDisplacementMap in="SourceGraphic" scale="6" />
          </filter>
        </defs>
        {/* Main thick swipe */}
        <path
          d="M 10,140 C 170,70 320,180 480,108 C 620,46 720,152 790,82"
          stroke="url(#hcStrokeGrad)"
          strokeWidth="62"
          strokeLinecap="round"
          fill="none"
          filter="url(#hcRough)"
        />
        {/* Thin follow stroke — splatter feel */}
        <path
          d="M 30,160 C 200,130 340,200 500,148 C 640,100 730,178 780,128"
          stroke="url(#hcStrokeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter="url(#hcRoughThin)"
          opacity="0.5"
        />
      </motion.svg>

      {/* Big wordmark — split for kinetic reveal */}
      <div
        className="hc-wordmark-wrap"
        style={{ transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
      >
        <motion.h1
          className="hc-wordmark"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } },
          }}
        >
          {wordmark.split('').map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              className="hc-letter"
              variants={{
                hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.h1>

        <motion.div
          className="hc-wordmark-sub"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.05 }}
        >
          <span className="hc-wordmark-sub-dot" />
          <span className="hc-wordmark-sub-text">canlı · on air</span>
        </motion.div>
      </div>

      {/* Waveform / equalizer bars */}
      <div className="hc-bars">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const seed = (Math.sin(i * 1.31) + Math.cos(i * 0.7) + 2) / 4
          const h = 22 + seed * 78
          return (
            <span
              key={i}
              className={`hc-bar ${reduce ? 'hc-bar--static' : ''}`}
              style={{
                '--h': `${h}%`,
                '--d': `${(i * 0.06).toFixed(2)}s`,
                '--dur': `${(1.1 + (i % 5) * 0.18).toFixed(2)}s`,
              }}
            />
          )
        })}
      </div>

      {/* Floating play badge — top right */}
      <motion.div
        className="hc-badge"
        initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.4, rotate: -25 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 1.3, ease: [0.22, 1.4, 0.36, 1] }}
      >
        <span className="hc-badge-ring" />
        <span className="hc-badge-ring hc-badge-ring--inner" />
        <span className="hc-badge-core">
          <HiOutlinePlay size={20} />
        </span>
      </motion.div>

      {/* Tag chip — bottom left */}
      <motion.div
        className="hc-chip"
        initial={reduce ? { opacity: 1 } : { opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.55 }}
      >
        <span className="hc-chip-glyph">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6.5C3 5.12 4.12 4 5.5 4h13C19.88 4 21 5.12 21 6.5v11c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 20 3 18.88 3 17.5v-11Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="m9.5 9 6 3-6 3V9Z" fill="currentColor"/>
          </svg>
        </span>
        <span className="hc-chip-text">stüdyo · istanbul</span>
      </motion.div>

      {/* Editorial corner ticks */}
      <span className="hc-tick hc-tick-tl" />
      <span className="hc-tick hc-tick-tr" />
      <span className="hc-tick hc-tick-bl" />
      <span className="hc-tick hc-tick-br" />

      {/* Scanline overlay */}
      <div className="hc-scan" />
    </div>
  )
}
