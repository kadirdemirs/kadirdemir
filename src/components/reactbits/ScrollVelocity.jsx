import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'framer-motion'
import './ScrollVelocity.css'

function VelocityText({
  children,
  baseVelocity = 80,
  scrollerRef,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 4,
  velocityMapping = { input: [0, 1000], output: [0, 4] },
  parallaxClassName = 'scroll-velocity-parallax',
  scrollerClassName = 'scroll-velocity-scroller',
}) {
  const baseX = useMotionValue(0)
  const scrollOptions = scrollerRef && scrollerRef.current ? { container: scrollerRef } : {}
  const { scrollY } = useScroll(scrollOptions)
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness })
  const velocityFactor = useTransform(smoothVelocity, velocityMapping.input, velocityMapping.output, {
    clamp: false,
  })

  const copyRef = useRef(null)
  const [copyWidth, setCopyWidth] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (copyRef.current) setCopyWidth(copyRef.current.getBoundingClientRect().width)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [children])

  const wrapPercent = copyWidth ? -copyWidth : -1
  const x = useTransform(baseX, (v) => (copyWidth ? `${wrap(wrapPercent, 0, v)}px` : '0px'))

  const directionFactor = useRef(1)
  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000)
    if (velocityFactor.get() < 0) directionFactor.current = -1
    else if (velocityFactor.get() > 0) directionFactor.current = 1
    moveBy += directionFactor.current * moveBy * velocityFactor.get()
    baseX.set(baseX.get() + moveBy)
  })

  const copies = []
  for (let i = 0; i < numCopies; i++) {
    copies.push(
      <span className={className} key={i} ref={i === 0 ? copyRef : null}>
        {children}
      </span>,
    )
  }

  return (
    <div className={parallaxClassName}>
      <motion.div className={scrollerClassName} style={{ x }}>
        {copies}
      </motion.div>
    </div>
  )
}

export default function ScrollVelocity({
  texts = [],
  velocity = 80,
  className = '',
  damping,
  stiffness,
  numCopies,
  velocityMapping,
  parallaxClassName,
  scrollerClassName,
  scrollerRef,
}) {
  return (
    <section>
      {texts.map((text, index) => (
        <VelocityText
          key={index}
          className={`scroll-velocity-text ${className}`}
          baseVelocity={index % 2 !== 0 ? -velocity : velocity}
          scrollerRef={scrollerRef}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
        >
          {text}&nbsp;
        </VelocityText>
      ))}
    </section>
  )
}
