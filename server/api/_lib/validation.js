import { z } from 'zod';

const stringValue = z.string().max(1000);
const querySchema = z.record(
  z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
  z.union([stringValue, z.array(stringValue).max(20)])
);

const allowedActions = new Set([
  'active-visitors', 'activity', 'ai-usage', 'admin', 'all', 'analytics',
  'ask', 'change-password', 'check', 'confirm',
  'csrf', 'file', 'ga4', 'heartbeat', 'live', 'login', 'logout',
  'newsletter', 'notes', 'pageview', 'post-views', 'refresh', 'reply',
  'send', 'send-invite', 'send-newsletter', 'sitemap', 'smtp-test', 'submit', 'subscribers',
  'session', 'unsubscribe', 'vapid-public-key', 'vote',
  'answer', 'delete', 'pending',
]);

const allowedResources = new Set([
  // Ajans (kademedia.com.tr) kaynakları kaldırıldı: quotes, invoices,
  // customer-profiles, email-templates, onboarding, proposals, subscriptions, surveys, tasks.
  'backup', 'client-errors', 'push', 'purge-legacy', 'audit-log',
]);

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function validateQuery(req, res) {
  const query = req.query || {};
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query parameter' });
    return false;
  }

  const totalLength = Object.entries(query).reduce((sum, [key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return sum + key.length + values.reduce((inner, item) => inner + String(item || '').length, 0);
  }, 0);
  if (totalLength > 8000 || Object.keys(query).length > 30) {
    res.status(400).json({ error: 'Query parameters are too long' });
    return false;
  }

  const id = first(query.id);
  if (id && !/^[a-fA-F0-9]{24}$/.test(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return false;
  }

  const action = first(query.action);
  if (action && !allowedActions.has(action)) {
    res.status(400).json({ error: 'Invalid action parameter' });
    return false;
  }

  const resource = first(query.resource);
  if (resource && !allowedResources.has(resource)) {
    res.status(400).json({ error: 'Invalid resource parameter' });
    return false;
  }

  const period = first(query.period);
  if (period && !['today', 'day', 'week', 'month', 'quarter', '30d', '90d'].includes(period)) {
    res.status(400).json({ error: 'Invalid period parameter' });
    return false;
  }

  return true;
}
