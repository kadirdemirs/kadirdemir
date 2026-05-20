import { useRef } from 'react'
import './MagicBento.css'

function BentoCell({ children, className = '', glowColor = '245, 158, 11', span = 1, ...rest }) {
  const ref = useRef(null)

  const handleMouseMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`magic-bento-cell ${className}`}
      style={{ '--glow-rgb': glowColor, '--cell-span': span }}
      {...rest}
    >
      <div className="magic-bento-cell-inner">{children}</div>
    </div>
  )
}

export default function MagicBento({ children, columns = 3, className = '', style = {} }) {
  return (
    <div
      className={`magic-bento-grid ${className}`}
      style={{ '--bento-cols': columns, ...style }}
    >
      {children}
    </div>
  )
}

MagicBento.Cell = BentoCell
