import { useEffect, useRef, useState } from 'react'

export default function CountUp({
  to,
  end,
  from = 0,
  start,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals,
  separator = '.',
  className = '',
  once = true,
}) {
  const target = Number(to ?? end ?? 0)
  const begin = Number(from ?? start ?? 0)
  const durationMs = duration > 50 ? duration : duration * 1000
  const autoDecimals = decimals != null
    ? decimals
    : (Number.isFinite(target) && !Number.isInteger(target) ? 1 : 0)

  const [value, setValue] = useState(begin)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const animate = () => {
      const startedAt = performance.now()
      const tick = (now) => {
        const t = Math.min(1, (now - startedAt) / Math.max(durationMs, 16))
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(begin + (target - begin) * eased)
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    if (typeof IntersectionObserver === 'undefined') {
      if (!started.current) { started.current = true; animate() }
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true
            animate()
            if (once) io.unobserve(el)
          }
        })
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [target, begin, durationMs, once])

  const formatted = Number.isFinite(value) ? value.toFixed(autoDecimals) : '0'
  const [intPart, decPart] = formatted.split('.')
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  const display = decPart ? `${withSep},${decPart}` : withSep

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}
