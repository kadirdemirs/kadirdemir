import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import PageTransition from './components/PageTransition'
import { trackPageviewApi, heartbeatApi, getSessionApi } from './api'
import { useLenis } from './hooks/useLenis'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ErrorTracker from './components/ErrorTracker'
import ClickSpark from './components/reactbits/ClickSpark'
import TopProgressBar from './components/TopProgressBar'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'
import LiveBanner from './components/LiveBanner'
import CommandPalette from './components/CommandPalette'
import CookieBanner from './components/CookieBanner'
import FloatingCTA from './components/FloatingCTA'

// Core pages — direct import for instant first render
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import Videolar from './pages/Videolar'
import Links from './pages/Links'
import NotFound from './pages/NotFound'
import Ara from './pages/Ara'

const KVKK = lazy(() => import('./pages/KVKK'))
const Gizlilik = lazy(() => import('./pages/Gizlilik'))
const CerezPolitikasi = lazy(() => import('./pages/CerezPolitikasi'))
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
  const isLinks = location.pathname === '/links'
  const isLanding = location.pathname === '/'
  const isStandalone = isAdmin || isLinks
  // The landing page ships its own nav, footer and styling — render it bare.
  const hideChrome = isStandalone || isLanding
  const prevPath = useRef(null)

  // Site-wide smooth scroll (admin, landing & reduced-motion hariç)
  useLenis({ enabled: !isStandalone && !isLanding })

  useEffect(() => {
    if (isStandalone) return
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
  }, [location.pathname, isStandalone])

  useEffect(() => {
    if (isStandalone) return
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
  }, [location.pathname, isStandalone])

  return (
    <>
      {!hideChrome && <TopProgressBar />}
      {!hideChrome && <ClickSpark sparkColor="var(--amber, #d4943f)" sparkCount={7} sparkRadius={22} duration={500} />}
      <ErrorTracker />
      <a href="#main-content" className="skip-to-content">İçeriğe geç</a>
      <ScrollToTop />
      {!hideChrome && <div aria-hidden="true" className="kd-aurora-bg" />}
      {!hideChrome && <LiveBanner />}
      {!hideChrome && <Navbar />}
      <main id="main-content">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/hakkimda" element={<PageTransition><About /></PageTransition>} />
            <Route path="/hakkimizda" element={<Navigate to="/hakkimda" replace />} />
            <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
            <Route path="/blog/:slug" element={<PageTransition><BlogDetail /></PageTransition>} />
            <Route path="/videolar" element={<PageTransition><Videolar /></PageTransition>} />
            <Route path="/links" element={<PageTransition><Links /></PageTransition>} />
            <Route path="/iletisim" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/ara" element={<PageTransition><Ara /></PageTransition>} />
            <Route path="/setup" element={<Navigate to="/" replace />} />
            <Route path="/partnerler" element={<Navigate to="/" replace />} />
            <Route path="/kvkk" element={<LazyRoute><PageTransition><KVKK /></PageTransition></LazyRoute>} />
            <Route path="/gizlilik" element={<LazyRoute><PageTransition><Gizlilik /></PageTransition></LazyRoute>} />
            <Route path="/cerez-politikasi" element={<LazyRoute><PageTransition><CerezPolitikasi /></PageTransition></LazyRoute>} />
            <Route path="/sponsor" element={<LazyRoute><PageTransition><Sponsor /></PageTransition></LazyRoute>} />
            <Route path="/medya-kit" element={<LazyRoute><PageTransition><MediaKit /></PageTransition></LazyRoute>} />
            <Route path="/sor" element={<LazyRoute><PageTransition><AMA /></PageTransition></LazyRoute>} />
            <Route path="/admin" element={<ProtectedAdminRoute />} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideChrome && <Footer />}
      {!hideChrome && <InstallPrompt />}
      {!hideChrome && <CommandPalette />}
      {!hideChrome && <FloatingCTA />}
      {!hideChrome && <CookieBanner />}
    </>
  )
}

export default App
