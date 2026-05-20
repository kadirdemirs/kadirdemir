import { useEffect, useRef, useState } from 'react'

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()'

export default function DecryptedText({
  text = '',
  speed = 50,
  maxIterations = 12,
  sequential = true,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = DEFAULT_CHARS,
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'view',
  ...rest
}) {
  const [display, setDisplay] = useState(text)
  const [revealed, setRevealed] = useState(new Set())
  const [animating, setAnimating] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!animating) return
    const pool = useOriginalCharsOnly ? Array.from(new Set(text.split(''))) : characters.split('')
    let frame = 0
    const interval = setInterval(() => {
      frame++
      setDisplay(() => {
        const chars = text.split('').map((ch, i) => {
          if (revealed.has(i) || ch === ' ') return ch
          return pool[Math.floor(Math.random() * pool.length)]
        })
        return chars.join('')
      })

      if (sequential) {
        const totalToReveal = Math.min(frame, text.length)
        const nextRevealed = new Set(revealed)
        for (let i = 0; i < totalToReveal; i++) {
          const idx = revealDirection === 'end' ? text.length - 1 - i : revealDirection === 'center' ? Math.floor(text.length / 2) + (i % 2 === 0 ? i / 2 : -(Math.ceil(i / 2))) : i
          if (idx >= 0 && idx < text.length) nextRevealed.add(idx)
        }
        setRevealed(nextRevealed)
        if (nextRevealed.size >= text.length) {
          setAnimating(false)
          setDisplay(text)
        }
      } else if (frame >= maxIterations) {
        setAnimating(false)
        setDisplay(text)
      }
    }, speed)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating, text])

  useEffect(() => {
    if (animateOn === 'view') {
      const node = ref.current
      if (!node) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !animating) {
            setRevealed(new Set())
            setAnimating(true)
            obs.unobserve(node)
          }
        },
        { threshold: 0.3 },
      )
      obs.observe(node)
      return () => obs.disconnect()
    }
    if (animateOn === 'hover') {
      const node = ref.current
      if (!node) return
      const onEnter = () => {
        if (!animating) {
          setRevealed(new Set())
          setAnimating(true)
        }
      }
      node.addEventListener('mouseenter', onEnter)
      return () => node.removeEventListener('mouseenter', onEnter)
    }
  }, [animateOn, animating])

  return (
    <span ref={ref} className={parentClassName} {...rest}>
      <span className={className} aria-hidden="true">
        {display.split('').map((ch, i) => (
          <span key={i} className={revealed.has(i) || ch === ' ' ? '' : encryptedClassName}>
            {ch}
          </span>
        ))}
      </span>
      <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {text}
      </span>
    </span>
  )
}
