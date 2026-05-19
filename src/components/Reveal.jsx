import { motion, useReducedMotion } from 'framer-motion'

const easing = [0.22, 1, 0.36, 1]

/**
 * Generic scroll-reveal wrapper.
 * Default: fade + 18px up on first viewport entry.
 * Respects prefers-reduced-motion.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 18,
  duration = 0.7,
  margin = '-80px',
  className,
  as: Tag = 'div',
  ...rest
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[Tag] || motion.div

  if (reduce) {
    const Plain = Tag === 'div' ? 'div' : Tag
    return <Plain className={className} {...rest}>{children}</Plain>
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{ duration, delay, ease: easing }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

/** Stagger children one after another */
export function RevealList({ children, delayStep = 0.08, ...rest }) {
  return (
    <>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <Reveal key={child?.key ?? i} delay={i * delayStep} {...rest}>
              {child}
            </Reveal>
          ))
        : <Reveal {...rest}>{children}</Reveal>}
    </>
  )
}
