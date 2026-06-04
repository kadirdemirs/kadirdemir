const API_BASE = '/api';

const CSRF_COOKIE = 'kade_csrf';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getCookie(name) {
  const value = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function clearCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Strict`;
}

let csrfPromise = null;

async function ensureCsrfToken({ force = false } = {}) {
  const existing = getCookie(CSRF_COOKIE);
  if (existing && !force) return existing;
  if (force) clearCookie(CSRF_COOKIE);

  csrfPromise ||= globalThis.fetch(`${API_BASE}/auth?action=csrf`, {
    method: 'GET',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return data.csrfToken || getCookie(CSRF_COOKIE) || null;
    })
    .catch(() => null)
    .finally(() => { csrfPromise = null; });

  return csrfPromise;
}

async function fetch(input, init = {}) {
  const method = String(init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});

  if (UNSAFE_METHODS.has(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  return globalThis.fetch(input, {
    ...init,
    credentials: init.credentials || 'include',
    headers,
  });
}

export { fetch as apiFetch };

function getAuthHeaders() {
  return { 'Content-Type': 'application/json' };
}

async function handleResponse(res, { reloadOnUnauthorized = true } = {}) {
  let data;
  const contentType = res.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try { data = JSON.parse(text); } catch { throw new Error('API unavailable'); }
    }
  } catch (e) {
    throw new Error(e.message || 'API unavailable');
  }
  if (res.status === 401) {
    try { sessionStorage.removeItem('kade_admin_user'); } catch { /* ignore */ }
    if (reloadOnUnauthorized) window.location.reload();
    throw new Error(data?.error || 'Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }
  if (!res.ok) {
    const message = data?.error || 'Bir hata oluştu';
    if (String(message).includes('ALLOWED_ORIGINS')) {
      throw new Error('Sunucu ayarı güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.');
    }
    throw new Error(message);
  }
  return data;
}

// ───── Auth ─────
export async function loginApi(username, password) {
  await ensureCsrfToken({ force: true });

  let res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (res.status === 403) {
    const data = await res.clone().json().catch(() => ({}));
    if (String(data?.error || '').toLowerCase().includes('csrf')) {
      await ensureCsrfToken({ force: true });
      res = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    }
  }

  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function getSessionApi() {
  const res = await fetch(`${API_BASE}/auth?action=session`);
  if (res.status === 401) return { authenticated: false };
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function logoutApi() {
  const res = await fetch(`${API_BASE}/auth?action=logout`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res, { reloadOnUnauthorized: false });
}

export async function changePasswordApi(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/auth?action=change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse(res);
}

// ───── Blog ─────
export async function getBlogsApi() {
  const res = await fetch(`${API_BASE}/blog`);
  return handleResponse(res);
}

export async function createBlogApi(data) {
  const res = await fetch(`${API_BASE}/blog`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateBlogApi(data) {
  const res = await fetch(`${API_BASE}/blog`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteBlogApi(id) {
  const res = await fetch(`${API_BASE}/blog?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── Content (site settings) ─────
export async function getContentApi(section) {
  const url = section ? `${API_BASE}/content?section=${section}` : `${API_BASE}/content`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function updateContentApi(section, data) {
  const res = await fetch(`${API_BASE}/content`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ section, data }),
  });
  return handleResponse(res);
}

// ─── KADELINK sections (hero / links / theme) ───
export const getKadelinkHeroApi = () => getContentApi('kadelink-hero');
export const updateKadelinkHeroApi = (data) => updateContentApi('kadelink-hero', data);
export const getKadelinkLinksApi = () => getContentApi('kadelink-links');
export const updateKadelinkLinksApi = (data) => updateContentApi('kadelink-links', data);
export const getKadelinkThemeApi = () => getContentApi('kadelink-theme');
export const updateKadelinkThemeApi = (data) => updateContentApi('kadelink-theme', data);

