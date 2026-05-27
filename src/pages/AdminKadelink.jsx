import { useEffect, useMemo, useState } from 'react'
import {
  HiOutlineSave, HiOutlinePlus, HiOutlineTrash, HiOutlineArrowUp,
  HiOutlineArrowDown, HiOutlineCheck, HiOutlineX, HiOutlineRefresh,
  HiOutlineClipboardList, HiOutlineColorSwatch,
} from 'react-icons/hi'
import {
  getKadelinkHeroApi, updateKadelinkHeroApi,
  getKadelinkLinksApi, updateKadelinkLinksApi,
  getKadelinkThemeApi, updateKadelinkThemeApi,
  getAuditLogApi, clearAuditLogApi,
} from '../api'
import './AdminKadelink.css'

/* ─────────────────────────────────────────────────────────────────
   HERO KARTI — portre, kullanıcı adı, alt başlık, durum
   ───────────────────────────────────────────────────────────────── */
const DEFAULT_HERO = {
  portrait: '/kadelink-portrait.png',
  handle: '@kadirardademir',
  tagline: 'İçerik Üreticisi',
  taglineEn: 'Content Creator',
  taglineDe: 'Content Creator',
  statusLabel: 'Aktif',
  statusLabelEn: 'Online',
  showStatus: true,
  showVerified: true,
}

