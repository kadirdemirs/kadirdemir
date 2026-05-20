import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/PageTransition'
import { trackPageviewApi, heartbeatApi, getSessionApi } from './api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ErrorTracker from './components/ErrorTracker'
import AuroraBackground from './components/AuroraBackground'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'
import LiveBanner from './components/LiveBanner'
import CommandPalette from './components/CommandPalette'
import GradualBlur from './components/reactbits/GradualBlur'
import ColorBends from './components/reactbits/ColorBends'
import StaggeredMenu from './components/reactbits/StaggeredMenu'

const MENU_ITEMS = [
  { label: 'Ana Sayfa', ariaLabel: 'Ana sayfaya git', link: '/' },
  { label: 'Hakkımda', ariaLabel: 'Hakkımda sayfası', link: '/hakkimda' },
  { label: 'Blog', ariaLabel: 'Blog yazıları', link: '/blog' },
  { label: 'Videolar', ariaLabel: 'Video arşivi', link: '/videolar' },
  { label: 'Setup', ariaLabel: 'Çalışma setup\'ı', link: '/setup' },
  { label: 'İletişim', ariaLabel: 'İletişime geç', link: '/iletisim' }
]

const SOCIAL_ITEMS = [
  { label: 'YouTube', link: 'https://youtube.com/@kadirdemir' },
  { label: 'Instagram', link: 'https://instagram.com/kadirardademirrr' },
  { label: 'TikTok', link: 'https://tiktok.com/@kadirdemirs' },
  { label: 'X', link: 'https://x.com/kadirdemir' }
]

const COLOR_BENDS_PALETTE = ['#ff5c7a', '#8a5cff', '#00ffd1']

// Core pages — direct import for instant first render
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import Videolar from './pages/Videolar'
import Setup from './pages/Setup'
import NotFound from './pages/NotFound'

const KVKK = lazy(() => import('./pages/KVKK'))
const Gizlilik = lazy(() => import('./pages/Gizlilik'))
const CerezPolitikasi = lazy(() => import('./pages/CerezPolitikasi'))
const Partners = lazy(() => import('./pages/Partners'))
const Sponsor = lazy(() => import('./pages/Sponsor'))
const AMA = lazy(() => import('./pages/AMA'))
const MediaKit = lazy(() => import('./pages/MediaKit'))
const Admin = lazy(() => import('./pages/Admin'))

function PageLoader() {
  return <div style={{ minHeight: '60vh' }} />
}

function LazyRoute({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

function ProtectedAdminRoute() {
  const [session, setSession] = useState({ checked: false, authenticated: false, user: null })

  useEffect(() => {
    let cancelled = false
    getSessionApi()
      .then((data) => {
        if (!cancelled) {
          setSession({ checked: true, authenticated: Boolean(data?.authenticated), user: data?.user || null })
        }
      })
      .catch(() => {
        if (!cancelled) setSession({ checked: true, authenticated: false, user: null })
      })
    return () => { cancelled = true }
  }, [])

  if (!session.checked) return <PageLoader />
  return (
    <LazyRoute>
      <Admin initialAuth={session.authenticated} initialUser={session.user} />
    </LazyRoute>
  )
}

function App() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'
  const prevPath = useRef(null)

  useEffect(() => {
    if (isAdmin) return
    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname
    trackPageviewApi(location.pathname, document.referrer)

    const gaId = import.meta.env.VITE_GA_ID
    if (gaId && typeof window.gtag === 'function') {
      window.gtag('config', gaId, {
        page_path: location.pathname,
        page_title: document.title,
      })
    }
  }, [location.pathname, isAdmin])

  useEffect(() => {
    if (isAdmin) return
    let sid
    try {
      sid = sessionStorage.getItem('kade_visitor_sid')
      if (!sid) {
        sid = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
        sessionStorage.setItem('kade_visitor_sid', sid)
      }
    } catch { sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }

    const ping = () => { if (document.visibilityState !== 'hidden') heartbeatApi(sid, location.pathname) }
    ping()
    const interval = setInterval(ping, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [location.pathname, isAdmin])

  return (
    <>
      <ErrorTracker />
      <a href="#main-content" className="skip-to-content">İçeriğe geç</a>
      <ScrollToTop />
      {!isAdmin && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -2,
            pointerEvents: 'none',
            opacity: 0.55,
          }}
        >
          <ColorBends
            colors={COLOR_BENDS_PALETTE}
            rotation={90}
            speed={0.15}
            scale={1.4}
            frequency={1}
            warpStrength={1}
            mouseInfluence={0}
            parallax={0}
            noise={0.08}
            iterations={1}
            intensity={1.1}
            bandWidth={6}
            transparent
          />
        </div>
      )}
      {!isAdmin && <LiveBanner />}
      {!isAdmin && <AuroraBackground />}
      {!isAdmin && <Navbar />}
      {!isAdmin && (
        <StaggeredMenu
          position="right"
          isFixed
          items={MENU_ITEMS}
          socialItems={SOCIAL_ITEMS}
          displaySocials
          displayItemNumbering
          menuButtonColor="#fff"
          openMenuButtonColor="#111"
          changeMenuColorOnOpen
          colors={['#B497CF', '#5227FF']}
          logoUrl="/logo.png"
          accentColor="#ff5c7a"
        />
      )}
      <main id="main-content">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/hakkimda" element={<PageTransition><About /></PageTransition>} />
            <Route path="/hakkimizda" element={<Navigate to="/hakkimda" replace />} />
            <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
            <Route path="/blog/:slug" element={<PageTransition><BlogDetail /></PageTransition>} />
            <Route path="/videolar" element={<PageTransition><Videolar /></PageTransition>} />
            <Route path="/setup" element={<PageTransition><Setup /></PageTransition>} />
            <Route path="/iletisim" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/kvkk" element={<LazyRoute><PageTransition><KVKK /></PageTransition></LazyRoute>} />
            <Route path="/gizlilik" element={<LazyRoute><PageTransition><Gizlilik /></PageTransition></LazyRoute>} />
            <Route path="/cerez-politikasi" element={<LazyRoute><PageTransition><CerezPolitikasi /></PageTransition></LazyRoute>} />
            <Route path="/partnerler" element={<LazyRoute><PageTransition><Partners /></PageTransition></LazyRoute>} />
            <Route path="/sponsor" element={<LazyRoute><PageTransition><Sponsor /></PageTransition></LazyRoute>} />
            <Route path="/medya-kit" element={<LazyRoute><PageTransition><MediaKit /></PageTransition></LazyRoute>} />
            <Route path="/sor" element={<LazyRoute><PageTransition><AMA /></PageTransition></LazyRoute>} />
            <Route path="/admin" element={<ProtectedAdminRoute />} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <InstallPrompt />}
      {!isAdmin && <CommandPalette />}
      {!isAdmin && (
        <>
          <GradualBlur
            target="page"
            position="top"
            height="3.5rem"
            strength={1.2}
            divCount={5}
            curve="bezier"
            opacity={0.9}
            zIndex={90}
          />
          <GradualBlur
            target="page"
            position="bottom"
            height="3.5rem"
            strength={1.2}
            divCount={5}
            curve="bezier"
            opacity={0.9}
            zIndex={90}
          />
        </>
      )}
    </>
  )
}

export default App
