import { useRef } from 'react'
import './GlareHover.css'

export default function GlareHover({
  children,
  className = '',
  glareColor = 'rgba(255, 255, 255, 0.18)',
  glareOpacity = 0.6,
  glareAngle = -45,
  glareSize = 280,
  transitionDuration = 700,
  ...rest
}) {
  const ref = useRef(null)

  const handleMouseEnter = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--glare-progress', '100%')
  }

  const handleMouseLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--glare-progress', '-100%')
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`glare-hover ${className}`}
      style={{
        '--glare-color': glareColor,
        '--glare-opacity': glareOpacity,
        '--glare-angle': `${glareAngle}deg`,
        '--glare-size': `${glareSize}%`,
        '--glare-duration': `${transitionDuration}ms`,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