export function KadelinkHeroSection({ showToast }) {
  const [hero, setHero] = useState(DEFAULT_HERO)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getKadelinkHeroApi()
      .then((doc) => {
        const data = doc?.data || {}
        setHero({ ...DEFAULT_HERO, ...data })
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => setLoading(false))
  }, [])

  const update = (k, v) => setHero((h) => ({ ...h, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateKadelinkHeroApi(hero)
      showToast('Hero kartı kaydedildi', 'success')
    } catch (err) {
      showToast(err.message || 'Kaydetme başarısız', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading">Yükleniyor…</div>

  return (
    <div className="admin-section">
      <header className="admin-section-head">
        <div>
          <h1>Hero Kartı</h1>
          <p>Anasayfanın KADELINK kartında görünen portre, isim ve alt bilgileri.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <HiOutlineSave size={16} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </header>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 className="admin-card-title">Görsel & Kimlik</h3>
          <label className="form-group">
            <span>Portre URL</span>
            <input
              type="text"
              value={hero.portrait}
              onChange={(e) => update('portrait', e.target.value)}
              placeholder="/kadelink-portrait.png"
            />
            <small>Tam URL veya public/ altındaki dosya yolu.</small>
          </label>
          <label className="form-group">
            <span>Kullanıcı adı (handle)</span>
            <input
              type="text"
              value={hero.handle}
              onChange={(e) => update('handle', e.target.value)}
              placeholder="@kadirardademir"
            />
          </label>
          <label className="form-group inline">
            <input
              type="checkbox"
              checked={!!hero.showVerified}
              onChange={(e) => update('showVerified', e.target.checked)}
            />
            <span>Doğrulanmış rozeti göster</span>
          </label>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Alt Başlık (3 dil)</h3>
          <label className="form-group">
            <span>Türkçe</span>
            <input
              type="text"
              value={hero.tagline}
              onChange={(e) => update('tagline', e.target.value)}
            />
          </label>
          <label className="form-group">
            <span>İngilizce</span>
            <input
              type="text"
              value={hero.taglineEn}
              onChange={(e) => update('taglineEn', e.target.value)}
            />
          </label>
          <label className="form-group">
            <span>Almanca</span>
            <input
              type="text"
              value={hero.taglineDe}
              onChange={(e) => update('taglineDe', e.target.value)}
            />
          </label>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Durum Etiketi</h3>
          <label className="form-group inline">
            <input
              type="checkbox"
              checked={!!hero.showStatus}
              onChange={(e) => update('showStatus', e.target.checked)}
            />
            <span>Yeşil noktalı durum etiketini göster</span>
          </label>
          <label className="form-group">
            <span>Etiket (TR)</span>
            <input
              type="text"
              value={hero.statusLabel}
              onChange={(e) => update('statusLabel', e.target.value)}
              placeholder="Aktif"
            />
          </label>
          <label className="form-group">
            <span>Etiket (EN)</span>
            <input
              type="text"
              value={hero.statusLabelEn}
              onChange={(e) => update('statusLabelEn', e.target.value)}
              placeholder="Online"
            />
          </label>
        </div>

        <div className="admin-card kd-preview-card">
          <h3 className="admin-card-title">Önizleme</h3>
          <div className="kd-preview-shell">
            <img src={hero.portrait} alt="Önizleme" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <div className="kd-preview-meta">
              <strong>{hero.handle}{hero.showVerified ? ' ✓' : ''}</strong>
              <span>{hero.tagline}</span>
              {hero.showStatus && <em>● {hero.statusLabel}</em>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   KADELINK LİNKLERİ — CRUD + reorder
   ───────────────────────────────────────────────────────────────── */
const LINK_PRESETS = [
  { id: 'instagram', label: 'Instagram', icon: 'instagram' },
  { id: 'youtube', label: 'YouTube', icon: 'youtube' },
  { id: 'tiktok', label: 'TikTok', icon: 'tiktok' },
  { id: 'x', label: 'X', icon: 'x' },
  { id: 'twitch', label: 'Twitch', icon: 'twitch' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { id: 'email', label: 'İletişim', icon: 'email' },
  { id: 'website', label: 'Website', icon: 'website' },
]

function newLinkRow() {
  return {
    id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label: '',
    url: '',
    icon: 'website',
    enabled: true,
  }
}

export function KadelinkLinksSection({ showToast }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getKadelinkLinksApi()
      .then((doc) => {
        const arr = Array.isArray(doc?.data?.links) ? doc.data.links : []
        setLinks(arr)
      })
      .catch(() => { /* empty */ })
      .finally(() => setLoading(false))
  }, [])

  const updateLink = (id, patch) => {
    setLinks((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  const removeLink = (id) => setLinks((arr) => arr.filter((l) => l.id !== id))
  const addLink = (preset) => {
    const row = newLinkRow()
    if (preset) {
      row.label = preset.label
      row.icon = preset.icon
    }
    setLinks((arr) => [...arr, row])
  }
  const move = (idx, dir) => {
    setLinks((arr) => {
      const next = [...arr]
      const j = idx + dir
      if (j < 0 || j >= next.length) return arr
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const clean = links
        .filter((l) => l.label && l.url)
        .map(({ id, label, url, icon, enabled }) => ({
          id, label: label.slice(0, 80), url: url.slice(0, 500),
          icon: icon || 'website', enabled: enabled !== false,
        }))
      await updateKadelinkLinksApi({ links: clean })
      setLinks(clean)
      showToast(`${clean.length} link kaydedildi`, 'success')
    } catch (err) {
      showToast(err.message || 'Kaydetme başarısız', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading">Yükleniyor…</div>

  return (
    <div className="admin-section">
      <header className="admin-section-head">
        <div>
          <h1>KADELINK Linkleri</h1>
          <p>Anasayfadaki pill linkleri yönet — sırala, etkinleştir, sil veya yeni özel link ekle.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <HiOutlineSave size={16} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </header>

      <div className="admin-card">
        <h3 className="admin-card-title">Hızlı ekle</h3>
        <div className="preset-row">
          {LINK_PRESETS.map((p) => (
            <button key={p.id} className="preset-chip" onClick={() => addLink(p)}>
              <HiOutlinePlus size={14} /> {p.label}
            </button>
          ))}
          <button className="preset-chip preset-chip-custom" onClick={() => addLink(null)}>
            <HiOutlinePlus size={14} /> Özel link
          </button>
        </div>
      </div>

      <div className="links-list">
        {links.length === 0 && (
          <div className="empty-state">Henüz link eklenmedi. Yukarıdan hızlı ekle.</div>
        )}
        {links.map((link, idx) => (
          <div key={link.id} className={`link-row ${link.enabled === false ? 'is-disabled' : ''}`}>
            <div className="link-row-order">
              <button
                className="icon-btn"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                aria-label="Yukarı taşı"
              >
                <HiOutlineArrowUp size={14} />
              </button>
              <span className="link-row-index">{idx + 1}</span>
              <button
                className="icon-btn"
                onClick={() => move(idx, 1)}
                disabled={idx === links.length - 1}
                aria-label="Aşağı taşı"
              >
                <HiOutlineArrowDown size={14} />
              </button>
            </div>

            <div className="link-row-fields">
              <input
                type="text"
                placeholder="Etiket (örn. Instagram)"
                value={link.label}
                onChange={(e) => updateLink(link.id, { label: e.target.value })}
              />
              <input
                type="text"
                placeholder="URL veya mailto:"
                value={link.url}
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
              />
              <select
                value={link.icon || 'website'}
                onChange={(e) => updateLink(link.id, { icon: e.target.value })}
              >
                {LINK_PRESETS.map((p) => (
                  <option key={p.id} value={p.icon}>{p.label}</option>
                ))}
                <option value="website">Diğer / Website</option>
              </select>
            </div>

            <div className="link-row-actions">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={link.enabled !== false}
                  onChange={(e) => updateLink(link.id, { enabled: e.target.checked })}
                />
                <span>{link.enabled === false ? 'Pasif' : 'Aktif'}</span>
              </label>
              <button className="icon-btn icon-btn-danger" onClick={() => removeLink(link.id)} aria-label="Sil">
                <HiOutlineTrash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   TEMA — default mode + accent color, canlı önizleme
   ───────────────────────────────────────────────────────────────── */
const DEFAULT_THEME = {
  defaultMode: 'dark',
  accent: '#c98a3b',
  accentLight: '#e0a661',
  accentDeep: '#a06d2a',
  enableLightSwitch: true,
}

export function KadelinkThemeSection({ showToast }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getKadelinkThemeApi()
      .then((doc) => setTheme({ ...DEFAULT_THEME, ...(doc?.data || {}) }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const update = (k, v) => setTheme((t) => ({ ...t, [k]: v }))

  const previewVars = useMemo(() => ({
    '--preview-accent': theme.accent,
    '--preview-accent-light': theme.accentLight,
    '--preview-accent-deep': theme.accentDeep,
  }), [theme])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateKadelinkThemeApi(theme)
      showToast('Tema ayarları kaydedildi', 'success')
    } catch (err) {
      showToast(err.message || 'Kaydetme başarısız', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading">Yükleniyor…</div>

  return (
    <div className="admin-section">
      <header className="admin-section-head">
        <div>
          <h1>Tema</h1>
          <p>Site geneli varsayılan tema modu ve KADELINK amber accent rengini ayarla.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <HiOutlineSave size={16} /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </header>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 className="admin-card-title">Tema modu</h3>
          <div className="radio-row">
            <label className={`radio-card ${theme.defaultMode === 'dark' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="theme-mode"
                value="dark"
                checked={theme.defaultMode === 'dark'}
                onChange={() => update('defaultMode', 'dark')}
              />
              <strong>Dark</strong>
              <small>KADELINK varsayılanı</small>
            </label>
            <label className={`radio-card ${theme.defaultMode === 'light' ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="theme-mode"
                value="light"
                checked={theme.defaultMode === 'light'}
                onChange={() => update('defaultMode', 'light')}
              />
              <strong>Light</strong>
              <small>Sıcak cream</small>
            </label>
          </div>
          <label className="form-group inline">
            <input
              type="checkbox"
              checked={!!theme.enableLightSwitch}
              onChange={(e) => update('enableLightSwitch', e.target.checked)}
            />
            <span>Tema değiştirme butonunu navbar'da göster</span>
          </label>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Accent renkleri</h3>
          <label className="form-group color-group">
            <span>Ana accent</span>
            <div className="color-input-wrap">
              <input type="color" value={theme.accent} onChange={(e) => update('accent', e.target.value)} />
              <input type="text" value={theme.accent} onChange={(e) => update('accent', e.target.value)} />
            </div>
          </label>
          <label className="form-group color-group">
            <span>Açık ton (hover)</span>
            <div className="color-input-wrap">
              <input type="color" value={theme.accentLight} onChange={(e) => update('accentLight', e.target.value)} />
              <input type="text" value={theme.accentLight} onChange={(e) => update('accentLight', e.target.value)} />
            </div>
          </label>
          <label className="form-group color-group">
            <span>Koyu ton (deep)</span>
            <div className="color-input-wrap">
              <input type="color" value={theme.accentDeep} onChange={(e) => update('accentDeep', e.target.value)} />
              <input type="text" value={theme.accentDeep} onChange={(e) => update('accentDeep', e.target.value)} />
            </div>
          </label>
        </div>

        <div className="admin-card theme-preview-card" style={previewVars}>
          <h3 className="admin-card-title">Canlı önizleme</h3>
          <div className="theme-preview">
            <div className="theme-preview-card-pill">
              <span className="theme-preview-dot" />
              <span>Aktif</span>
            </div>
            <button className="theme-preview-btn">Bana Ulaş</button>
            <div className="theme-preview-link">
              <span className="theme-preview-icon" />
              <span>Instagram</span>
              <span className="theme-preview-meta">⋮</span>
            </div>
          </div>
          <small>Kaydedince anasayfa hero'sunda + tüm site CSS değişkenlerinde uygulanır.</small>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   AKTİVİTE GÜNLÜĞÜ
   ───────────────────────────────────────────────────────────────── */
function timeAgo(d) {
  if (!d) return ''
  const date = new Date(d)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)} sn önce`
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`
  return date.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
}

const ACTION_META = {
  'auth:login': { label: 'Giriş', tag: 'auth' },
  'auth:logout': { label: 'Çıkış', tag: 'auth' },
  'blog:create': { label: 'Blog oluştur', tag: 'blog' },
  'blog:update': { label: 'Blog güncelle', tag: 'blog' },
  'blog:delete': { label: 'Blog sil', tag: 'blog' },
  'content:update': { label: 'Ayar güncelle', tag: 'settings' },
  'audit-log:clear': { label: 'Log temizle', tag: 'admin' },
}

export function AuditLogSection({ showToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [clearing, setClearing] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await getAuditLogApi(500)
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast(err.message || 'Log yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleClear = async () => {
    if (!confirm('Tüm aktivite günlüğü silinecek. Emin misin?')) return
    setClearing(true)
    try {
      await clearAuditLogApi()
      showToast('Günlük temizlendi', 'success')
      await refresh()
    } catch (err) {
      showToast(err.message || 'Temizleme başarısız', 'error')
    } finally {
      setClearing(false)
    }
  }

  const tags = useMemo(() => {
    const s = new Set()
    items.forEach((i) => { const m = ACTION_META[i.action]; if (m) s.add(m.tag) })
    return ['all', ...Array.from(s).sort()]
  }, [items])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => (ACTION_META[i.action]?.tag || 'other') === filter)
  }, [items, filter])

  return (
    <div className="admin-section">
      <header className="admin-section-head">
        <div>
          <h1>Aktivite Günlüğü</h1>
          <p>Admin panelinde yapılan kritik işlemlerin kaydı.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-outline" onClick={refresh} disabled={loading}>
            <HiOutlineRefresh size={16} /> Yenile
          </button>
          <button className="btn btn-danger" onClick={handleClear} disabled={clearing || items.length === 0}>
            <HiOutlineTrash size={16} /> {clearing ? 'Temizleniyor…' : 'Tümünü Sil'}
          </button>
        </div>
      </header>

      <div className="audit-filter-bar">
        {tags.map((tg) => (
          <button
            key={tg}
            className={`filter-chip ${filter === tg ? 'is-active' : ''}`}
            onClick={() => setFilter(tg)}
          >
            {tg === 'all' ? 'Tümü' : tg}
          </button>
        ))}
        <span className="audit-count">{filtered.length} kayıt</span>
      </div>

      {loading ? (
        <div className="admin-loading">Yükleniyor…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Kayıt yok.</div>
      ) : (
        <ul className="audit-list">
          {filtered.map((it) => {
            const meta = ACTION_META[it.action] || { label: it.action, tag: 'other' }
            return (
              <li key={it._id} className="audit-row">
                <span className={`audit-tag tag-${meta.tag}`}>{meta.tag}</span>
                <div className="audit-body">
                  <strong>{meta.label}</strong>
                  {it.target && <code>{it.target}</code>}
                  {it.details && <p>{it.details}</p>}
                </div>
                <div className="audit-meta">
                  <span className="audit-actor">{it.actor || 'system'}</span>
                  <span className="audit-time" title={new Date(it.createdAt).toLocaleString('tr-TR')}>
                    {timeAgo(it.createdAt)}
                  </span>
                  {it.ip && <span className="audit-ip">{it.ip}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
