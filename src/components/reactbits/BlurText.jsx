import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const buildKeyframes = (from, steps) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((s) => Object.keys(s))])
  const keyframes = {}
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])]
  })
  return keyframes
}

export default function BlurText({
  text = '',
  delay = 60,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t) => t,
  onAnimationComplete,
  stepDuration = 0.35,
}) {
  const elements = useMemo(() => {
    if (animateBy === 'words') return text.split(/(\s+)/)
    return text.split('')
  }, [text, animateBy])

  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.unobserve(node)
        }
      },
      { threshold, rootMargin },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [threshold, rootMargin])

  const defaultFrom =
    direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, y: -32 }
      : { filter: 'blur(10px)', opacity: 0, y: 32 }

  const defaultTo = [
    { filter: 'blur(6px)', opacity: 0.5, y: direction === 'top' ? 8 : -8 },
    { filter: 'blur(0px)', opacity: 1, y: 0 },
  ]

  const fromSnapshot = animationFrom ?? defaultFrom
  const toSnapshots = animationTo ?? defaultTo
  const stepCount = toSnapshots.length + 1
  const totalDuration = stepDuration * (stepCount - 1)
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)))

  return (
    <p ref={ref} className={`blur-text ${className}`} style={{ display: 'flex', flexWrap: 'wrap' }}>
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots)
        const spanTransition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: easing,
        }
        return (
          <motion.span
            key={index}
            initial={fromSnapshot}
            animate={inView ? animateKeyframes : fromSnapshot}
            transition={spanTransition}
            onAnimationComplete={
              index === elements.length - 1 ? onAnimationComplete : undefined
            }
            style={{ display: 'inline-block', willChange: 'transform, filter, opacity', whiteSpace: 'pre' }}
          >
            {segment === ' ' ? ' ' : segment}
            {animateBy === 'words' && index < elements.length - 1 ? '' : ''}
          </motion.span>
        )
      })}
    </p>
  )
}
