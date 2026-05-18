import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { trackPageviewApi, heartbeatApi, getSessionApi } from './api'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ErrorTracker from './components/ErrorTracker'
import GrainOverlay from './components/GrainOverlay'
import AuroraBackground from './components/AuroraBackground'
import ParticlesField from './components/ParticlesField'
import CursorSpotlight from './components/CursorSpotlight'
import ErrorBoundary from './components/ErrorBoundary'

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
      {!isAdmin && <AuroraBackground />}
      {!isAdmin && <ParticlesField />}
      {!isAdmin && <GrainOverlay />}
      {!isAdmin && <CursorSpotlight />}
      {!isAdmin && <Navbar />}
      <main id="main-content">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/hakkimda" element={<About />} />
          <Route path="/hakkimizda" element={<Navigate to="/hakkimda" replace />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/videolar" element={<Videolar />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/kvkk" element={<LazyRoute><KVKK /></LazyRoute>} />
          <Route path="/gizlilik" element={<LazyRoute><Gizlilik /></LazyRoute>} />
          <Route path="/cerez-politikasi" element={<LazyRoute><CerezPolitikasi /></LazyRoute>} />
          <Route path="/admin" element={<ProtectedAdminRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  )
}

export default App
