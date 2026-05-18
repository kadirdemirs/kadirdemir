import './AuroraBackground.css'

export default function AuroraBackground({ variant = 'default' }) {
  return (
    <div className={`aurora aurora--${variant}`} aria-hidden="true">
      {/* Mesh gradient blobs (deep layer) */}
      <div className="aurora__blob aurora__blob--1" />
      <div className="aurora__blob aurora__blob--2" />
      <div className="aurora__blob aurora__blob--3" />
      <div className="aurora__blob aurora__blob--4" />

      {/* Aurora light streaks (mid layer) */}
      <div className="aurora__streak aurora__streak--1" />
      <div className="aurora__streak aurora__streak--2" />
      <div className="aurora__streak aurora__streak--3" />

      {/* Grid overlay (top decorative layer) */}
      <div className="aurora__grid" />

      {/* Vignette */}
      <div className="aurora__vignette" />
    </div>
  )
}
