import { useState, useEffect, useCallback, Component } from 'react'
import { motion } from 'framer-motion'
import {
  HiOutlineLogin, HiOutlineLogout, HiOutlineHome, HiOutlineNewspaper,
  HiOutlineUsers, HiOutlineMail, HiOutlineCog, HiOutlineTrash,
  HiOutlinePlus, HiOutlineSave, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineX, HiOutlineMenuAlt3, HiOutlineRefresh, HiOutlineChartBar,
  HiOutlineBell, HiOutlinePhotograph, HiOutlineKey, HiOutlineDatabase,
  HiOutlineChatAlt2, HiOutlineCheck, HiOutlineLink, HiOutlineUser,
  HiOutlineColorSwatch, HiOutlineClipboardList, HiOutlineArrowUp,
  HiOutlineArrowDown,
} from 'react-icons/hi'
import {
  loginApi, logoutApi, changePasswordApi,
  getBlogsApi, createBlogApi, updateBlogApi, deleteBlogApi,
  getMessagesApi, markMessageReadApi, deleteMessageApi, replyToMessageApi, updateMessageStatusApi,
  getUsersApi, createUserApi, updateUserApi, deleteUserApi,
  getNewsletterSubscribersApi, deleteNewsletterSubscriberApi, sendNewsletterApi,
  testSmtpApi,
  getSiteSettingsApi, updateSiteSettingsApi,
  refreshYouTubeVideosApi, getYouTubeVideosApi,
  getSocialStatsApi, refreshSocialStatsApi,
  getAnalyticsApi, getGA4AnalyticsApi, getActiveVisitorsApi,
  getRemindersApi, createReminderApi, updateReminderApi, deleteReminderApi,
  getMediaApi, getMediaFileApi, uploadMediaApi, bulkDeleteMediaApi,
  getBackupSummaryApi, createBackupApi,
  getAdminCommentsApi, setCommentApprovalApi, deleteCommentApi,
  purgeLegacyDryRunApi, purgeLegacyApplyApi,
} from '../api'
import {
  KadelinkHeroSection,
  KadelinkLinksSection,
  KadelinkThemeSection,
  AuditLogSection,
} from './AdminKadelink'
import './Admin.css'

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`admin-toast ${type}`}>
      {type === 'success' ? '✓' : '✕'} {message}
      <div className="toast-progress" />
    </div>
  )
}

// ───── LOGIN ─────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await loginApi(username, password)
      sessionStorage.setItem('kade_admin_user', JSON.stringify(data.user))
      onLogin(data)
    } catch (err) {
      setError(err.message || 'Geçersiz kullanıcı adı veya şifre')
    } finally { setLoading(false) }
  }

  return (
    <div className="admin-login-container dark">
      <div className="login-bg-pattern" />
      <div className="login-grid-overlay" />
      <motion.div
        className="admin-login-card"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="admin-logo">kadir<span>admin</span></div>
        <h2>Yönetici Girişi</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input id="username" type="text" value={username}
              onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <div className="password-input-wrap">
              <input id="password" type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className={error ? 'error' : ''} required />
              <button type="button" className="password-toggle"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
            </div>
            {error && <span className="error-text">{error}</span>}
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'} <HiOutlineLogin size={18} />
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ───── DASHBOARD ─────
function formatBigNumber(n) {
  if (n == null || isNaN(Number(n))) return '—'
  const num = Number(n)
  if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(num)
}

function DashboardSection({ stats, onNavigate, settings, ytChannel }) {
  const [liveVisitors, setLiveVisitors] = useState(null)

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const data = await getGA4AnalyticsApi()
        if (data?.activeUsers != null) { setLiveVisitors(data.activeUsers); return }
      } catch { /* fallback */ }
      const live = await getActiveVisitorsApi()
      setLiveVisitors(live ?? 0)
    }
    fetchVisitors()
    const i = setInterval(fetchVisitors, 10000)
    return () => clearInterval(i)
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 6) return 'İyi geceler'
    if (h < 12) return 'Günaydın'
    if (h < 18) return 'İyi günler'
    return 'İyi akşamlar'
  })()

  const youtubeSubs = ytChannel?.subscriberCount ?? null
  const youtubeViews = ytChannel?.viewCount ?? null
  const youtubeVideos = ytChannel?.videoCount ?? null

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{greeting}, <span>{settings?.businessName?.split(' ')[0] || 'Kadir'}</span></h1>
          <p>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline">⚡ Siteyi Aç</a>
          <button className="btn btn-primary" onClick={() => onNavigate('social-stats')}>
            <HiOutlineChartBar size={16} /> Sosyal İstatistikler
          </button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('blog')}>
          <div className="stat-icon" style={{ background: 'rgba(108,99,255,.1)', color: '#6C63FF' }}>📝</div>
          <div className="stat-number">{stats.blogs || 0}</div>
          <div className="stat-label">Blog Yazısı</div>
        </div>
        <div className="admin-stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('messages')}>
          <div className="stat-icon" style={{ background: 'rgba(46,204,113,.1)', color: '#2ECC71' }}>✉️</div>
          <div className="stat-number">{stats.messages || 0}</div>
          <div className="stat-label">Toplam Mesaj</div>
        </div>
        <div className="admin-stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('messages')}>
          <div className="stat-icon" style={{ background: 'rgba(233,30,99,.1)', color: '#E91E63' }}>📩</div>
          <div className="stat-number">{stats.unreadMessages || 0}</div>
          <div className="stat-label">Okunmamış</div>
        </div>
        <div className="admin-stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('newsletter')}>
          <div className="stat-icon" style={{ background: 'rgba(0,188,212,.1)', color: '#00BCD4' }}>📧</div>
          <div className="stat-number">{stats.subscribers || 0}</div>
          <div className="stat-label">Newsletter Abone</div>
        </div>
      </div>

      {/* ── Social Snapshot ── */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Sosyal Medya Anlık</h3>
        <div className="admin-stats-grid">
          <div className="admin-stat-card" style={{
            background: 'linear-gradient(135deg, rgba(255,0,0,0.08), rgba(255,0,0,0.02))',
            border: '1px solid rgba(255,0,0,0.18)',
            cursor: 'pointer',
          }} onClick={() => onNavigate('social-stats')}>
            <div className="stat-icon" style={{ background: 'rgba(255,0,0,.15)', color: '#FF0000' }}>▶</div>
            <div className="stat-number">{youtubeSubs != null ? formatBigNumber(youtubeSubs) : (settings?.statsYoutubeSubs || '—')}</div>
            <div className="stat-label">YouTube Abone {ytChannel ? '(canlı)' : ''}</div>
          </div>
          <div className="admin-stat-card" style={{
            background: 'linear-gradient(135deg, rgba(228,64,95,0.08), rgba(228,64,95,0.02))',
            border: '1px solid rgba(228,64,95,0.18)',
            cursor: 'pointer',
          }} onClick={() => onNavigate('social-stats')}>
            <div className="stat-icon" style={{ background: 'rgba(228,64,95,.15)', color: '#E4405F' }}>📸</div>
            <div className="stat-number">{settings?.statsInstagramFollowers || '—'}</div>
            <div className="stat-label">Instagram Takipçi</div>
          </div>
          <div className="admin-stat-card" style={{
            background: 'linear-gradient(135deg, rgba(0,242,234,0.08), rgba(255,0,80,0.06))',
            border: '1px solid rgba(0,242,234,0.18)',
            cursor: 'pointer',
          }} onClick={() => onNavigate('social-stats')}>
            <div className="stat-icon" style={{ background: 'rgba(0,242,234,.15)', color: '#00F2EA' }}>🎵</div>
            <div className="stat-number">{settings?.statsTiktokFollowers || '—'}</div>
            <div className="stat-label">TikTok Takipçi</div>
          </div>
          <div className="admin-stat-card" style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
            border: '1px solid rgba(245,158,11,0.18)',
          }}>
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>👁️</div>
            <div className="stat-number">{youtubeViews != null ? formatBigNumber(youtubeViews) : (settings?.statsTotalViews || '—')}</div>
            <div className="stat-label">Toplam İzlenme</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(124,58,237,.15)', color: '#7c3aed' }}>🎬</div>
            <div className="stat-number">{youtubeVideos != null ? formatBigNumber(youtubeVideos) : (settings?.statsTotalVideos || '—')}</div>
            <div className="stat-label">Yayınlanmış Video</div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 20px', borderRadius: 12, marginTop: 16,
        background: 'rgba(46,204,113,.06)', border: '1px solid rgba(46,204,113,.2)',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2ECC71', boxShadow: '0 0 0 4px rgba(46,204,113,.18)', animation: 'kade-pulse 1.6s ease-in-out infinite' }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>Şu an sitede </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#2ECC71' }}>{liveVisitors ?? '...'}</span>
          <span style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}> aktif ziyaretçi</span>
        </div>
      </div>
      <style>{`@keyframes kade-pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.35);opacity:.7} }`}</style>
    </div>
  )
}

