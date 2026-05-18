import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineHome, HiOutlineArrowRight, HiOutlineSearch } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import CatcherGame from '../components/CatcherGame'
import './NotFound.css'

const popularPages = [
  { path: '/', tr: 'Ana Sayfa', en: 'Home', emoji: '🏠' },
  { path: '/videolar', tr: 'Videolar', en: 'Videos', emoji: '🎬' },
  { path: '/blog', tr: 'Blog', en: 'Blog', emoji: '📝' },
  { path: '/hakkimda', tr: 'Hakkımda', en: 'About', emoji: '👋' },
  { path: '/setup', tr: 'Setup', en: 'Setup', emoji: '🖥️' },
  { path: '/iletisim', tr: 'İletişim', en: 'Contact', emoji: '✉️' },
  { path: '/sponsor', tr: 'Sponsorluk', en: 'Sponsor', emoji: '🤝' },
  { path: '/sor', tr: 'Sor Bana', en: 'Ask Me', emoji: '❓' },
]

function routeFromQuery(query) {
  const q = query.toLowerCase()
  if (/(blog|yazı|yazi|article|post)/.test(q)) return '/blog'
  if (/(video|izle|watch|youtube)/.test(q)) return '/videolar'
  if (/(setup|donanım|donanim|equipment|kurulum)/.test(q)) return '/setup'
  if (/(hakk|about|kim)/.test(q)) return '/hakkimda'
  if (/(iletiş|iletis|contact|mail)/.test(q)) return '/iletisim'
  if (/(sponsor|işbirliği|isbirligi|brand)/.test(q)) return '/sponsor'
  if (/(sor|ama|ask|soru)/.test(q)) return '/sor'
  if (/(partner|sponsor)/.test(q)) return '/partnerler'
  return null
}

export default function NotFound() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useSEO({
    title: lang === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found',
    description: lang === 'tr'
      ? 'Aradığın sayfa bulunamadı. Popüler sayfalardan veya arama kutusundan devam et.'
      : 'The page you were looking for could not be found. Try the popular pages or the search box.',
    path: '/404',
    noindex: true,
  })

  const onSearch = (e) => {
    e.preventDefault()
    const target = query.trim()
    if (!target) return
    const route = routeFromQuery(target)
    if (route) {
      navigate(route)
    } else {
      navigate(`/blog?q=${encodeURIComponent(target)}`)
    }
  }

  return (
    <PageTransition>
      <section className="notfound-section">
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container notfound-container">
          <motion.div
            className="notfound-code"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            4<span>0</span>4
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {lang === 'tr' ? 'Sayfa bulunamadı' : 'Page not found'}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {lang === 'tr'
              ? 'Aradığın sayfa burada değil — taşınmış, silinmiş ya da yanlış bir bağlantıdan gelmiş olabilirsin. Aşağıdan başka bir sayfaya geçebilirsin.'
              : 'The page you were looking for is not here — it may have moved, been removed, or the link might be wrong. Try one of the options below.'}
          </motion.p>

          <motion.form
            className="notfound-arama"
            onSubmit={onSearch}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            role="search"
          >
            <label htmlFor="notfound-search" className="visually-hidden">
              {lang === 'tr' ? 'Sitede ara' : 'Search the site'}
            </label>
            <input
              id="notfound-search"
              type="search"
              placeholder={lang === 'tr' ? 'Ne arıyordun? (blog, video, setup…)' : 'What were you looking for?'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="notfound-arama-input"
              autoComplete="off"
            />
            <button type="submit" className="notfound-arama-btn" aria-label={lang === 'tr' ? 'Ara' : 'Search'}>
              <HiOutlineSearch size={18} />
            </button>
          </motion.form>

          <motion.div
            className="notfound-actions"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/" className="btn btn-primary">
              <HiOutlineHome size={18} />
              {lang === 'tr' ? 'Ana Sayfa' : 'Home'}
            </Link>
            <Link to="/iletisim" className="btn btn-outline">
              {lang === 'tr' ? 'İletişime geç' : 'Get in touch'}
              <HiOutlineArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            className="notfound-populer"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="notfound-populer-baslik">
              {lang === 'tr' ? 'Popüler sayfalar' : 'Popular pages'}
            </p>
            <div className="notfound-populer-grid">
              {popularPages.map((page) => (
                <Link key={page.path} to={page.path} className="notfound-populer-link">
                  <span aria-hidden="true">{page.emoji}</span>{' '}
                  {lang === 'tr' ? page.tr : page.en}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ marginTop: 48 }}
          >
            <p className="notfound-populer-baslik" style={{ textAlign: 'center' }}>
              {lang === 'tr' ? 'Canın sıkıldıysa mini oyun 🎮' : 'A little mini game while you’re here 🎮'}
            </p>
            <CatcherGame />
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}
