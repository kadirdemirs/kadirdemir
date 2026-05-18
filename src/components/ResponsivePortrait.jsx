import portrait from '../assets/kadir.jpg?preset-portrait'

export default function ResponsivePortrait({
  alt,
  className = '',
  sizes = '(max-width: 820px) 100vw, 480px',
  loading = 'lazy',
  decoding = 'async',
  style,
}) {
  return (
    <picture className={className}>
      {portrait.sources?.avif && (
        <source type="image/avif" srcSet={portrait.sources.avif} sizes={sizes} />
      )}
      {portrait.sources?.webp && (
        <source type="image/webp" srcSet={portrait.sources.webp} sizes={sizes} />
      )}
      <img
        src={portrait.img.src}
        srcSet={portrait.sources?.jpg}
        sizes={sizes}
        width={portrait.img.w}
        height={portrait.img.h}
        alt={alt}
        loading={loading}
        decoding={decoding}
        style={style}
      />
    </picture>
  )
}
