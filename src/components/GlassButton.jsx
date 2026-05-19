import { forwardRef } from 'react'
import './GlassButton.css'

/**
 * GlassButton — tek liquid-glass buton sistemi.
 *
 * Varyantlar:
 *   - primary   : sade beyaz vurgulu cam
 *   - secondary : daha hafif cam (default)
 *   - ghost     : sadece border + hover'da cam dolar
 *
 * Boyutlar: sm | md | lg
 *
 * Render polymorphism: `as` prop ile <button> | <a> | Link | herhangi bir component.
 *
 *   <GlassButton variant="primary" as={Link} to="/iletisim">İletişim</GlassButton>
 *   <GlassButton as="a" href={url} target="_blank">Abone ol</GlassButton>
 */
const GlassButton = forwardRef(function GlassButton(
  {
    as: Component = 'button',
    variant = 'secondary',
    size = 'md',
    icon = null,
    iconRight = null,
    className = '',
    children,
    ...rest
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`gbtn gbtn-${variant} gbtn-${size} ${className}`.trim()}
      {...rest}
    >
      {icon && <span className="gbtn-icon" aria-hidden="true">{icon}</span>}
      <span className="gbtn-label">{children}</span>
      {iconRight && <span className="gbtn-icon gbtn-icon-right" aria-hidden="true">{iconRight}</span>}
    </Component>
  )
})

export default GlassButton
