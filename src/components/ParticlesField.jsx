import { useEffect, useRef } from 'react'

export default function ParticlesField({ density = 0.00008, color = '45, 212, 191' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let particles = []
    let w = 0
    let h = 0
    let mouseX = -9999
    let mouseY = -9999

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
      const count = Math.min(140, Math.max(40, Math.floor(w * h * density)))
      particles = Array.from({ length: count }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4,
        a: Math.random() * 0.5 + 0.2,
      }))
    }

    const onMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    const onLeave = () => {
      mouseX = -9999
      mouseY = -9999
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        // Drift
        p.x += p.vx
        p.y += p.vy

        // Mouse repulse (gentle)
        const dx = p.x - mouseX
        const dy = p.y - mouseY
        const d2 = dx * dx + dy * dy
        if (d2 < 14000) {
          const f = (14000 - d2) / 14000 * 0.6
          p.x += (dx / Math.sqrt(d2 || 1)) * f
          p.y += (dy / Math.sqrt(d2 || 1)) * f
        }

        // Wrap
        if (p.x < -5) p.x = w + 5
        if (p.x > w + 5) p.x = -5
        if (p.y < -5) p.y = h + 5
        if (p.y > h + 5) p.y = -5

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${p.a})`
        ctx.fill()
      }

      // Connection lines
      ctx.lineWidth = 0.6
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 12000) {
            const alpha = (1 - d2 / 12000) * 0.18
            ctx.strokeStyle = `rgba(${color}, ${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [density, color])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: 0.7,
      }}
    />
  )
}