// ───── SOCIAL STATS ─────
function SocialStatsSection({ settings, ytChannel, ytVideos, showToast }) {
  const [refreshing, setRefreshing] = useState(false)
  const [live, setLive] = useState(null)

  useEffect(() => {
    getSocialStatsApi().then(setLive).catch(() => {})
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const [, data] = await Promise.all([
        refreshYouTubeVideosApi().catch(() => null),
        refreshSocialStatsApi(),
      ])
      setLive(data)
      showToast('Sosyal istatistikler güncellendi (YouTube canlı, Instagram/TikTok scrape)', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const liveYt = live?.youtube
  const liveIg = live?.instagram
  const liveTt = live?.tiktok

  const totalViewsFromVideos = (ytVideos || []).reduce((s, v) => s + (Number(v.views) || 0), 0)
  const totalLikesFromVideos = (ytVideos || []).reduce((s, v) => s + (Number(v.likes) || 0), 0)
  const topVideo = [...(ytVideos || [])].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))[0]

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Sosyal Medya <span>İstatistikleri</span></h1>
          <p>YouTube canlı verileri + manuel Instagram/TikTok sayaçları</p>
        </div>
        <button className="btn btn-primary" onClick={handleRefresh} disabled={refreshing}>
          <HiOutlineRefresh size={16} /> {refreshing ? 'Yenileniyor…' : 'YouTube Verilerini Yenile'}
        </button>
      </div>

      {/* YouTube */}
      <div className="settings-section" style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.06), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>▶️</span>
          <div>
            <h3 style={{ margin: 0 }}>YouTube — {liveYt?.title || ytChannel?.title || settings?.youtubeHandle || '@kadirardademirr'}</h3>
            <small style={{ color: liveYt ? '#34d399' : 'var(--text-secondary)' }}>
              {liveYt ? '● Canlı (Data API)' : ytChannel ? 'Cache' : 'Veri yok — "Yenile" tıklayın'}
            </small>
          </div>
        </div>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255,0,0,.15)', color: '#FF0000' }}>👥</div>
            <div className="stat-number">{liveYt?.followersDisplay || (ytChannel?.subscriberCount != null ? formatBigNumber(ytChannel.subscriberCount) : (settings?.statsYoutubeSubs || '—'))}</div>
            <div className="stat-label">Abone</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255,0,0,.15)', color: '#FF0000' }}>👁️</div>
            <div className="stat-number">{liveYt?.viewsDisplay || (ytChannel?.viewCount != null ? formatBigNumber(ytChannel.viewCount) : (settings?.statsTotalViews || '—'))}</div>
            <div className="stat-label">Toplam İzlenme</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255,0,0,.15)', color: '#FF0000' }}>🎬</div>
            <div className="stat-number">{liveYt?.videosDisplay || (ytChannel?.videoCount != null ? formatBigNumber(ytChannel.videoCount) : (settings?.statsTotalVideos || '—'))}</div>
            <div className="stat-label">Video</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255,0,0,.15)', color: '#FF0000' }}>👍</div>
            <div className="stat-number">{totalLikesFromVideos > 0 ? formatBigNumber(totalLikesFromVideos) : '—'}</div>
            <div className="stat-label">Toplam Beğeni (son {(ytVideos || []).length})</div>
          </div>
        </div>
        {topVideo && (
          <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 14, alignItems: 'center' }}>
            {topVideo.thumbnail && <img src={topVideo.thumbnail} alt="" style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.08em' }}>En Çok İzlenen Bölüm</div>
              <div style={{ fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topVideo.title}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {formatBigNumber(topVideo.views)} izlenme · {formatBigNumber(topVideo.likes)} beğeni
              </div>
            </div>
            <a href={`https://www.youtube.com/watch?v=${topVideo.youtubeId}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Aç</a>
          </div>
        )}
      </div>

      {/* Instagram */}
      <div className="settings-section" style={{ background: 'linear-gradient(135deg, rgba(228,64,95,0.06), rgba(131,58,180,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>📸</span>
          <div>
            <h3 style={{ margin: 0 }}>Instagram — @{liveIg?.handle || settings?.instagramHandle?.replace(/^@/, '') || 'kadirardademir'}</h3>
            <small style={{ color: liveIg ? '#34d399' : 'var(--text-secondary)' }}>
              {liveIg ? '● Canlı (scrape)' : 'Scrape başarısız — manuel değer gösteriliyor'}
            </small>
          </div>
          {settings?.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ marginLeft: 'auto' }}>Profili Aç</a>}
        </div>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(228,64,95,.15)', color: '#E4405F' }}>👥</div>
            <div className="stat-number">{liveIg?.followersDisplay || settings?.statsInstagramFollowers || '—'}</div>
            <div className="stat-label">Takipçi</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(228,64,95,.15)', color: '#E4405F' }}>🖼️</div>
            <div className="stat-number">{liveIg?.postsDisplay || settings?.statsInstagramPosts || '—'}</div>
            <div className="stat-label">Paylaşım</div>
          </div>
        </div>
      </div>

      {/* TikTok */}
      <div className="settings-section" style={{ background: 'linear-gradient(135deg, rgba(0,242,234,0.05), rgba(255,0,80,0.04))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>🎵</span>
          <div>
            <h3 style={{ margin: 0 }}>TikTok — @{liveTt?.handle || settings?.tiktokHandle?.replace(/^@/, '') || 'kadirardademir'}</h3>
            <small style={{ color: liveTt ? '#34d399' : 'var(--text-secondary)' }}>
              {liveTt ? '● Canlı (scrape)' : 'Scrape başarısız — manuel değer gösteriliyor'}
            </small>
          </div>
          {settings?.tiktok && <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ marginLeft: 'auto' }}>Profili Aç</a>}
        </div>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(0,242,234,.15)', color: '#00F2EA' }}>👥</div>
            <div className="stat-number">{liveTt?.followersDisplay || settings?.statsTiktokFollowers || '—'}</div>
            <div className="stat-label">Takipçi</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255,0,80,.15)', color: '#FF0050' }}>❤️</div>
            <div className="stat-number">{liveTt?.likesDisplay || settings?.statsTiktokLikes || '—'}</div>
            <div className="stat-label">Toplam Beğeni</div>
          </div>
          {liveTt?.videosDisplay && (
            <div className="admin-stat-card">
              <div className="stat-icon" style={{ background: 'rgba(0,242,234,.15)', color: '#00F2EA' }}>🎬</div>
              <div className="stat-number">{liveTt.videosDisplay}</div>
              <div className="stat-label">Video</div>
            </div>
          )}
        </div>
      </div>

      {/* Toplam */}
      <div className="settings-section" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), transparent)', border: '1px solid rgba(245,158,11,.2)' }}>
        <h3>📈 Genel Toplam</h3>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>🌐</div>
            <div className="stat-number">{totalViewsFromVideos > 0 ? formatBigNumber(totalViewsFromVideos) : '—'}</div>
            <div className="stat-label">Son videoların izlenme</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>🎬</div>
            <div className="stat-number">{(ytVideos || []).length}</div>
            <div className="stat-label">Cache'deki video</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>📅</div>
            <div className="stat-number">{settings?.statsActiveYears || '14'}</div>
            <div className="stat-label">Aktif yıl</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ───── ANALYTICS ─────
function AnalyticsSection() {
  const [period, setPeriod] = useState('week')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getGA4AnalyticsApi(period)
      .then(d => setData(d))
      .catch(() => getAnalyticsApi(period).then(setData).catch(() => setData(null)))
      .finally(() => setLoading(false))
  }, [period])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Analitik</h1>
          <p>Ziyaretçi, sayfa görüntüleme ve oturum verileri</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="admin-select">
          <option value="today">Bugün</option>
          <option value="week">Son 7 Gün</option>
          <option value="month">Son 30 Gün</option>
        </select>
      </div>

      {loading ? <p>Yükleniyor…</p> : !data ? <p>Analitik verisi yok.</p> : (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{data.totalUsers ?? data.users ?? 0}</div>
            <div className="stat-label">Toplam Ziyaretçi</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-number">{data.pageViews ?? 0}</div>
            <div className="stat-label">Sayfa Görüntüleme</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-number">{data.avgSessionDuration ?? '—'}</div>
            <div className="stat-label">Ort. Oturum Süresi</div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-number">{data.bounceRate ?? '—'}</div>
            <div className="stat-label">Hemen Çıkma Oranı</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ───── MESSAGES ─────
function MessagesSection({ onCountChange, showToast }) {
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    getMessagesApi().then(d => {
      if (Array.isArray(d)) {
        setMessages(d)
        onCountChange?.(d.filter(m => !m.read).length)
      }
    }).catch(() => {})
  }, [onCountChange])

  useEffect(() => { load() }, [load])

  const handleOpen = async (m) => {
    setSelected(m); setReplyText('')
    if (!m.read) { try { await markMessageReadApi(m._id); load() } catch { /* ignore */ } }
  }

  const handleDelete = async (id) => {
    if (!confirm('Mesajı silmek istediğine emin misin?')) return
    try { await deleteMessageApi(id); load(); setSelected(null); showToast('Mesaj silindi', 'success') }
    catch (e) { showToast(e.message, 'error') }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return
    try {
      await replyToMessageApi(selected._id, replyText, `Re: ${selected.subject || 'Mesajın hakkında'}`)
      await updateMessageStatusApi(selected._id, 'cevaplandi')
      showToast('Cevap gönderildi', 'success')
      setReplyText('')
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const filtered = messages.filter(m => filter === 'all' || (filter === 'unread' ? !m.read : m.read))

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Mesajlar</h1>
          <p>İletişim formundan gelen tüm mesajlar</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="admin-select">
          <option value="all">Tümü ({messages.length})</option>
          <option value="unread">Okunmamış ({messages.filter(m => !m.read).length})</option>
          <option value="read">Okunmuş</option>
        </select>
      </div>

      <div className="messages-layout">
        <div className="messages-list">
          {filtered.length === 0 ? <p style={{ padding: 20 }}>Mesaj bulunamadı.</p> : filtered.map(m => (
            <div key={m._id} className={`message-item ${!m.read ? 'unread' : ''} ${selected?._id === m._id ? 'active' : ''}`}
              onClick={() => handleOpen(m)}>
              <div className="message-from">{m.name} {!m.read && <span className="dot" />}</div>
              <div className="message-subject">{m.subject || '(konu yok)'}</div>
              <div className="message-preview">{(m.message || '').slice(0, 60)}…</div>
              <div className="message-date">{new Date(m.createdAt).toLocaleDateString('tr-TR')}</div>
            </div>
          ))}
        </div>
        <div className="message-detail">
          {!selected ? <p style={{ padding: 20, color: 'var(--text-secondary)' }}>Detay için bir mesaj seç.</p> : (
            <>
              <div className="detail-header">
                <h3>{selected.subject || '(konu yok)'}</h3>
                <button className="btn-icon-danger" onClick={() => handleDelete(selected._id)} aria-label="Sil">
                  <HiOutlineTrash size={18} />
                </button>
              </div>
              <div className="detail-meta">
                <strong>{selected.name}</strong> · {selected.email}
                {selected.phone && <> · {selected.phone}</>}
                <br /><small>{new Date(selected.createdAt).toLocaleString('tr-TR')}</small>
              </div>
              <div className="detail-body">{selected.message}</div>
              <div className="reply-box">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Cevabını yaz..." rows={5} />
                <button className="btn btn-primary" onClick={handleReply} disabled={!replyText.trim()}>
                  E-posta ile cevapla
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ───── BLOG ─────
function BlogSection({ showToast }) {
  const [posts, setPosts] = useState([])
  const [editing, setEditing] = useState(null)

  const load = () => {
    getBlogsApi()
      .then(d => setPosts(Array.isArray(d) ? d : Array.isArray(d?.blogs) ? d.blogs : []))
      .catch(() => setPosts([]))
  }
  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    try {
      const payload = {
        titleTr: data.titleTr?.trim() || data.title?.trim() || '',
        titleEn: data.titleEn?.trim() || data.titleTr?.trim() || data.title?.trim() || '',
        excerptTr: data.excerptTr || data.excerpt || '',
        excerptEn: data.excerptEn || data.excerptTr || data.excerpt || '',
        contentTr: data.contentTr || data.content || '',
        contentEn: data.contentEn || data.contentTr || data.content || '',
        category: data.category || '',
        categoryEn: data.categoryEn || data.category || '',
        image: data.image || data.coverImage || '',
        color: data.color || '#eac321',
        readTime: data.readTime || 5,
        slug: data.slug?.trim() || '',
        publishAt: data.publishAt || null,
        published: data.published !== false,
      }
      if (data._id) await updateBlogApi({ id: data._id, ...payload }); else await createBlogApi(payload)
      showToast('Yazı kaydedildi', 'success')
      setEditing(null); load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu yazıyı sil?')) return
    try { await deleteBlogApi(id); load(); showToast('Yazı silindi', 'success') }
    catch (e) { showToast(e.message, 'error') }
  }

  if (editing) return <BlogEditor post={editing} onSave={handleSave} onCancel={() => setEditing(null)} />

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Blog Yazıları</h1><p>{posts.length} yazı</p></div>
        <button className="btn btn-primary" onClick={() => setEditing({ titleTr: '', titleEn: '', slug: '', excerptTr: '', excerptEn: '', contentTr: '', contentEn: '', category: '', categoryEn: '', image: '', published: true })}>
          <HiOutlinePlus size={18} /> Yeni Yazı
        </button>
      </div>
      <div className="blog-grid">
        {posts.map(p => (
          <div key={p._id} className="blog-card">
            <div className="blog-card-status">{p.published ? '🟢 Yayında' : '⚪ Taslak'}</div>
            <h3>{p.titleTr || p.title}</h3>
            <p>{p.excerptTr || p.excerpt}</p>
            <div className="blog-card-actions">
              <button className="btn btn-outline" onClick={() => setEditing(p)}>Düzenle</button>
              <button className="btn-icon-danger" onClick={() => handleDelete(p._id)}><HiOutlineTrash size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BlogEditor({ post, onSave, onCancel }) {
  const [data, setData] = useState(post)
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }))
  return (
    <div>
      <div className="admin-page-header">
        <h1>{data._id ? 'Yazıyı Düzenle' : 'Yeni Yazı'}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={onCancel}>İptal</button>
          <button className="btn btn-primary" onClick={() => onSave(data)}>
            <HiOutlineSave size={18} /> Kaydet
          </button>
        </div>
      </div>
      <div className="form-stack">
        <label>Başlık (TR)<input value={data.titleTr || data.title || ''} onChange={e => upd('titleTr', e.target.value)} /></label>
        <label>Başlık (EN)<input value={data.titleEn || ''} onChange={e => upd('titleEn', e.target.value)} /></label>
        <label>Slug (URL)<input value={data.slug || ''} onChange={e => upd('slug', e.target.value)} placeholder="otomatik oluşturulur" /></label>
        <label>Özet (TR)<textarea value={data.excerptTr || data.excerpt || ''} onChange={e => upd('excerptTr', e.target.value)} rows={2} /></label>
        <label>Özet (EN)<textarea value={data.excerptEn || ''} onChange={e => upd('excerptEn', e.target.value)} rows={2} /></label>
        <label>İçerik (TR, HTML / Markdown)<textarea value={data.contentTr || data.content || ''} onChange={e => upd('contentTr', e.target.value)} rows={12} /></label>
        <label>İçerik (EN, HTML / Markdown)<textarea value={data.contentEn || ''} onChange={e => upd('contentEn', e.target.value)} rows={12} /></label>
        <label>Kapak Görseli URL<input value={data.image || data.coverImage || ''} onChange={e => upd('image', e.target.value)} /></label>
        <label>Kategori (TR)<input value={data.category || ''} onChange={e => upd('category', e.target.value)} /></label>
        <label>Kategori (EN)<input value={data.categoryEn || ''} onChange={e => upd('categoryEn', e.target.value)} /></label>
        <label className="checkbox-row">
          <input type="checkbox" checked={!!data.published} onChange={e => upd('published', e.target.checked)} />
          Yayında
        </label>
      </div>
    </div>
  )
}

// ───── COMMENTS ─────
function CommentsSection({ showToast }) {
  const [comments, setComments] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  const load = useCallback((f = filter) => {
    setLoading(true)
    getAdminCommentsApi(f)
      .then((d) => Array.isArray(d) && setComments(d))
      .catch((e) => showToast(e.message || 'Yüklenemedi', 'error'))
      .finally(() => setLoading(false))
  }, [filter, showToast])

  useEffect(() => { load(filter) }, [filter, load])

  const approve = async (id) => {
    try {
      await setCommentApprovalApi(id, true)
      showToast('Yorum onaylandı', 'success')
      load(filter)
    } catch (e) { showToast(e.message, 'error') }
  }

  const unapprove = async (id) => {
    try {
      await setCommentApprovalApi(id, false)
      showToast('Yorum gizlendi', 'success')
      load(filter)
    } catch (e) { showToast(e.message, 'error') }
  }

  const remove = async (id) => {
    if (!confirm('Yorumu silmek istediğine emin misin?')) return
    try {
      await deleteCommentApi(id)
      showToast('Yorum silindi', 'success')
      load(filter)
    } catch (e) { showToast(e.message, 'error') }
  }

  const pendingCount = comments.filter((c) => c.approved === false).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Yorumlar</h1>
          <p>
            {comments.length} yorum
            {filter === 'pending' && pendingCount > 0 ? ` · ${pendingCount} onay bekliyor` : ''}
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <button
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('pending')}
          >
            Onay bekleyenler
          </button>
          <button
            className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('approved')}
          >
            Onaylananlar
          </button>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            Tümü
          </button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--gray-light)' }}>Yükleniyor…</p>}

      {!loading && comments.length === 0 && (
        <p style={{ color: 'var(--gray-light)' }}>
          {filter === 'pending'
            ? 'Onay bekleyen yorum yok.'
            : filter === 'approved'
              ? 'Henüz onaylanmış yorum yok.'
              : 'Hiç yorum yok.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {comments.map((c) => (
          <article
            key={c._id}
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${c.approved === false ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8, fontSize: '0.84rem' }}>
              <div>
                <strong>{c.author}</strong>{' '}
                <span style={{ color: 'var(--gray-light)' }}>
                  · /blog/{c.postSlug} · {new Date(c.createdAt).toLocaleString('tr-TR')}
                </span>
              </div>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: c.approved ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                  color: c.approved ? '#34d399' : '#fbbf24',
                  border: `1px solid ${c.approved ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                }}
              >
                {c.approved ? 'Onaylı' : 'Beklemede'}
              </span>
            </header>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, margin: '0 0 12px', color: 'var(--gray-lighter)' }}>
              {c.body}
            </p>
            <div style={{ display: 'inline-flex', gap: 8 }}>
              {c.approved === false ? (
                <button className="btn btn-primary" onClick={() => approve(c._id)}>
                  <HiOutlineCheck size={16} /> Onayla
                </button>
              ) : (
                <button className="btn btn-outline" onClick={() => unapprove(c._id)}>
                  <HiOutlineEyeOff size={16} /> Gizle
                </button>
              )}
              <button className="btn btn-outline" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.4)' }} onClick={() => remove(c._id)}>
                <HiOutlineTrash size={16} /> Sil
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function NewsletterSection({ showToast }) {
  const [subscribers, setSubscribers] = useState([])
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [sending, setSending] = useState(false)

  const load = () => {
    getNewsletterSubscribersApi().then(d => Array.isArray(d) && setSubscribers(d)).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const handleSend = async () => {
    if (!subject.trim() || !html.trim()) return
    if (!confirm(`${subscribers.filter(s => s.confirmed).length} aboneye gönderilsin mi?`)) return
    setSending(true)
    try {
      await sendNewsletterApi(subject, html)
      showToast('Bülten gönderildi', 'success')
      setSubject(''); setHtml('')
    } catch (e) { showToast(e.message, 'error') }
    finally { setSending(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Aboneyi sil?')) return
    try { await deleteNewsletterSubscriberApi(id); load() } catch (e) { showToast(e.message, 'error') }
  }

  const confirmed = subscribers.filter(s => s.confirmed).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Newsletter</h1>
          <p>{subscribers.length} kayıt · {confirmed} onaylı</p>
        </div>
        <button className="btn btn-outline" onClick={async () => {
          try { await testSmtpApi(); showToast('SMTP test e-postası gönderildi', 'success') }
          catch (e) { showToast(e.message, 'error') }
        }}>SMTP Test</button>
      </div>

      <div className="form-stack" style={{ marginBottom: 32 }}>
        <h3>Bülten Gönder</h3>
        <label>Konu<input value={subject} onChange={e => setSubject(e.target.value)} /></label>
        <label>HTML İçerik<textarea value={html} onChange={e => setHtml(e.target.value)} rows={10} /></label>
        <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
          {sending ? 'Gönderiliyor...' : `${confirmed} aboneye gönder`}
        </button>
      </div>

      <h3>Aboneler</h3>
      <table className="admin-table">
        <thead><tr><th>E-posta</th><th>Durum</th><th>Tarih</th><th></th></tr></thead>
        <tbody>
          {subscribers.map(s => (
            <tr key={s._id}>
              <td>{s.email}</td>
              <td>{s.confirmed ? '✅ Onaylı' : '⏳ Bekliyor'}</td>
              <td>{new Date(s.createdAt).toLocaleDateString('tr-TR')}</td>
              <td><button className="btn-icon-danger" onClick={() => handleDelete(s._id)}><HiOutlineTrash size={16} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ───── MEDIA LIBRARY ─────
function MediaSection({ showToast }) {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(new Set())

  const load = () => {
    getMediaApi()
      .then(async (d) => {
        const list = Array.isArray(d) ? d : []
        const withPreviews = await Promise.all(list.map(async (item) => {
          if (!String(item.mimeType || '').startsWith('image/')) return item
          try {
            const file = await getMediaFileApi(item._id)
            return { ...item, previewUrl: `data:${file.mimeType};base64,${file.data}` }
          } catch {
            return item
          }
        }))
        setItems(withPreviews)
      })
      .catch(() => setItems([]))
  }
  useEffect(() => { load() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return showToast('Dosya 5MB\'tan büyük', 'error')
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await uploadMediaApi({ name: file.name, mimeType: file.type, data: reader.result })
        showToast('Yüklendi', 'success'); load()
      } catch (err) { showToast(err.message, 'error') }
    }
    reader.readAsDataURL(file)
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`${selected.size} dosyayı sil?`)) return
    try {
      await bulkDeleteMediaApi([...selected])
      setSelected(new Set()); load()
      showToast('Silindi', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const toggle = (id) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Medya Kütüphanesi</h1><p>{items.length} dosya</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected.size > 0 && <button className="btn btn-outline" onClick={handleBulkDelete}>{selected.size} dosyayı sil</button>}
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <HiOutlinePlus size={18} /> Yükle
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
      <div className="media-grid">
        {items.map(it => (
          <div key={it._id} className={`media-tile ${selected.has(it._id) ? 'selected' : ''}`}
            onClick={() => toggle(it._id)}>
            {it.previewUrl ? (
              <img src={it.previewUrl} alt={it.name} loading="lazy" />
            ) : (
              <div className="media-file-placeholder">{it.type || 'file'}</div>
            )}
            <div className="media-name">{it.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ───── SITE SETTINGS ─────
function SettingsSection({ showToast, onChangePassword }) {
  const [s, setS] = useState({})
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])

  useEffect(() => {
    getSiteSettingsApi().then(res => {
      const d = res?.data || {}
      setS(d)
      setPosts(d.instagramPosts || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const upd = (k, v) => setS(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    try {
      await updateSiteSettingsApi({ ...s, instagramPosts: posts })
      showToast('Ayarlar kaydedildi', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleRefreshYT = async () => {
    try { await refreshYouTubeVideosApi(); showToast('YouTube cache yenilendi', 'success') }
    catch (e) { showToast(e.message, 'error') }
  }

  if (loading) return <p>Yükleniyor…</p>

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Site Ayarları</h1><p>Kimlik, sosyal medya, istatistikler, SEO</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={handleRefreshYT}>
            <HiOutlineRefresh size={16} /> YouTube Yenile
          </button>
          <button className="btn btn-outline" onClick={onChangePassword}>
            <HiOutlineKey size={16} /> Şifre Değiştir
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <HiOutlineSave size={18} /> Kaydet
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Kimlik</h3>
        <div className="form-grid">
          <label>İsim<input value={s.businessName || ''} onChange={e => upd('businessName', e.target.value)} /></label>
          <label>Slogan<input value={s.tagline || ''} onChange={e => upd('tagline', e.target.value)} /></label>
          <label className="full">Kısa Açıklama<textarea value={s.description || ''} onChange={e => upd('description', e.target.value)} rows={3} /></label>
          <label>E-posta (genel)<input value={s.email || ''} onChange={e => upd('email', e.target.value)} /></label>
          <label>E-posta (iş)<input value={s.businessEmail || ''} onChange={e => upd('businessEmail', e.target.value)} /></label>
          <label>Telefon<input value={s.phone || ''} onChange={e => upd('phone', e.target.value)} /></label>
          <label>Şehir<input value={s.address || ''} onChange={e => upd('address', e.target.value)} /></label>
          <label>Site Base URL<input value={s.baseUrl || ''} onChange={e => upd('baseUrl', e.target.value)} /></label>
        </div>
      </div>

      <div className="settings-section">
        <h3>🌐 Sosyal Medya</h3>
        <div className="form-grid">
          <label>▶️ YouTube URL<input value={s.youtube || ''} onChange={e => upd('youtube', e.target.value)} placeholder="https://youtube.com/@kadirardademirr" /></label>
          <label>▶️ YouTube Handle<input value={s.youtubeHandle || ''} onChange={e => upd('youtubeHandle', e.target.value)} placeholder="@kadirardademirr" /></label>
          <label>▶️ YouTube Channel ID<input value={s.youtubeChannelId || ''} onChange={e => upd('youtubeChannelId', e.target.value)} placeholder="UCxxxxxx..." /></label>
          <label>📸 Instagram URL<input value={s.instagram || ''} onChange={e => upd('instagram', e.target.value)} placeholder="https://instagram.com/kadirardademir" /></label>
          <label>📸 Instagram Handle<input value={s.instagramHandle || ''} onChange={e => upd('instagramHandle', e.target.value)} placeholder="@kadirardademir" /></label>
          <label>🎵 TikTok URL<input value={s.tiktok || ''} onChange={e => upd('tiktok', e.target.value)} placeholder="https://tiktok.com/@kadirardademir" /></label>
          <label>🎵 TikTok Handle<input value={s.tiktokHandle || ''} onChange={e => upd('tiktokHandle', e.target.value)} placeholder="@kadirardademir" /></label>
          <label>𝕏 X (Twitter) URL<input value={s.twitter || ''} onChange={e => upd('twitter', e.target.value)} /></label>
          <label>💬 Discord URL<input value={s.discord || ''} onChange={e => upd('discord', e.target.value)} placeholder="https://discord.gg/..." /></label>
          <label>💼 LinkedIn URL<input value={s.linkedin || ''} onChange={e => upd('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." /></label>
          <label>📞 WhatsApp<input value={s.whatsapp || ''} onChange={e => upd('whatsapp', e.target.value)} /></label>
        </div>
      </div>

      <div className="settings-section">
        <h3>📊 İstatistikler (sayaçlar)</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
          YouTube verileri "YouTube Yenile" ile otomatik güncellenir. TikTok / Instagram sayıları manuel girilir (örn. 1.8M, 24.5M).
        </p>
        <div className="form-grid">
          <label>▶️ YouTube Abone<input value={s.statsYoutubeSubs || ''} onChange={e => upd('statsYoutubeSubs', e.target.value)} placeholder="2.4M" /></label>
          <label>▶️ Toplam İzlenme<input value={s.statsTotalViews || ''} onChange={e => upd('statsTotalViews', e.target.value)} placeholder="1.02B" /></label>
          <label>▶️ Yayınlanmış Video<input value={s.statsTotalVideos || ''} onChange={e => upd('statsTotalVideos', e.target.value)} placeholder="3.8K" /></label>
          <label>📸 Instagram Takipçi<input value={s.statsInstagramFollowers || ''} onChange={e => upd('statsInstagramFollowers', e.target.value)} placeholder="3.3M" /></label>
          <label>📸 Instagram Post<input value={s.statsInstagramPosts || ''} onChange={e => upd('statsInstagramPosts', e.target.value)} placeholder="420" /></label>
          <label>🎵 TikTok Takipçi<input value={s.statsTiktokFollowers || ''} onChange={e => upd('statsTiktokFollowers', e.target.value)} placeholder="1.8M" /></label>
          <label>🎵 TikTok Beğeni<input value={s.statsTiktokLikes || ''} onChange={e => upd('statsTiktokLikes', e.target.value)} placeholder="24.5M" /></label>
          <label>📅 Aktif Yıl<input value={s.statsActiveYears || ''} onChange={e => upd('statsActiveYears', e.target.value)} placeholder="14" /></label>
        </div>
      </div>

      <div className="settings-section">
        <h3>⭐ Ana Sayfa — Öne Çıkan Video & Sırada</h3>
        <div className="form-grid">
          <label className="full">🎬 Öne Çıkan Video ID
            <input value={s.featuredVideoId || ''} onChange={e => upd('featuredVideoId', e.target.value)} placeholder="dQw4w9WgXcQ (boşsa en çok izlenen)" />
          </label>
          <label>⏭️ Sıradaki Video Başlığı<input value={s.nextVideoTitle || ''} onChange={e => upd('nextVideoTitle', e.target.value)} placeholder="Yeni vlog: İstanbul turu" /></label>
          <label>📅 Yayın Tarihi<input value={s.nextVideoDate || ''} onChange={e => upd('nextVideoDate', e.target.value)} placeholder="Cuma 20:00" /></label>
          <label className="full">📝 Not<input value={s.nextVideoNote || ''} onChange={e => upd('nextVideoNote', e.target.value)} placeholder="Kaçırma!" /></label>
          <label className="full checkbox-row">
            <input type="checkbox" checked={!!s.newsletterEnabled} onChange={e => upd('newsletterEnabled', e.target.checked)} />
            📧 Ana sayfada bülten (e-posta) kutusunu göster
          </label>
        </div>
        <p style={{ fontSize: '.78rem', color: 'var(--text-secondary)', margin: '10px 0 0' }}>
          Video ID = YouTube linkindeki watch?v=<strong>BURASI</strong>. Sıradaki video başlığı boşsa o bölüm gizlenir.
        </p>
      </div>

      <div className="settings-section">
        <h3>SEO</h3>
        <div className="form-grid">
          <label className="full">Meta Title<input value={s.seoTitle || ''} onChange={e => upd('seoTitle', e.target.value)} /></label>
          <label className="full">Meta Description<textarea value={s.seoDescription || ''} onChange={e => upd('seoDescription', e.target.value)} rows={2} /></label>
          <label className="full">Meta Keywords<input value={s.seoKeywords || ''} onChange={e => upd('seoKeywords', e.target.value)} /></label>
        </div>
      </div>

      {/* ── Ana Sayfa: Ne Yapıyorum (3 kart) ── */}
      <div className="settings-section">
        <h3>🏠 Ana Sayfa — "Ne Yapıyorum" Kartları</h3>
        <p style={{ fontSize: '.8rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>Boş bırakılırsa varsayılan kartlar gösterilir.</p>
        {(s.homeFocus || []).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <input value={c.title || ''} placeholder="Başlık" style={{ flex: '0 0 200px' }}
              onChange={e => { const n = [...s.homeFocus]; n[i] = { ...n[i], title: e.target.value }; upd('homeFocus', n) }} />
            <textarea value={c.body || ''} placeholder="Açıklama" rows={2} style={{ flex: 1 }}
              onChange={e => { const n = [...s.homeFocus]; n[i] = { ...n[i], body: e.target.value }; upd('homeFocus', n) }} />
            <button className="btn-icon-danger" onClick={() => upd('homeFocus', s.homeFocus.filter((_, j) => j !== i))}><HiOutlineTrash size={16} /></button>
          </div>
        ))}
        <button className="btn btn-outline" onClick={() => upd('homeFocus', [...(s.homeFocus || []), { title: '', body: '' }])}>
          <HiOutlinePlus size={16} /> Kart Ekle
        </button>
      </div>

      {/* ── Ana Sayfa: Yolculuk / Timeline ── */}
      <div className="settings-section">
        <h3>🛣️ Ana Sayfa — Yolculuk (Timeline)</h3>
        <p style={{ fontSize: '.8rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>Yıl/dönem, rol ve açıklama. Boşsa varsayılan gösterilir.</p>
        {(s.homeStory || []).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <input value={c.period || ''} placeholder="2011 / Bugün" style={{ flex: '0 0 110px' }}
              onChange={e => { const n = [...s.homeStory]; n[i] = { ...n[i], period: e.target.value }; upd('homeStory', n) }} />
            <input value={c.role || ''} placeholder="Başlık" style={{ flex: '0 0 180px' }}
              onChange={e => { const n = [...s.homeStory]; n[i] = { ...n[i], role: e.target.value }; upd('homeStory', n) }} />
            <textarea value={c.body || ''} placeholder="Açıklama" rows={2} style={{ flex: 1 }}
              onChange={e => { const n = [...s.homeStory]; n[i] = { ...n[i], body: e.target.value }; upd('homeStory', n) }} />
            <button className="btn-icon-danger" onClick={() => upd('homeStory', s.homeStory.filter((_, j) => j !== i))}><HiOutlineTrash size={16} /></button>
          </div>
        ))}
        <button className="btn btn-outline" onClick={() => upd('homeStory', [...(s.homeStory || []), { period: '', role: '', body: '' }])}>
          <HiOutlinePlus size={16} /> Dönem Ekle
        </button>
      </div>

      {/* ── Ana Sayfa: SSS ── */}
      <div className="settings-section">
        <h3>❓ Ana Sayfa — Sıkça Sorulanlar</h3>
        <p style={{ fontSize: '.8rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>Soru-cevap. Boşsa varsayılan gösterilir.</p>
        {(s.homeFaq || []).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <input value={c.q || ''} placeholder="Soru" style={{ flex: '0 0 240px' }}
              onChange={e => { const n = [...s.homeFaq]; n[i] = { ...n[i], q: e.target.value }; upd('homeFaq', n) }} />
            <textarea value={c.a || ''} placeholder="Cevap" rows={2} style={{ flex: 1 }}
              onChange={e => { const n = [...s.homeFaq]; n[i] = { ...n[i], a: e.target.value }; upd('homeFaq', n) }} />
            <button className="btn-icon-danger" onClick={() => upd('homeFaq', s.homeFaq.filter((_, j) => j !== i))}><HiOutlineTrash size={16} /></button>
          </div>
        ))}
        <button className="btn btn-outline" onClick={() => upd('homeFaq', [...(s.homeFaq || []), { q: '', a: '' }])}>
          <HiOutlinePlus size={16} /> Soru Ekle
        </button>
      </div>

      <div className="settings-section">
        <h3>Instagram Post Linkleri (manuel)</h3>
        {posts.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={p.url || ''} onChange={e => {
              const n = [...posts]; n[i] = { ...n[i], url: e.target.value }; setPosts(n)
            }} placeholder="https://instagram.com/p/..." style={{ flex: 1 }} />
            <input value={p.thumbnail || ''} onChange={e => {
              const n = [...posts]; n[i] = { ...n[i], thumbnail: e.target.value }; setPosts(n)
            }} placeholder="Thumbnail URL" style={{ flex: 1 }} />
            <button className="btn-icon-danger" onClick={() => setPosts(posts.filter((_, j) => j !== i))}><HiOutlineTrash size={16} /></button>
          </div>
        ))}
        <button className="btn btn-outline" onClick={() => setPosts([...posts, { url: '', thumbnail: '' }])}>
          <HiOutlinePlus size={16} /> Post Ekle
        </button>
      </div>
    </div>
  )
}

// ───── USERS ─────
function UsersSection({ showToast, currentUser }) {
  const [users, setUsers] = useState([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'editor' })

  const load = () => getUsersApi().then(d => Array.isArray(d) && setUsers(d)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    try {
      await createUserApi(form)
      setForm({ username: '', password: '', role: 'editor' }); setAdding(false); load()
      showToast('Kullanıcı eklendi', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleDelete = async (id, username) => {
    if (username === currentUser?.username) return showToast('Kendini silemezsin', 'error')
    if (!confirm(`${username} silinsin mi?`)) return
    try { await deleteUserApi(id); load(); showToast('Silindi', 'success') }
    catch (e) { showToast(e.message, 'error') }
  }

  const handleRoleChange = async (id, role) => {
    try { await updateUserApi({ _id: id, role }); load(); showToast('Rol güncellendi', 'success') }
    catch (e) { showToast(e.message, 'error') }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Kullanıcılar</h1><p>{users.length} kullanıcı</p></div>
        <button className="btn btn-primary" onClick={() => setAdding(v => !v)}>
          <HiOutlinePlus size={18} /> Yeni
        </button>
      </div>

      {adding && (
        <div className="form-stack" style={{ marginBottom: 24 }}>
          <label>Kullanıcı Adı<input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></label>
          <label>Şifre<input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></label>
          <label>Rol
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="editor">Editör</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="btn btn-primary" onClick={handleAdd}>Ekle</button>
        </div>
      )}

      <table className="admin-table">
        <thead><tr><th>Kullanıcı</th><th>Rol</th><th>Oluşturulma</th><th></th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.username}{u.username === currentUser?.username && ' (sen)'}</td>
              <td>
                <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)} className="admin-select"
                  disabled={u.username === currentUser?.username}>
                  <option value="editor">editor</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '—'}</td>
              <td><button className="btn-icon-danger" onClick={() => handleDelete(u._id, u.username)}><HiOutlineTrash size={16} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ───── REMINDERS ─────
function RemindersSection({ showToast }) {
  const [items, setItems] = useState([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', notes: '' })

  const load = () => getRemindersApi().then(d => Array.isArray(d) && setItems(d)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.title || !form.date) return
    try {
      await createReminderApi(form)
      setForm({ title: '', date: '', notes: '' }); setAdding(false); load()
      showToast('Hatırlatıcı eklendi', 'success')
    } catch (e) { showToast(e.message, 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Sil?')) return
    try { await deleteReminderApi(id); load() } catch (e) { showToast(e.message, 'error') }
  }

  const handleToggle = async (r) => {
    try { await updateReminderApi({ ...r, completed: !r.completed }); load() }
    catch (e) { showToast(e.message, 'error') }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Hatırlatıcılar</h1><p>İçerik takvimi & yapılacaklar</p></div>
        <button className="btn btn-primary" onClick={() => setAdding(v => !v)}>
          <HiOutlinePlus size={18} /> Yeni
        </button>
      </div>

      {adding && (
        <div className="form-stack" style={{ marginBottom: 24 }}>
          <label>Başlık<input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></label>
          <label>Tarih<input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></label>
          <label>Notlar<textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></label>
          <button className="btn btn-primary" onClick={handleAdd}>Kaydet</button>
        </div>
      )}

      <table className="admin-table">
        <thead><tr><th>Başlık</th><th>Tarih</th><th>Durum</th><th></th></tr></thead>
        <tbody>
          {items.map(r => (
            <tr key={r._id}>
              <td>{r.title}</td>
              <td>{r.date}</td>
              <td>
                <button onClick={() => handleToggle(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                  title={r.completed ? 'Yapılmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}>
                  {r.completed ? '✅' : '⏳'}
                </button>
              </td>
              <td><button className="btn-icon-danger" onClick={() => handleDelete(r._id)}><HiOutlineTrash size={16} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ───── BACKUP ─────
function BackupSection({ showToast }) {
  const [summary, setSummary] = useState(null)
  const [creating, setCreating] = useState(false)

  const load = () => getBackupSummaryApi().then(setSummary).catch(() => {})
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try { await createBackupApi(); await load(); showToast('Yedek oluşturuldu', 'success') }
    catch (e) { showToast(e.message, 'error') }
    finally { setCreating(false) }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Yedekleme</h1><p>MongoDB koleksiyonlarının anlık yedeği</p></div>
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
          {creating ? 'Oluşturuluyor...' : 'Yeni Yedek Al'}
        </button>
      </div>

      {summary ? (
        <div className="settings-section">
          <h3>Mevcut Durum</h3>
          <p>Son yedek: <strong>{summary.lastBackup ? new Date(summary.lastBackup).toLocaleString('tr-TR') : '—'}</strong></p>
          <p>Toplam belge: <strong>{summary.totalDocs ?? '—'}</strong></p>
          {summary.collections && (
            <table className="admin-table" style={{ marginTop: 16 }}>
              <thead><tr><th>Koleksiyon</th><th>Belge Sayısı</th></tr></thead>
              <tbody>
                {Object.entries(summary.collections).map(([name, count]) => (
                  <tr key={name}><td>{name}</td><td>{count}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : <p>Yükleniyor…</p>}
    </div>
  )
}

// ───── PASSWORD MODAL ─────
function ChangePasswordModal({ onClose, showToast }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')

  const handle = async () => {
    if (next.length < 8) return showToast('Yeni şifre en az 8 karakter olmalı', 'error')
    try { await changePasswordApi(current, next); showToast('Şifre değişti', 'success'); onClose() }
    catch (e) { showToast(e.message, 'error') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Şifre Değiştir</h3>
        <label>Mevcut Şifre<input type="password" value={current} onChange={e => setCurrent(e.target.value)} /></label>
        <label>Yeni Şifre<input type="password" value={next} onChange={e => setNext(e.target.value)} /></label>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-outline" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={handle}>Kaydet</button>
        </div>
      </div>
    </div>
  )
}

// ───── QUICK TOOLS ─────
function QuickToolsSection({ showToast }) {
  const [previewLang, setPreviewLang] = useState('tr')
  const [seoUrl, setSeoUrl] = useState('/')
  const [seoResult, setSeoResult] = useState(null)
  const [seoLoading, setSeoLoading] = useState(false)

  const runSEOCheck = async () => {
    setSeoLoading(true); setSeoResult(null)
    try {
      const url = seoUrl.startsWith('http') ? seoUrl : `${window.location.origin}${seoUrl.startsWith('/') ? seoUrl : '/' + seoUrl}`
      const res = await fetch(url)
      const html = await res.text()
      const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const descM = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
      const ogTitleM = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      const ogDescM = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
      const ogImgM = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      const canonicalM = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)
      const h1Count = (html.match(/<h1[\s>]/gi) || []).length
      const ldJsonCount = (html.match(/application\/ld\+json/gi) || []).length
      setSeoResult({
        url,
        title: titleM?.[1] || null,
        titleLen: titleM?.[1]?.length || 0,
        description: descM?.[1] || null,
        descLen: descM?.[1]?.length || 0,
        ogTitle: ogTitleM?.[1] || null,
        ogDesc: ogDescM?.[1] || null,
        ogImage: ogImgM?.[1] || null,
        canonical: canonicalM?.[1] || null,
        h1Count,
        ldJsonCount,
      })
    } catch (e) {
      showToast(`SEO kontrolü başarısız: ${e.message}`, 'error')
    } finally {
      setSeoLoading(false)
    }
  }

  const langOptions = [
    { code: 'tr', label: '🇹🇷 Türkçe' },
    { code: 'en', label: '🇬🇧 English' },
  ]

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Hızlı <span>Araçlar</span></h1>
          <p>Yayın öncesi kontrol ve içerik önizleme — tek panelde.</p>
        </div>
      </div>

      <div className="settings-section">
        <h3>🌍 Çok Dilli Önizleme</h3>
        <p style={{ fontSize: '.82rem', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
          Sitenin başka bir dilde nasıl göründüğünü hızlıca kontrol et — yeni sekmede aç.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {langOptions.map(o => (
            <button
              key={o.code}
              className={`btn ${previewLang === o.code ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPreviewLang(o.code)}
            >
              {o.label}
            </button>
          ))}
          <button
            className="btn btn-primary"
            onClick={() => {
              try { localStorage.setItem('kade_lang', previewLang) } catch { /* ignore */ }
              window.open('/', '_blank', 'noopener')
            }}
          >
            🚀 Yeni Sekmede Aç
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>🔎 SEO Hızlı Tarama</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            value={seoUrl}
            onChange={(e) => setSeoUrl(e.target.value)}
            placeholder="/ veya /blog/yeni-yazi"
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button className="btn btn-primary" onClick={runSEOCheck} disabled={seoLoading}>
            {seoLoading ? 'Taranıyor…' : 'Tara'}
          </button>
        </div>

        {seoResult && (
          <div style={{ display: 'grid', gap: 10, fontSize: '.86rem' }}>
            <SEORow label="URL" value={seoResult.url} />
            <SEORow label="Title" value={seoResult.title} hint={seoResult.titleLen ? `${seoResult.titleLen} karakter ${seoResult.titleLen > 60 ? '· uzun' : seoResult.titleLen < 30 ? '· kısa' : '· ✓'}` : '· EKSİK'} status={seoResult.title && seoResult.titleLen >= 30 && seoResult.titleLen <= 60 ? 'ok' : 'warn'} />
            <SEORow label="Meta description" value={seoResult.description} hint={seoResult.descLen ? `${seoResult.descLen} karakter ${seoResult.descLen > 160 ? '· uzun' : seoResult.descLen < 80 ? '· kısa' : '· ✓'}` : '· EKSİK'} status={seoResult.description && seoResult.descLen >= 80 && seoResult.descLen <= 160 ? 'ok' : 'warn'} />
            <SEORow label="OG title" value={seoResult.ogTitle} status={seoResult.ogTitle ? 'ok' : 'warn'} />
            <SEORow label="OG description" value={seoResult.ogDesc} status={seoResult.ogDesc ? 'ok' : 'warn'} />
            <SEORow label="OG image" value={seoResult.ogImage} status={seoResult.ogImage ? 'ok' : 'warn'} />
            <SEORow label="Canonical" value={seoResult.canonical} status={seoResult.canonical ? 'ok' : 'warn'} />
            <SEORow label="H1 sayısı" value={String(seoResult.h1Count)} hint={seoResult.h1Count === 1 ? '· ✓' : '· dikkat'} status={seoResult.h1Count === 1 ? 'ok' : 'warn'} />
            <SEORow label="JSON-LD blok" value={String(seoResult.ldJsonCount)} hint={seoResult.ldJsonCount > 0 ? '· ✓' : '· eksik'} status={seoResult.ldJsonCount > 0 ? 'ok' : 'warn'} />
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>⚙️ Sistem Bilgileri</h3>
        <div className="form-grid">
          <div>
            <div style={{ fontSize: '.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Tarayıcı</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{navigator.userAgent.split(' ').slice(-1)[0]}</div>
          </div>
          <div>
            <div style={{ fontSize: '.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Çözünürlük</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{window.innerWidth} × {window.innerHeight}</div>
          </div>
          <div>
            <div style={{ fontSize: '.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Zaman dilimi</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
          </div>
          <div>
            <div style={{ fontSize: '.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cihaz dili</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{navigator.language}</div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>🔗 Hızlı Linkler</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { label: '🌐 Siteyi Aç', href: '/', external: true },
            { label: '📜 Sitemap (XML)', href: '/sitemap.xml', external: true },
            { label: '📰 RSS Beslemesi', href: '/api/rss', external: true },
            { label: '🔍 Google Search Console', href: 'https://search.google.com/search-console', external: true },
            { label: '📊 Google Analytics', href: 'https://analytics.google.com', external: true },
            { label: '🎬 YouTube Studio', href: 'https://studio.youtube.com', external: true },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.external ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ justifyContent: 'flex-start' }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <PurgeLegacySection showToast={showToast} />
    </div>
  )
}

function PurgeLegacySection({ showToast }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const runDryRun = async () => {
    setLoading(true)
    try {
      const res = await purgeLegacyDryRunApi()
      setSummary(res)
    } catch (e) {
      showToast(`Dry run hatası: ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const applyPurge = async () => {
    setLoading(true)
    try {
      const res = await purgeLegacyApplyApi()
      showToast(`Temizlendi · blog: ${res.deleted?.blogs || 0}, partner: ${res.deleted?.partners || 0}, mesaj: ${res.deleted?.messages || 0}, içerik: ${res.deleted?.content || 0}`, 'success')
      setSummary(null)
      setConfirming(false)
    } catch (e) {
      showToast(`Silme hatası: ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-section" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
      <h3>🧹 Kade Media Veri Temizliği</h3>
      <p style={{ fontSize: '.82rem', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>
        DB'deki eski "Kade Media" / sosyal medya ajansı kayıtlarını tespit eder ve siler.
        Önce <strong>dry run</strong> ile ne silineceğini gör, sonra <strong>uygula</strong>.
        Site ayarlarındaki legacy metinler otomatik olarak Kadir Demir'e dönüştürülür.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-outline" onClick={runDryRun} disabled={loading}>
          {loading ? 'Tarama yapılıyor…' : '🔍 Tara (Dry Run)'}
        </button>
        {summary && !confirming && (
          <button className="btn btn-primary" onClick={() => setConfirming(true)} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
            🗑️ Şimdi Sil
          </button>
        )}
        {confirming && (
          <>
            <button className="btn btn-primary" onClick={applyPurge} disabled={loading} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
              {loading ? 'Siliniyor…' : '✓ Eminim, sil'}
            </button>
            <button className="btn btn-outline" onClick={() => setConfirming(false)} disabled={loading}>
              Vazgeç
            </button>
          </>
        )}
      </div>
      {summary && (
        <div style={{ marginTop: 14, padding: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.86rem' }}>
          <strong>Bulunan kayıtlar:</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Blog yazıları: <strong>{summary.blogs}</strong></li>
            <li>Partner kayıtları: <strong>{summary.partners}</strong></li>
            <li>Eski mesajlar: <strong>{summary.messages}</strong></li>
            <li>İçerik bölümleri (hero/stats): <strong>{summary.content || 0}</strong></li>
            <li>Analiz lead'leri (ajans): <strong>{summary.analyzerLeads || 0}</strong></li>
            <li>İş başvuruları (ajans): <strong>{summary.applications || 0}</strong></li>
            <li>Site ayarları (düzeltilecek alan): <strong>{summary.settingsHits?.length || 0}</strong></li>
          </ul>
          {summary.settingsHits?.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Düzeltilecek alanları gör</summary>
              <pre style={{ marginTop: 8, fontSize: '.76rem', overflow: 'auto', maxHeight: 200 }}>
                {JSON.stringify(summary.settingsHits, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function SEORow({ label, value, hint, status }) {
  const bgs = {
    ok: 'rgba(52, 211, 153, 0.08)',
    warn: 'rgba(251, 191, 36, 0.08)',
  }
  const borders = {
    ok: 'rgba(52, 211, 153, 0.25)',
    warn: 'rgba(251, 191, 36, 0.25)',
  }
  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: 8,
      background: bgs[status] || 'rgba(255,255,255,0.03)',
      border: `1px solid ${borders[status] || 'var(--border)'}`,
      display: 'grid',
      gridTemplateColumns: '140px 1fr auto',
      gap: 12,
      alignItems: 'center',
    }}>
      <strong style={{ color: 'var(--text-secondary)', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</strong>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? 'var(--text-primary)' : '#ef4444' }}>
        {value || '— EKSİK —'}
      </span>
      <span style={{ color: status === 'ok' ? '#34d399' : '#fbbf24', fontSize: '.78rem', fontWeight: 600 }}>{hint}</span>
    </div>
  )
}

// ───── ROOT ADMIN ─────
const TABS = [
  { id: 'dashboard', label: 'Panel', icon: HiOutlineHome },
  { id: 'kadelink-hero', label: 'Hero Kartı', icon: HiOutlineUser },
  { id: 'kadelink-links', label: 'KADELINK Linkleri', icon: HiOutlineLink },
  { id: 'kadelink-theme', label: 'Tema', icon: HiOutlineColorSwatch },
  { id: 'audit-log', label: 'Aktivite Günlüğü', icon: HiOutlineClipboardList },
  { id: 'analytics', label: 'Analitik', icon: HiOutlineChartBar },
  { id: 'social-stats', label: 'Sosyal Medya', icon: HiOutlineChartBar },
  { id: 'quick-tools', label: 'Hızlı Araçlar', icon: HiOutlineRefresh },
  { id: 'messages', label: 'Mesajlar', icon: HiOutlineMail },
  { id: 'blog', label: 'Blog', icon: HiOutlineNewspaper },
  { id: 'comments', label: 'Yorumlar', icon: HiOutlineChatAlt2 },
  { id: 'newsletter', label: 'Newsletter', icon: HiOutlineMail },
  { id: 'media', label: 'Medya', icon: HiOutlinePhotograph },
  { id: 'reminders', label: 'Hatırlatıcılar', icon: HiOutlineBell },
  { id: 'users', label: 'Kullanıcılar', icon: HiOutlineUsers },
  { id: 'backup', label: 'Yedekleme', icon: HiOutlineDatabase },
  { id: 'settings', label: 'Ayarlar', icon: HiOutlineCog },
]

export default function Admin({ initialAuth = false, initialUser = null }) {
  const [auth, setAuth] = useState(initialAuth)
  const [user, setUser] = useState(initialUser || (() => {
    try { return JSON.parse(sessionStorage.getItem('kade_admin_user') || 'null') } catch { return null }
  })())
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState({ blogs: 0, messages: 0, unreadMessages: 0, subscribers: 0 })
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [siteSettings, setSiteSettings] = useState({})
  const [ytData, setYtData] = useState({ channel: null, videos: [] })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const [blogs, msgs, subs, ss, yt] = await Promise.all([
        getBlogsApi().catch(() => []),
        getMessagesApi().catch(() => []),
        getNewsletterSubscribersApi().catch(() => []),
        getSiteSettingsApi().catch(() => null),
        getYouTubeVideosApi().catch(() => null),
      ])
      setStats({
        blogs: Array.isArray(blogs) ? blogs.length : 0,
        messages: Array.isArray(msgs) ? msgs.length : 0,
        unreadMessages: Array.isArray(msgs) ? msgs.filter(m => !m.read).length : 0,
        subscribers: Array.isArray(subs) ? subs.length : 0,
      })
      setUnreadCount(Array.isArray(msgs) ? msgs.filter(m => !m.read).length : 0)
      if (ss?.data) setSiteSettings(ss.data)
      if (yt) setYtData({ channel: yt.channel || null, videos: Array.isArray(yt.videos) ? yt.videos : [] })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { if (auth) loadStats() }, [auth, loadStats])

  const handleLogin = ({ user }) => { setAuth(true); setUser(user) }

  const handleLogout = async () => {
    try { await logoutApi() } catch { /* ignore */ }
    sessionStorage.removeItem('kade_admin_user')
    setAuth(false); setUser(null)
  }

  if (!auth) return <LoginScreen onLogin={handleLogin} />

  const renderTab = () => {
    let node = null
    switch (tab) {
      case 'dashboard': node = <DashboardSection stats={stats} onNavigate={setTab} settings={siteSettings} ytChannel={ytData.channel} />; break
      case 'kadelink-hero': node = <KadelinkHeroSection showToast={showToast} />; break
      case 'kadelink-links': node = <KadelinkLinksSection showToast={showToast} />; break
      case 'kadelink-theme': node = <KadelinkThemeSection showToast={showToast} />; break
      case 'audit-log': node = <AuditLogSection showToast={showToast} />; break
      case 'analytics': node = <AnalyticsSection />; break
      case 'social-stats': node = <SocialStatsSection settings={siteSettings} ytChannel={ytData.channel} ytVideos={ytData.videos} showToast={showToast} />; break
      case 'quick-tools': node = <QuickToolsSection showToast={showToast} />; break
      case 'messages': node = <MessagesSection showToast={showToast} onCountChange={setUnreadCount} />; break
      case 'blog': node = <BlogSection showToast={showToast} />; break
      case 'comments': node = <CommentsSection showToast={showToast} />; break
      case 'newsletter': node = <NewsletterSection showToast={showToast} />; break
      case 'media': node = <MediaSection showToast={showToast} />; break
      case 'reminders': node = <RemindersSection showToast={showToast} />; break
      case 'users': node = <UsersSection showToast={showToast} currentUser={user} />; break
      case 'backup': node = <BackupSection showToast={showToast} />; break
      case 'settings': node = <SettingsSection showToast={showToast} onChangePassword={() => setPwModal(true)} />; break
      default: node = null
    }
    return <SafeAdminSection sectionKey={tab}>{node}</SafeAdminSection>
  }

  return (
    <div className="admin-shell dark">
      <button className="sidebar-toggle-mobile" onClick={() => setSidebarOpen(s => !s)} aria-label="Menü">
        {sidebarOpen ? <HiOutlineX size={22} /> : <HiOutlineMenuAlt3 size={22} />}
      </button>

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">kadir<span>admin</span></div>
        <nav>
          {TABS.map(t => (
            <button key={t.id} className={`sidebar-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => { setTab(t.id); setSidebarOpen(false) }}>
              <t.icon size={18} />
              <span>{t.label}</span>
              {t.id === 'messages' && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span>{user?.username}</span>
            <small>{user?.role}</small>
          </div>
          <button className="sidebar-item" onClick={handleLogout}>
            <HiOutlineLogout size={18} /> <span>Çıkış</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {renderTab()}
      </main>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {pwModal && <ChangePasswordModal onClose={() => setPwModal(false)} showToast={showToast} />}
    </div>
  )
}

// ─── Per-section error boundary — bir bölüm patlasa bile admin shell ayakta kalsın
class SafeAdminSection extends Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) {
    console.error(`[Admin section "${this.props.sectionKey}"] crashed:`, error, info)
  }
  componentDidUpdate(prev) {
    if (prev.sectionKey !== this.props.sectionKey && this.state.hasError) {
      this.setState({ hasError: false, error: null })
    }
  }
  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env?.DEV
      const msg = this.state.error?.message || String(this.state.error || 'Unknown error')
      return (
        <div style={{ padding: 28 }}>
          <h2 style={{ marginTop: 0 }}>Bu bölüm şu an açılamadı</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            "<strong>{this.props.sectionKey}</strong>" bölümünde bir hata oluştu. Diğer bölümlere yan menüden geçebilirsin.
          </p>
          {isDev && (
            <details style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <summary style={{ cursor: 'pointer', color: '#f59e0b', fontWeight: 600 }}>{msg}</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '.78rem', marginTop: 8 }}>{this.state.error?.stack}</pre>
            </details>
          )}
          <button
            className="btn btn-outline"
            style={{ marginTop: 14 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tekrar dene
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
