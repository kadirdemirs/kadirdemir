import { useEffect, useRef, useState } from 'react'

export default function Magnet({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 0.5,
  activeTransition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  inactiveTransition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
  wrapperClassName = '',
  innerClassName = '',
  ...rest
}) {
  const ref = useRef(null)
  const innerRef = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (disabled) return
    const wrap = ref.current
    if (!wrap) return

    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const insideX = Math.abs(dx) < rect.width / 2 + padding
      const insideY = Math.abs(dy) < rect.height / 2 + padding

      if (insideX && insideY) {
        if (!active) setActive(true)
        if (innerRef.current) {
          innerRef.current.style.transform = `translate3d(${dx * magnetStrength}px, ${dy * magnetStrength}px, 0)`
        }
      } else {
        if (active) setActive(false)
        if (innerRef.current) {
          innerRef.current.style.transform = 'translate3d(0, 0, 0)'
        }
      }
    }

    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [active, disabled, padding, magnetStrength])

  return (
    <span ref={ref} className={wrapperClassName} style={{ display: 'inline-block', position: 'relative' }} {...rest}>
      <span
        ref={innerRef}
        className={innerClassName}
        style={{
          display: 'inline-block',
          transition: active ? activeTransition : inactiveTransition,
          willChange: 'transform',
        }}
      >
        {children}
      </span>
    </span>
  )
}
