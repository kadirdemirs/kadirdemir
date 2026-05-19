import './AuroraBackground.css'

/**
 * AuroraBackground — minimal soft glow layer.
 * Sade arka plan: tek geniş radial vinyet + 2 yumuşak orb.
 * Eski 4 blob + 3 streak + grid kaldırıldı (performans + sadelik).
 */
export default function AuroraBackground({ variant = 'default' }) {
  return (
    <div className={`aurora aurora--${variant}`} aria-hidden="true">
      <div className="aurora__orb aurora__orb--1" />
      <div className="aurora__orb aurora__orb--2" />
      <div className="aurora__vignette" />
    </div>
  )
}
