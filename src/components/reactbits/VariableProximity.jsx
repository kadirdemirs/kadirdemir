import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './VariableProximity.css'

function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1)
}

export default function VariableProximity({
  label = '',
  fromFontVariationSettings = "'wght' 400",
  toFontVariationSettings = "'wght' 900",
  radius = 90,
  falloff = 'linear',
  containerRef,
  className = '',
  ...rest
}) {
  const elsRef = useRef([])
  const wrapRef = useRef(null)

  useEffect(() => {
    const parsed = (s) => {
      const m = s.match(/'(\w+)'\s+([\d.]+)/g) || []
      return m.map((x) => {
        const [, axis, value] = x.match(/'(\w+)'\s+([\d.]+)/)
        return { axis, value: parseFloat(value) }
      })
    }
    const fromVars = parsed(fromFontVariationSettings)
    const toVars = parsed(toFontVariationSettings)

    const onMove = (e) => {
      const wrap = containerRef?.current || wrapRef.current
      if (!wrap) return
      const x = e.clientX
      const y = e.clientY
      elsRef.current.forEach((el) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const d = getDistance(x, y, cx, cy)
        let t = 0
        if (d < radius) {
          t = 1 - d / radius
          if (falloff === 'exponential') t = Math.pow(t, 2)
          if (falloff === 'gaussian') t = Math.exp(-Math.pow((d / radius) * 2, 2))
        }
        const settings = fromVars
          .map((v, i) => {
            const to = toVars[i]?.value ?? v.value
            const value = v.value + (to - v.value) * t
            return `'${v.axis}' ${value}`
          })
          .join(', ')
        el.style.fontVariationSettings = settings
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [containerRef, fromFontVariationSettings, toFontVariationSettings, radius, falloff])

  const chars = label.split('')

  return (
    <motion.span ref={wrapRef} className={`vp ${className}`} {...rest}>
      {chars.map((c, i) => (
        <span
          key={i}
          ref={(el) => (elsRef.current[i] = el)}
          className="vp-char"
          style={{ fontVariationSettings: fromFontVariationSettings }}
        >
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </motion.span>
  )
}
