import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import './TiltedCard.css'

const SPRING = { type: 'spring', damping: 30, stiffness: 100, mass: 2 }

export default function TiltedCard({
  children,
  className = '',
  rotateAmplitude = 12,
  scaleOnHover = 1.05,
  showMobileWarning = false,
  showTooltip = false,
  captionText = '',
  ...rest
}) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useMotionValue(0), SPRING)
  const rotateY = useSpring(useMotionValue(0), SPRING)
  const scale = useSpring(1, SPRING)
  const opacity = useSpring(0)
  const rotateFigcaption = useSpring(0, { stiffness: 350, damping: 30, mass: 1 })

  const [lastY, setLastY] = useState(0)

  const handleMouseMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - rect.width / 2
    const offsetY = e.clientY - rect.top - rect.height / 2
    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude
    rotateX.set(rotationX)
    rotateY.set(rotationY)
    x.set(e.clientX - rect.left)
    y.set(e.clientY - rect.top)
    const velocityY = offsetY - lastY
    rotateFigcaption.set(-velocityY * 0.6)
    setLastY(offsetY)
  }

  const handleMouseEnter = () => {
    scale.set(scaleOnHover)
    opacity.set(1)
  }

  const handleMouseLeave = () => {
    opacity.set(0)
    scale.set(1)
    rotateX.set(0)
    rotateY.set(0)
    rotateFigcaption.set(0)
  }

  return (
    <figure
      ref={ref}
      className={`tilted-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {showMobileWarning && (
        <div className="tilted-card-mobile">
          Bu efekt mobilde devre dışıdır.
        </div>
      )}
      <motion.div
        className="tilted-card-inner"
        style={{ rotateX, rotateY, scale }}
      >
        {children}
      </motion.div>
      {showTooltip && captionText && (
        <motion.figcaption
          className="tilted-card-caption"
          style={{ x, y, opacity, rotate: rotateFigcaption }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  )
}