// ─── Audit log ───
export async function getAuditLogApi(limit = 200) {
  const res = await fetch(`${API_BASE}/ops?resource=audit-log&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function clearAuditLogApi() {
  const res = await fetch(`${API_BASE}/ops?resource=audit-log`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── Messages (iletişim formu) ─────
export async function getMessagesApi() {
  const res = await fetch(`${API_BASE}/messages`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function markMessageReadApi(id) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function updateMessageStatusApi(id, status) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, status }),
  });
  return handleResponse(res);
}

export async function deleteMessageApi(id) {
  const res = await fetch(`${API_BASE}/messages?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function replyToMessageApi(id, replyText, subject) {
  const res = await fetch(`${API_BASE}/messages?action=reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, replyText, subject }),
  });
  return handleResponse(res);
}

// ───── Contact (public) ─────
export async function sendContactApi(data) {
  const res = await globalThis.fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ───── Users (admin) ─────
export async function getUsersApi() {
  const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createUserApi(data) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateUserApi(data) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteUserApi(id) {
  const res = await fetch(`${API_BASE}/users?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── Calendar Invite (admin → ziyaretçi) ─────
export async function sendCalendarInviteApi(data) {
  const res = await fetch(`${API_BASE}/calendar-invite`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ───── Seed (dev) ─────
export async function seedApi(secret) {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret }),
  });
  return handleResponse(res);
}

// ───── Newsletter (public + admin) ─────
export async function subscribeNewsletterApi(email) {
  const res = await globalThis.fetch(`${API_BASE}/contact?action=newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function confirmNewsletterApi(token) {
  const res = await globalThis.fetch(`${API_BASE}/contact?action=confirm&token=${encodeURIComponent(token)}`);
  return handleResponse(res);
}

export async function unsubscribeNewsletterApi(token) {
  const res = await globalThis.fetch(`${API_BASE}/contact?action=unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return handleResponse(res);
}

export async function getNewsletterSubscribersApi() {
  const res = await fetch(`${API_BASE}/contact?action=subscribers`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function deleteNewsletterSubscriberApi(id) {
  const res = await fetch(`${API_BASE}/contact?action=subscribers&id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function sendNewsletterApi(subject, html) {
  const res = await fetch(`${API_BASE}/contact?action=send-newsletter`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, html }),
  });
  return handleResponse(res);
}

// ───── Notes (mesaj başına notlar) ─────
export async function getNotesApi(messageId) {
  const res = await fetch(`${API_BASE}/messages?action=notes&messageId=${messageId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function createNoteApi(data) {
  const res = await fetch(`${API_BASE}/messages?action=notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteNoteApi(id) {
  const res = await fetch(`${API_BASE}/messages?action=notes&id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── Notifications ─────
export async function getNotificationsApi() {
  const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function markAllNotificationsReadApi() {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ markAllRead: true }),
  });
  return handleResponse(res);
}

// ───── Analytics ─────
export async function getGA4AnalyticsApi(period = 'week') {
  const res = await fetch(`${API_BASE}/content?action=ga4&period=${period}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function trackPageviewApi(path, referrer) {
  try {
    await fetch(`${API_BASE}/content?action=pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, referrer }),
    });
  } catch { /* non-critical */ }
}

export async function heartbeatApi(sessionId, path) {
  try {
    await fetch(`${API_BASE}/content?action=heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, path }),
      keepalive: true,
    });
  } catch { /* non-critical */ }
}

export async function getPostViewsApi(slug) {
  try {
    const res = await globalThis.fetch(`${API_BASE}/content?action=post-views&slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.views === 'number' ? data.views : null;
  } catch { return null; }
}

export async function getActiveVisitorsApi() {
  try {
    const res = await fetch(`${API_BASE}/content?action=active-visitors`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.activeUsers === 'number' ? data.activeUsers : null;
  } catch { return null; }
}

export async function getAnalyticsApi(period = 'week') {
  const res = await fetch(`${API_BASE}/content?action=analytics&period=${period}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getActivityLogApi(type) {
  const url = type && type !== 'all'
    ? `${API_BASE}/notifications?action=activity&type=${type}`
    : `${API_BASE}/notifications?action=activity`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ───── SMTP test ─────
export async function testSmtpApi() {
  const res = await fetch(`${API_BASE}/contact?action=smtp-test`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── YouTube ─────
// Module-level cache: backend already caches in MongoDB for 10 min,
// but the frontend pulls it on every page mount. Short client cache + in-flight de-dup.
const YT_VIDEOS_TTL = 5 * 60 * 1000;
const YT_LIVE_TTL = 90 * 1000;
let ytVideosCache = { ts: 0, data: null, inflight: null };
let ytLiveCache = { ts: 0, data: null, inflight: null };

export async function getYouTubeVideosApi({ force = false } = {}) {
  const now = Date.now();
  if (!force && ytVideosCache.data && now - ytVideosCache.ts < YT_VIDEOS_TTL) {
    return ytVideosCache.data;
  }
  if (ytVideosCache.inflight) return ytVideosCache.inflight;
  ytVideosCache.inflight = (async () => {
    try {
      const res = await globalThis.fetch(`${API_BASE}/youtube`, { credentials: 'include' });
      const data = await handleResponse(res);
      ytVideosCache = { ts: Date.now(), data, inflight: null };
      return data;
    } catch (err) {
      ytVideosCache.inflight = null;
      throw err;
    }
  })();
  return ytVideosCache.inflight;
}

export async function getYouTubeLiveApi({ force = false } = {}) {
  const now = Date.now();
  if (!force && ytLiveCache.data && now - ytLiveCache.ts < YT_LIVE_TTL) {
    return ytLiveCache.data;
  }
  if (ytLiveCache.inflight) return ytLiveCache.inflight;
  ytLiveCache.inflight = (async () => {
    try {
      const res = await globalThis.fetch(`${API_BASE}/youtube?action=live`, { credentials: 'include' });
      const data = await handleResponse(res);
      ytLiveCache = { ts: Date.now(), data, inflight: null };
      return data;
    } catch (err) {
      ytLiveCache.inflight = null;
      throw err;
    }
  })();
  return ytLiveCache.inflight;
}

// ───── Partners ─────
export async function getPartnersApi() {
  const res = await globalThis.fetch(`${API_BASE}/partners`);
  return handleResponse(res);
}

// ───── Blog Comments ─────
export async function getCommentsApi(slug) {
  const res = await globalThis.fetch(`${API_BASE}/comments?slug=${encodeURIComponent(slug)}`);
  return handleResponse(res);
}

export async function postCommentApi({ postSlug, author, body, parentId }) {
  const res = await globalThis.fetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postSlug, author, body, parentId }),
  });
  return handleResponse(res);
}

export async function getAdminCommentsApi(filter = 'all') {
  const res = await fetch(`${API_BASE}/comments?action=admin&filter=${encodeURIComponent(filter)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function setCommentApprovalApi(id, approved) {
  const res = await fetch(`${API_BASE}/comments?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ approved }),
  });
  return handleResponse(res);
}

export async function deleteCommentApi(id) {
  const res = await fetch(`${API_BASE}/comments?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── AMA ─────
export async function getAMAApi() {
  const res = await globalThis.fetch(`${API_BASE}/ama`);
  return handleResponse(res);
}

export async function getAMAPendingApi() {
  const res = await globalThis.fetch(`${API_BASE}/ama?action=pending`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function answerAMAApi(id, answer) {
  const res = await globalThis.fetch(`${API_BASE}/ama?action=answer`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, answer }),
  });
  return handleResponse(res);
}

export async function deleteAMAApi(id) {
  const res = await globalThis.fetch(`${API_BASE}/ama?action=delete`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return handleResponse(res);
}

export async function askAMAApi(question, author) {
  const res = await globalThis.fetch(`${API_BASE}/ama?action=ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, author: author || '' }),
  });
  return handleResponse(res);
}

export async function upvoteAMAApi(id) {
  const res = await globalThis.fetch(`${API_BASE}/ama?action=upvote&id=${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res);
}

// ───── Polls ─────
export async function getActivePollApi() {
  const res = await globalThis.fetch(`${API_BASE}/polls?action=active`, { credentials: 'include' });
  return handleResponse(res);
}

export async function votePollApi(pollId, optionIndex) {
  const res = await globalThis.fetch(`${API_BASE}/polls?action=vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pollId, optionIndex }),
  });
  return handleResponse(res);
}

// ───── Sponsor ─────
export async function submitSponsorApi(data) {
  const res = await globalThis.fetch(`${API_BASE}/sponsor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function refreshYouTubeVideosApi() {
  const res = await fetch(`${API_BASE}/youtube?action=refresh`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── Site Settings ─────
export async function getSiteSettingsApi() {
  const res = await fetch(`${API_BASE}/content?section=site-settings`);
  return handleResponse(res);
}

export async function updateSiteSettingsApi(data) {
  const res = await fetch(`${API_BASE}/content`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ section: 'site-settings', data }),
  });
  return handleResponse(res);
}

// ───── Reminders ─────
export async function getRemindersApi(status) {
  const url = status && status !== 'all'
    ? `${API_BASE}/reminders?status=${status}`
    : `${API_BASE}/reminders`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createReminderApi(data) {
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateReminderApi(data) {
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteReminderApi(id) {
  const res = await fetch(`${API_BASE}/reminders?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function checkRemindersApi() {
  const res = await fetch(`${API_BASE}/reminders?action=check`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── Media ─────
export async function getMediaApi(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${API_BASE}/media?${qs}` : `${API_BASE}/media`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getMediaFileApi(id) {
  const res = await fetch(`${API_BASE}/media?id=${encodeURIComponent(id)}&action=file`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function uploadMediaApi(data) {
  const res = await fetch(`${API_BASE}/media`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function bulkDeleteMediaApi(ids) {
  const res = await fetch(`${API_BASE}/media?ids=${ids.join(',')}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── Social Stats (YouTube/Instagram/TikTok aggregated) ─────
const SOCIAL_STATS_TTL = 5 * 60 * 1000;
let socialStatsCache = { ts: 0, data: null, inflight: null };

export async function getSocialStatsApi({ force = false } = {}) {
  const now = Date.now();
  if (!force && socialStatsCache.data && now - socialStatsCache.ts < SOCIAL_STATS_TTL) {
    return socialStatsCache.data;
  }
  if (socialStatsCache.inflight) return socialStatsCache.inflight;
  socialStatsCache.inflight = (async () => {
    try {
      const res = await globalThis.fetch(`${API_BASE}/social-stats`, { credentials: 'include' });
      const data = await handleResponse(res, { reloadOnUnauthorized: false });
      socialStatsCache = { ts: Date.now(), data, inflight: null };
      return data;
    } catch (err) {
      socialStatsCache.inflight = null;
      throw err;
    }
  })();
  return socialStatsCache.inflight;
}

export async function refreshSocialStatsApi() {
  const res = await fetch(`${API_BASE}/social-stats?action=refresh`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await handleResponse(res);
  socialStatsCache = { ts: Date.now(), data, inflight: null };
  return data;
}

// ───── Ops (client error tracking + backup) ─────
export async function trackClientErrorApi(data) {
  try {
    await fetch(`${API_BASE}/ops?resource=client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch { /* non-critical */ }
}

export async function getBackupSummaryApi() {
  const res = await fetch(`${API_BASE}/ops?resource=backup`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createBackupApi() {
  const res = await fetch(`${API_BASE}/ops?resource=backup`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

// ───── Legacy Kade Media data purge ─────
export async function purgeLegacyDryRunApi() {
  const res = await fetch(`${API_BASE}/ops?resource=purge-legacy&dryRun=1`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function purgeLegacyApplyApi() {
  const res = await fetch(`${API_BASE}/ops?resource=purge-legacy`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}
