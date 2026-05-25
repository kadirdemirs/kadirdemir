import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Site genelinde yumuşak kaydırma. Admin sayfası dışında devreye girer.
 * `prefers-reduced-motion: reduce` ise hiç çalışmaz.
 * Klavye/butonla yapılan scrollIntoView() yine çalışır çünkü Lenis browser scroll'u sarmalıyor.
 */
export function useLenis({ enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    // Erişilebilirlik: hareketi azalt
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
      wheelMultiplier: 1,
    })

    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Anchor link'leri yakala (#id ile başlayanlar)
    const handleAnchor = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || href === '#') return
      const target = document.querySelector(href)
      if (target) {
        e.preventDefault()
        lenis.scrollTo(target, { offset: -80 })
      }
    }
    document.addEventListener('click', handleAnchor)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('click', handleAnchor)
      lenis.destroy()
    }
  }, [enabled])
}
