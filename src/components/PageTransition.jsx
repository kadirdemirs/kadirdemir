import { motion, useReducedMotion } from 'framer-motion'

const easing = [0.22, 1, 0.36, 1]

export default function PageTransition({ children, className }) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={`page-wrapper ${className || ''}`}>{children}</div>
  }

  return (
    <motion.div
      className={`page-wrapper ${className || ''}`}
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
      transition={{
        duration: 0.55,
        ease: easing,
        filter: { duration: 0.4, ease: easing },
      }}
    >
      {children}
    </motion.div>
  )
}
