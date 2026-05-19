import { motion } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

const easing = [0.22, 1, 0.36, 1]

export default function PageTransition({ children, className }) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={`page-wrapper ${className || ''}`}>{children}</div>
  }

  return (
    <motion.div
      className={`page-wrapper ${className || ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: easing }}
    >
      {children}
    </motion.div>
  )
}
