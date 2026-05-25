import { useEffect, useRef, useState } from 'react'
import './CustomCursor.css'

/**
 * Minimal custom cursor.
 * - Desktop & pointer:fine cihazlarda gözükür
 * - Link / buton / [data-cursor="hover"] üstünde büyür
 * - prefers-reduced-motion'da kapalı
 */
export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const [active, setActive] = useState(true)
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supportsFine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!supportsFine || reduce) {
      setActive(false)
      return
    }

    let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    let ring = { x: pos.x, y: pos.y }
    let rafId

    const dot = dotRef.current
    const r = ringRef.current
    if (!dot || !r) return

    const tick = () => {
      ring.x += (pos.x - ring.x) * 0.18
      ring.y += (pos.y - ring.y) * 0.18
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`
      r.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    const onMove = (e) => { pos.x = e.clientX; pos.y = e.clientY }
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)
    const onLeave = () => { if (dot) dot.style.opacity = '0'; if (r) r.style.opacity = '0' }
    const onEnter = () => { if (dot) dot.style.opacity = '1'; if (r) r.style.opacity = '1' }

    const isHoverTarget = (el) => {
      if (!el || el.nodeType !== 1) return false
      return el.closest('a, button, [role="button"], input, textarea, select, [data-cursor="hover"]')
    }
    const onOver = (e) => { if (isHoverTarget(e.target)) setHover(true) }
    const onOut = (e) => { if (isHoverTarget(e.target)) setHover(false) }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.body.classList.add('has-custom-cursor')

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.body.classList.remove('has-custom-cursor')
    }
  }, [])

  if (!active) return null

  return (
    <>
      <div ref={ringRef} className={`kd-cursor-ring ${hover ? 'is-hover' : ''} ${pressed ? 'is-pressed' : ''}`} aria-hidden="true" />
      <div ref={dotRef} className={`kd-cursor-dot ${hover ? 'is-hover' : ''}`} aria-hidden="true" />
    </>
  )
}
