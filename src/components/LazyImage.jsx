import { useEffect, useRef, useState } from 'react'

export default function LazyImage({
  src,
  alt = '',
  className = '',
  style,
  placeholderColor = 'rgba(255,255,255,0.04)',
  width,
  height,
  onError,
  ...rest
}) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref.current || inView) return
    if (!('IntersectionObserver' in window)) { setInView(true); return }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setInView(true); obs.disconnect() }
        })
      },
      { rootMargin: '200px 0px' }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [inView])

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'inline-block',
        position: 'relative',
        overflow: 'hidden',
        background: placeholderColor,
        ...style,
      }}
    >
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={width}
          height={height}
          onLoad={() => setLoaded(true)}
          onError={onError}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.35s ease',
            filter: loaded ? 'blur(0)' : 'blur(8px)',
          }}
          {...rest}
        />
      )}
    </span>
  )
}
