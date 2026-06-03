import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineHome, HiOutlineArrowRight, HiOutlineSearch } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import CatcherGame from '../components/CatcherGame'
import './NotFound.css'

function buildPopularPages(t) {
  return [
    { path: '/', name: t('nav.home'), emoji: '🏠' },
    { path: '/videolar', name: t('nav.videos'), emoji: '🎬' },
    { path: '/blog', name: t('nav.blog'), emoji: '📝' },
    { path: '/hakkimda', name: t('nav.about'), emoji: '👋' },
    { path: '/iletisim', name: t('nav.contact'), emoji: '✉️' },
    { path: '/sponsor', name: t('sponsor.pill'), emoji: '🤝' },
    { path: '/sor', name: t('ama.pill'), emoji: '❓' },
  ]
}

function routeFromQuery(query) {
  const q = query.toLowerCase()
  if (/(blog|yazı|yazi|article|post)/.test(q)) return '/blog'
  if (/(video|izle|watch|youtube)/.test(q)) return '/videolar'
  if (/(hakk|about|kim)/.test(q)) return '/hakkimda'
  if (/(iletiş|iletis|contact|mail)/.test(q)) return '/iletisim'
  if (/(sponsor|işbirliği|isbirligi|brand)/.test(q)) return '/sponsor'
  if (/(sor|ama|ask|soru)/.test(q)) return '/sor'
  if (/(partner|sponsor)/.test(q)) return '/sponsor'
  return null
}

export default function NotFound() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const popularPages = buildPopularPages(t)

  useSEO({
    title: t('notFound.title'),
    description: t('notFound.sub'),
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
            {t('notFound.title')}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {t('notFound.sub')}
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
              {t('nav.search')}
            </label>
            <input
              id="notfound-search"
              type="search"
              placeholder={t('nav.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="notfound-arama-input"
              autoComplete="off"
            />
            <button type="submit" className="notfound-arama-btn" aria-label={t('nav.search')}>
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
              {t('notFound.goHome')}
            </Link>
            <Link to="/iletisim" className="btn btn-outline">
              {t('common.contact')}
              <HiOutlineArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            className="notfound-populer"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="notfound-populer-baslik">{t('notFound.popularTitle')}</p>
            <div className="notfound-populer-grid">
              {popularPages.map((page) => (
                <Link key={page.path} to={page.path} className="notfound-populer-link">
                  <span aria-hidden="true">{page.emoji}</span>{' '}
                  {page.name}
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
              {t('notFound.gameTitle')} 🎮 — <span style={{ opacity: 0.7 }}>{t('notFound.gameSub')}</span>
            </p>
            <CatcherGame />
          </motion.div>
        </div>
      </section>
  )
}
