import { useRef } from 'react'
import './SpotlightCard.css'

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(245, 158, 11, 0.18)',
  ...rest
}) {
  const divRef = useRef(null)

  const handleMouseMove = (e) => {
    const el = divRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${className}`}
      style={{ '--spotlight-color': spotlightColor }}
      {...rest}
    >
      {children}
    </div>
  )
}
