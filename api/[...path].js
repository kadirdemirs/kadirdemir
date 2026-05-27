import ama from '../server/api/ama.js'
import auth from '../server/api/auth.js'
import blog from '../server/api/blog.js'
import calendarInvite from '../server/api/calendar-invite.js'
import comments from '../server/api/comments.js'
import contact from '../server/api/contact.js'
import content from '../server/api/content.js'
import media from '../server/api/media.js'
import messages from '../server/api/messages.js'
import notifications from '../server/api/notifications.js'
import og from '../server/api/og.js'
import ops from '../server/api/ops.js'
import partners from '../server/api/partners.js'
import polls from '../server/api/polls.js'
import reminders from '../server/api/reminders.js'
import rss from '../server/api/rss.js'
import seed from '../server/api/seed.js'
import sitemap from '../server/api/sitemap.js'
import socialStats from '../server/api/social-stats.js'
import sponsor from '../server/api/sponsor.js'
import users from '../server/api/users.js'
import youtube from '../server/api/youtube.js'
import { validateCsrf } from '../server/api/_lib/csrf.js'
import { validateQuery } from '../server/api/_lib/validation.js'

const handlers = {
  ama,
  auth,
  blog,
  'calendar-invite': calendarInvite,
  comments,
  contact,
  content,
  media,
  messages,
  notifications,
  og,
  ops,
  partners,
  polls,
  reminders,
  rss,
  seed,
  sitemap,
  'social-stats': socialStats,
  sponsor,
  users,
  youtube,
}

function getRouteKey(req) {
  const queryPath = req.routePath ?? req.query?.path
  if (Array.isArray(queryPath)) return queryPath.join('/')
  if (typeof queryPath === 'string' && queryPath.length > 0) return queryPath

  const rawUrl = req.originalUrl || req.url || ''
  const pathOnly = rawUrl.split('?')[0]
  return pathOnly.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '')
}

function setQuery(req, query) {
  Object.defineProperty(req, 'query', {
    value: query,
    writable: true,
    configurable: true,
    enumerable: true,
  })
}

function normalizeRoute(req) {
  const routeKey = getRouteKey(req)

  if (routeKey === 'auth/login') return 'auth'
  if (routeKey === 'auth/change-password') {
    setQuery(req, { ...(req.query || {}), action: 'change-password' })
    return 'auth'
  }

  if (routeKey === 'newsletter') {
    setQuery(req, { ...(req.query || {}), action: 'newsletter' })
    return 'contact'
  }

  return routeKey.split('/')[0]
}

// Public POST endpoints that don't require CSRF (no authenticated session)
const PUBLIC_ACTIONS = new Set([
  'newsletter', 'apply', 'submit', 'confirm', 'unsubscribe',
])

function isPublicPost(req) {
  if (String(req.method || '').toUpperCase() !== 'POST') return false
  const route = normalizeRoute(req)
  const action = req.query?.action
  if (route === 'auth' && (!action || action === 'login')) return true
  if (route === 'contact' && (!action || PUBLIC_ACTIONS.has(action))) return true
  if (route === 'sponsor') return true
  if (route === 'polls' && action === 'vote') return true
  if (route === 'ama' && action === 'ask') return true
  if (route === 'comments') return true
  return false
}

const ALLOWED_KEY_RE = /^[a-zA-Z0-9_-]{1,40}$/;

export default async function handler(req, res) {
  const rawQuery = req.query || {};
  req.routePath = rawQuery.path;
  const sanitizedQuery = {};
  for (const [key, value] of Object.entries(rawQuery)) {
    if (key !== 'path' && ALLOWED_KEY_RE.test(key)) {
      sanitizedQuery[key] = value;
    }
  }
  setQuery(req, sanitizedQuery);

  if (!validateQuery(req, res)) return
  if (!isPublicPost(req) && !validateCsrf(req, res)) return

  const route = normalizeRoute(req)
  const routeHandler = handlers[route]

  if (!routeHandler) {
    return res.status(404).json({ error: 'API endpoint not found' })
  }

  return routeHandler(req, res)
}
