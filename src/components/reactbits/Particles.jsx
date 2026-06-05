import { useEffect, useRef } from 'react'

export default function Particles({
  particleColors = ['#f59e0b', '#fb923c', '#fbbf24'],
  particleCount = 90,
  particleBaseSize = 90,
  moveParticlesOnHover = false,
  particleHoverFactor = 1,
  alphaParticles = true,
  className = '',
  style = {},
}) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let particles = []

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const w = () => canvas.width / dpr
    const h = () => canvas.height / dpr

    const hexToRgb = (hex) => {
      const c = hex.replace('#', '')
      const n =
        c.length === 3
          ? [parseInt(c[0] + c[0], 16), parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16)]
          : [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
      return n
    }

    const initParticles = () => {
      particles = Array.from({ length: particleCount }, () => {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)]
        const [r, g, b] = hexToRgb(color)
        return {
          x: Math.random() * w(),
          y: Math.random() * h(),
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: (Math.random() * 0.5 + 0.5) * (particleBaseSize / 60),
          r, g, b,
          alpha: alphaParticles ? Math.random() * 0.5 + 0.2 : 0.8,
          twinkle: Math.random() * Math.PI * 2,
        }
      })
    }
    initParticles()

    const draw = () => {
      ctx.clearRect(0, 0, w(), h())
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.twinkle += 0.02
        if (p.x < -10) p.x = w() + 10
        if (p.x > w() + 10) p.x = -10
        if (p.y < -10) p.y = h() + 10
        if (p.y > h() + 10) p.y = -10
        const t = (Math.sin(p.twinkle) + 1) * 0.5
        const a = alphaParticles ? p.alpha * (0.4 + t * 0.6) : p.alpha

        if (moveParticlesOnHover) {
          const dx = mouseRef.current.x - p.x
          const dy = mouseRef.current.y - p.y
          const d = Math.hypot(dx, dy)
          if (d < 120) {
            p.x -= (dx / d) * particleHoverFactor * 0.4
            p.y -= (dy / d) * particleHoverFactor * 0.4
          }
        }

        const glow = p.size > 2
        if (glow) { ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, 0.4)` }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${a})`
        ctx.fill()
        if (glow) ctx.shadowBlur = 0
      })
      ctx.shadowBlur = 0
      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    if (moveParticlesOnHover) window.addEventListener('mousemove', onMove)

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
      if (moveParticlesOnHover) window.removeEventListener('mousemove', onMove)
    }
  }, [particleColors, particleCount, particleBaseSize, moveParticlesOnHover, particleHoverFactor, alphaParticles])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}
