import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useInView } from 'framer-motion'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { getYouTubeVideosApi, getSocialStatsApi, sendContactApi } from '../api'
import './Home.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseStat(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    if (value >= 1e9) return { num: +(value / 1e9).toFixed(1), suffix: 'B' }
    if (value >= 1e6) return { num: +(value / 1e6).toFixed(1), suffix: 'M' }
    if (value >= 1e3) return { num: +(value / 1e3).toFixed(1), suffix: 'K' }
    return { num: value, suffix: '' }
  }
  const m = String(value).trim().match(/^([\d.,]+)\s*([KMB])?/i)
  if (!m) return null
  const num = parseFloat(m[1].replace(/,/g, ''))
  if (!Number.isFinite(num)) return null
  return { num, suffix: (m[2] || '').toUpperCase() }
}

function formatViews(n) {
  const parsed = parseStat(n)
  if (!parsed) return null
  return `${parsed.num}${parsed.suffix}`
}

// ── Count-up — sayıyı görünür olunca 0'dan hedefe animasyonla saydırır ──
function CountUp({ value, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [out, setOut] = useState(null)

  const parts = useMemo(() => {
    const s = String(value ?? '')
    const m = s.match(/[\d.]+/)
    if (!m) return null
    const target = parseFloat(m[0])
    if (!Number.isFinite(target)) return null
    const decimals = (m[0].split('.')[1] || '').length
    return { target, decimals, prefix: s.slice(0, m.index), suffix: s.slice(m.index + m[0].length) }
  }, [value])

  useEffect(() => {
    if (!inView || !parts) return
    let raf
    const start = performance.now()
    const dur = 1300
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setOut((parts.target * eased).toFixed(parts.decimals))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, parts])

  if (!parts) return <span ref={ref} className={className}>{value}</span>
  return (
    <span ref={ref} className={className}>
      {parts.prefix}{out ?? '0'}{parts.suffix}
    </span>
  )
}

// ── Manyetik buton — imleci hafifçe takip eder ──
function Magnetic({ children, className, href, to, onClick }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 22 })
  const sy = useSpring(y, { stiffness: 220, damping: 22 })
  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.3)
    y.set((e.clientY - r.top - r.height / 2) * 0.3)
  }
  const onLeave = () => { x.set(0); y.set(0) }
  if (to) {
    return (
      <motion.span style={{ x: sx, y: sy, display: 'inline-flex' }} onMouseMove={onMove} onMouseLeave={onLeave}>
        <Link className={className} to={to} onClick={onClick}>{children}</Link>
      </motion.span>
    )
  }
  return (
    <motion.a ref={ref} className={className} href={href} onClick={onClick}
      style={{ x: sx, y: sy }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.a>
  )
}

const heroStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
const heroItem = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export default function Home() {
  const rootRef = useRef(null)
  const { settings } = useSiteSettings()
  const [videos, setVideos] = useState([])
  const [socialStats, setSocialStats] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' })
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getYouTubeVideosApi().then((res) => {
      if (Array.isArray(res?.videos)) setVideos(res.videos)
    }).catch(() => {})
    getSocialStatsApi().then((d) => setSocialStats(d)).catch(() => setSocialStats(null))
  }, [])

  const yt = socialStats?.youtube
  const ig = socialStats?.instagram
  const tt = socialStats?.tiktok
  const years = settings.statsActiveYears || '14'

  // ── Hero meta (3 kutu): canlı veriler önce, yoksa site verileriyle doldur ──
  const heroMeta = useMemo(() => {
    const out = [{ b: `${years}`, s: 'YIL İÇERİK' }]
    const subs = formatViews(yt?.followers || settings.statsYoutubeSubs)
    if (subs) out.push({ b: subs, s: 'YOUTUBE ABONE' })
    const tv = formatViews(yt?.views || settings.statsTotalViews)
    if (tv) out.push({ b: tv, s: 'TOPLAM İZLENME' })
    const fill = [{ b: '1.4M+', s: 'AYLIK ERİŞİM' }, { b: '%72', s: 'TAMAMLAMA' }]
    while (out.length < 3 && fill.length) out.push(fill.shift())
    return out.slice(0, 3)
  }, [yt, settings, years])

  // ── Öne çıkan video — admin seçimi varsa o, yoksa en yeni ──
  const featured = useMemo(() => {
    const withId = videos.filter((v) => v?.youtubeId)
    if (!withId.length) return null
    if (settings.featuredVideoId) {
      const picked = withId.find((v) => v.youtubeId === settings.featuredVideoId)
      if (picked) return picked
    }
    return [...withId].sort((a, b) =>
      new Date(b.publishedAt || b.date || 0) - new Date(a.publishedAt || a.date || 0))[0]
  }, [videos, settings.featuredVideoId])

  // ── Videolar listesi (Work) — yoksa içerik türleri ──
  const contentTypes = [
    { label: 'Vlog', cat: 'Günlük' },
    { label: 'Oyun', cat: 'Gaming' },
    { label: 'Canlı yayın', cat: 'Live' },
    { label: 'Kurgu', cat: 'Editing' },
    { label: 'Thumbnail', cat: 'Tasarım' },
    { label: 'Podcast', cat: 'Sohbet' },
  ]
  const hasVideos = videos.length > 0
  const workItems = hasVideos
    ? videos.slice(0, 6).map((v) => ({
        name: v.title,
        cat: formatViews(v.views) ? `${formatViews(v.views)} izlenme` : 'YouTube',
        href: `https://www.youtube.com/watch?v=${v.youtubeId}`,
      }))
    : contentTypes.map((c) => ({ name: c.label, cat: c.cat, to: '/videolar' }))

  // ── Ne yapıyorum (4 disiplin) ──
  const disciplines = [
    { ic: '◧', h: 'Uzun videolar', p: 'Oturup yeniden izleyebileceğim şeyler. Dolgu yok, tıklama tuzağı yok — sadece vaktine değer içerik.', chips: ['Vlog', 'Anlatı', 'Kurgu', 'Hikâye'] },
    { ic: '✳', h: 'Oyun & canlı yayın', p: 'Şovu ben değil sohbet yönetiyor. Bazen kazanıyoruz, çoğunlukla yeniliyoruz, her zaman iyi vakit.', chips: ['Gaming', 'Live', 'Topluluk', 'Sohbet'] },
    { ic: '◩', h: 'Vlog & günlük', p: 'Kameranın arkasındaki gerçek hayat — şehir, setup ve yolda olan her şey. Filtresiz, dürüst.', chips: ['İstanbul', 'Günlük', 'Setup', 'Yol'] },
    { ic: '▤', h: 'Marka işleri', p: 'Gerçekten satın alacağım şeyler. İçerik tarzıma uymuyorsa geçiyorum — istisna yok.', chips: ['Entegrasyon', 'Dedicated', 'Shorts', 'Sponsorluk'] },
  ]

  // ── Yolculuk (Process) — story timeline ──
  const story = [
    { step: '2011', h: 'İlk video', p: 'Telefon kamerasıyla ilk videoyu yükledim. Senaryo yok, plan yok, ne yaptığımı bilmiyordum. Hayatımın en iyi kararı.', tags: ['İlk upload', 'Telefon kamerası'] },
    { step: '2015', h: 'Oyun dönemi', p: 'Oyun üzerinden gerçek insanlarla bağlantı kurdum. Yorum bölümü artık sadece yorum değil, gerçek bir topluluktu.', tags: ['Gaming', 'Topluluk'] },
    { step: '2020', h: 'Tam zamanlı', p: 'Atladım. Günlük işi bıraktım, tamamen buraya döndüm. Korkunçtu ama yaptığım en iyi şeydi.', tags: ['Full-time', 'Karar'] },
    { step: 'Şimdi', h: `${years}. yıl`, p: 'Hâlâ buradayım, hâlâ bir şeyler deniyorum. Yeni formatlar, gelişigüzel deneyler, bir şekilde hâlâ burada olan izleyici.', tags: ['Devam', 'Yeni formatlar'] },
  ]

  // ── Rakamlar (Results) ──
  const bigStats = useMemo(() => {
    const out = []
    const subs = formatViews(yt?.followers || settings.statsYoutubeSubs)
    if (subs) out.push({ value: subs, label: 'YOUTUBE ABONE' })
    const tv = formatViews(yt?.views || settings.statsTotalViews)
    if (tv) out.push({ value: tv, label: 'TOPLAM İZLENME' })
    const igf = formatViews(ig?.followers || settings.statsInstagramFollowers)
    if (igf) out.push({ value: igf, label: 'INSTAGRAM TAKİPÇİ' })
    const fill = [
      { value: `${years}`, label: 'YIL İÇERİK' },
      { value: '1.4M+', label: 'AYLIK ERİŞİM' },
      { value: '%72', label: 'İZLEYİCİ TAMAMLAMA' },
    ]
    while (out.length < 3 && fill.length) out.push(fill.shift())
    return out.slice(0, 3)
  }, [yt, ig, settings, years])

  const audience = settings.mediaKitAudience || []
  const regions = (settings.mediaKitRegions || []).slice(0, 3).map((r) => ({
    name: r.name, p: parseFloat(String(r.share).replace(/[^\d.]/g, '')) || 0,
  }))

  // ── SSS (FAQ) ──
  const faqs = [
    { q: 'Yeni video ne zaman çıkıyor?', a: 'Haftada 1-2, genelde öyle. Bazen daha fazla, bazen daha az — izlemeye değmeyecekse geciktirmeyi tercih ederim.' },
    { q: 'İş birliği yapıyor musun?', a: 'Yapıyorum ama her teklifi almıyorum. Uyanı alıyorum, uymayanı geçiyorum. Yazmaktan çekinme, bakarız.' },
    { q: 'Bütün linkler nerede?', a: 'Hepsi links sayfasında — sosyal medya, iletişim, her şey tek yerde.' },
    { q: 'Hangi içerikleri üretiyorsun?', a: 'Uzun videolar, oyun ve canlı yayınlar, vlog ve ara ara marka iş birlikleri. Hepsi YouTube ve sosyal hesaplarda.' },
    { q: 'Nereden yayın yapıyorsun?', a: 'İstanbul. 2011\'den beri buradayım, her şeyi burada çekip kurguluyorum.' },
  ]

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.topic.trim() || 'Ana sayfa mesajı',
      service: form.topic.trim() || 'Ana sayfa mesajı',
      message: form.message.trim(),
      source: 'home-bana-yaz',
    }
    if (payload.name.length < 2 || !EMAIL_RE.test(payload.email) || payload.message.length < 10) {
      setStatus({ type: 'error', text: 'Ad, geçerli e-posta ve en az 10 karakterlik mesaj gerekli.' })
      return
    }
    setSending(true)
    setStatus(null)
    try {
      await sendContactApi(payload)
      setStatus({ type: 'success', text: 'Aldım — en kısa sürede dönüş yapacağım.' })
      setForm({ name: '', email: '', topic: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', text: err?.message || 'Mesaj gönderilemedi.' })
    } finally {
      setSending(false)
    }
  }

  // ── Tasarımın kendi davranışları: nav scroll, reveal, bar, faq, chip ──
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    document.title = 'Kadir Demir — İçerik Üreticisi'

    const nav = root.querySelector('#nav')
    const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    onScroll()

    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { threshold: 0.12 })
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el))

    const barIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.fill').forEach((f) => { f.style.width = f.dataset.w + '%' })
        barIO.unobserve(e.target)
      }
    }), { threshold: 0.3 })
    root.querySelectorAll('.res-panel').forEach((el) => barIO.observe(el))

    const faqHandlers = []
    root.querySelectorAll('.faq-q').forEach((q) => {
      const handler = () => {
        const item = q.parentElement
        const open = item.classList.contains('open')
        root.querySelectorAll('.faq-item').forEach((i) => {
          i.classList.remove('open')
          i.querySelector('.faq-a').style.maxHeight = null
        })
        if (!open) {
          item.classList.add('open')
          const a = item.querySelector('.faq-a')
          a.style.maxHeight = a.scrollHeight + 'px'
        }
      }
      q.addEventListener('click', handler)
      faqHandlers.push([q, handler])
    })

    const chipHandlers = []
    root.querySelectorAll('#topicRow .chip').forEach((c) => {
      const handler = () => {
        root.querySelectorAll('#topicRow .chip').forEach((x) => x.classList.remove('active'))
        c.classList.add('active')
        setForm((f) => ({ ...f, topic: c.dataset.topic }))
      }
      c.addEventListener('click', handler)
      chipHandlers.push([c, handler])
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      barIO.disconnect()
      faqHandlers.forEach(([el, h]) => el.removeEventListener('click', h))
      chipHandlers.forEach(([el, h]) => el.removeEventListener('click', h))
    }
  }, [])

  const topics = ['İş birliği', 'Soru', 'Geri bildirim', 'Diğer']

  return (
    <div className="kdstudio" ref={rootRef}>
      {/* NAV */}
      <nav id="nav">
        <div className="nav-inner">
          <a className="brand" href="#top">
            <span className="logo"><span>k</span></span>
            Kadir Demir
          </a>
          <div className="nav-links">
            <a href="#work">Videolar</a>
            <a href="#services">İçerik</a>
            <a href="#process">Yolculuk</a>
            <a href="#results">Rakamlar</a>
            <a href="#faq">SSS</a>
          </div>
          <div className="nav-right">
            <span className="dot"></span>
            <a className="btn btn-primary" href="#contact">Bana yaz</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="wrap hero-inner">
          <motion.div initial="hidden" animate="visible" variants={heroStagger}>
            <motion.div variants={heroItem} className="eyebrow" style={{ marginBottom: '26px' }}>İçerik üreticisi — İstanbul</motion.div>
            <motion.h1 variants={heroItem} className="hero-h">{years} yıldır <span className="serif">video</span><br /><span className="acc serif">çekiyorum.</span><br />Hâlâ buradayım.</motion.h1>
            <motion.p variants={heroItem} className="hero-sub">2011'de bir laptopla, sıfır takipçiyle başladım. {years} yıl sonra hâlâ aynı yerdeyim — aynı merak, daha iyi ekipman. İzlemeye değer bulmadığımı çekmiyorum.</motion.p>
            <motion.div variants={heroItem} className="hero-cta">
              <Magnetic className="btn btn-primary" href="#work">Videoları gör →</Magnetic>
              <Magnetic className="btn btn-ghost" href="#contact">Bana yaz</Magnetic>
            </motion.div>
            <motion.div variants={heroItem} className="hero-meta">
              {heroMeta.map((m, i) => (
                <div className="m" key={i}><b><CountUp value={m.b} /></b><span>{m.s}</span></div>
              ))}
            </motion.div>
          </motion.div>
          <motion.div
            className={`hero-visual${featured ? ' has-media' : ''}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={featured ? () => window.open(`https://www.youtube.com/watch?v=${featured.youtubeId}`, '_blank') : undefined}
          >
            {featured ? (
              <>
                <img className="hero-media" src={featured.thumbnail || `https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg`} alt={featured.title} loading="lazy" />
                <div className="hero-play"><b>▶</b></div>
                <div className="ph-tag">{featured.title}</div>
              </>
            ) : (
              <>
                <div className="orbit">
                  <div className="ring r2"></div>
                  <div className="ring"></div>
                  <div className="rock"></div>
                </div>
                <div className="ph-tag">öne çıkan video — yükleniyor</div>
              </>
            )}
          </motion.div>
        </div>
      </header>

      {/* VIDEOLAR */}
      <section className="sec-pad" id="work">
        <div className="wrap">
          <div className="sec-head reveal">
            <h2>{hasVideos ? <>Son <span className="serif">videolar.</span></> : <>Ne <span className="serif">üretiyorum.</span></>}</h2>
            <p>{hasVideos ? "YouTube'da en yeni yüklediğim videolar." : 'Kanalda düzenli olarak ürettiğim içerik türleri.'}</p>
          </div>
          <div className="built reveal">
            {workItems.map((w, i) => {
              const inner = (
                <>
                  <div className="idx">{String(i + 1).padStart(2, '0')}</div>
                  <div className="name">{w.name}</div>
                  <div className="cat">{w.cat}</div>
                  <div className="arrow">↗</div>
                </>
              )
              return w.to ? (
                <Link className="built-row" to={w.to} key={i}>{inner}</Link>
              ) : (
                <a className="built-row" href={w.href} target="_blank" rel="noreferrer" key={i}>{inner}</a>
              )
            })}
          </div>
        </div>
      </section>

      {/* İÇERİK / NE YAPIYORUM */}
      <section className="sec-pad" id="services" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <h2>Ne <span className="serif">yapıyorum.</span></h2>
            <p>Kameranın önünde ve arkasında — hepsi tek kişilik, dürüst bir üretim.</p>
          </div>
          <div className="disc-grid">
            {disciplines.map((d, i) => (
              <div className="disc reveal" key={i}>
                <div className="disc-ic">{d.ic}</div>
                <h3>{d.h}</h3>
                <p>{d.p}</p>
                <div className="chips">{d.chips.map((c) => <span className="chip" key={c}>{c}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YOLCULUK */}
      <section className="sec-pad" id="process">
        <div className="wrap">
          <div className="sec-head reveal">
            <h2>İlk videodan <span className="serif">bugüne.</span></h2>
            <p>2011'de bir telefonla başlayan yolun bugüne kadar gelen kısa hikâyesi.</p>
          </div>
          <div className="proc">
            {[
              <svg className="wire" viewBox="0 0 100 100" fill="none" stroke="rgba(212,148,63,.55)" strokeWidth=".6" key="s1"><circle cx="50" cy="50" r="34"></circle><path d="M16 50h68M50 16v68M26 26l48 48M74 26L26 74"></path><circle cx="50" cy="50" r="14" stroke="rgba(232,180,104,.9)"></circle></svg>,
              <svg className="wire" viewBox="0 0 100 100" fill="none" stroke="rgba(212,148,63,.55)" strokeWidth=".6" key="s2"><path d="M50 8L78 78H22Z"></path><path d="M50 8v70M30 56h40M36 68h28"></path><circle cx="50" cy="34" r="7" stroke="rgba(232,180,104,.9)"></circle></svg>,
              <svg className="wire" viewBox="0 0 100 100" fill="none" stroke="rgba(212,148,63,.55)" strokeWidth=".6" key="s3"><path d="M50 14L82 32v36L50 86 18 68V32Z"></path><path d="M50 14v36l32-18M50 50L18 32M50 50v36"></path></svg>,
              <svg className="wire" viewBox="0 0 100 100" fill="none" stroke="rgba(212,148,63,.55)" strokeWidth=".6" key="s4"><path d="M50 8c12 8 18 22 18 38 0 10-4 18-18 30-14-12-18-20-18-30 0-16 6-30 18-38Z"></path><circle cx="50" cy="40" r="8" stroke="rgba(232,180,104,.9)"></circle><path d="M38 78l-8 14M62 78l8 14M50 84v12"></path></svg>,
            ].map((svg, i) => (
              <div className="proc-row reveal" key={i}>
                <div className="proc-vis">{svg}</div>
                <div className="proc-body">
                  <div className="step">{story[i].step}</div>
                  <h3>{story[i].h}</h3>
                  <p>{story[i].p}</p>
                  <div className="proc-tags">{story[i].tags.map((t) => <span key={t}>{t}</span>)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STÜDYO / İSTANBUL */}
      <section className="sec-pad" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="studio">
            <div className="ph big reveal">
              <img className="ph-media" src="/kadir.jpg" alt="Kadir Demir" loading="lazy" />
              <div className="ph-tag">İstanbul — set</div>
            </div>
            <div className="studio-side">
              <div className="studio-copy reveal">
                <h3>Her şey <span className="serif">İstanbul'dan.</span></h3>
                <p>Tek kişilik bir üretim — çekim, kurgu, thumbnail, hepsi burada. Az sayıda işe odaklanıp her birine gerçekten zaman ayırmayı tercih ediyorum.</p>
              </div>
              <div className="ph reveal" style={{ minHeight: '200px' }}>
                <img className="ph-media" src="/kadelink-portrait.png" alt="Setup" loading="lazy" />
                <div className="ph-tag">setup — masa</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* İLETİŞİM */}
      <section className="sec-pad" id="contact">
        <div className="wrap contact">
          <div className="contact-left reveal">
            <div className="eyebrow" style={{ marginBottom: '22px' }}>İletişim</div>
            <h2>Bana <span className="serif">yaz.</span></h2>
            <p style={{ color: 'var(--ink2)', fontSize: '15px', margin: '18px 0 30px', maxWidth: '340px' }}>İş birliği, soru ya da sadece selam — ne olursa yaz. Genelde bir iş günü içinde dönüş yapıyorum.</p>
            <div className="line"><b>E-posta</b> {settings.email || 'thekademedia@gmail.com'}</div>
            <div className="line"><b>Konum</b> {settings.address || 'İstanbul, TR'}</div>
            <div className="line"><b>YouTube</b> {settings.youtubeHandle || '@kadirardademirr'}</div>
            <div className="line" style={{ borderBottom: '1px solid var(--line)' }}><b>Instagram</b> {settings.instagramHandle || '@kadirardademir'}</div>
          </div>
          <form className="form reveal" onSubmit={submit}>
            <div className="two">
              <div className="field"><label>Ad</label><input required placeholder="Adın" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="field"><label>E-posta</label><input required type="email" placeholder="sen@ornek.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div className="field"><label>Konu</label>
              <div className="topic-row" id="topicRow">
                {topics.map((t) => <span className="chip" data-topic={t} key={t}>{t}</span>)}
              </div>
            </div>
            <div className="field"><label>Mesaj</label><textarea placeholder="Birkaç cümleyle ne hakkında yazdığını anlat…" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}></textarea></div>
            <button className="btn btn-primary" type="submit" id="submitBtn" disabled={sending}>{sending ? 'Gönderiliyor…' : 'Mesajı gönder →'}</button>
            {status && <div className={`form-status ${status.type}`}>{status.text}</div>}
          </form>
        </div>
      </section>

      {/* HAKKIMDA */}
      <section className="sec-pad" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap founder">
          <div className="ph reveal">
            <img className="ph-media" src="/kadir.jpg" alt="Kadir Demir" loading="lazy" />
            <div className="ph-tag">portre — Kadir Demir</div>
          </div>
          <div className="founder-copy reveal">
            <div className="eyebrow" style={{ marginBottom: '24px' }}>Kameranın arkasındaki kişi</div>
            <div className="quote">"İzlemeye değer bulmadığım <span className="acc">hiçbir şeyi</span> çekmiyorum — sayıyı değil, içeriği önemsiyorum."</div>
            <p>2011'de bir laptopla başladım, sıfır takipçiyle. {years} yıl sonra hâlâ aynı merakla buradayım — her videoyu kendim çekip kurguluyorum, ilk fikirden son yüklemeye kadar.</p>
            <div className="founder-sign">
              <div className="nm">Kadir Demir</div>
              <div className="founder-stat">
                <div className="m"><b>2011</b><span>BAŞLANGIÇ</span></div>
                <div className="m"><b>İST</b><span>ÜSSÜ</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RAKAMLAR */}
      <section className="results sec-pad" id="results">
        <div className="wrap">
          <div className="sec-head reveal"><h2>Rakamlar.</h2><p>Tahmin değil, ölçülmüş veriler.</p></div>
          <div className="res-top">
            <div className="res-stats reveal">
              {bigStats.map((s, i) => (
                <div className="s" key={i}><b><CountUp value={s.value} /></b><span>{s.label}</span></div>
              ))}
            </div>
            <div className="res-panel reveal">
              <h3>İzleyici yaş dağılımı</h3>
              <div className="h-sub">Kitlenin yaş gruplarına göre payı</div>
              {audience.map((a) => (
                <div className="res-bar" key={a.label}>
                  <div className="lab">{a.label}</div>
                  <div className="track"><div className="fill" data-w={a.value}></div></div>
                  <div className="pct">{a.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="res-grid2">
            <div className="res-card reveal">
              <h4>Aylık büyüme</h4>
              <svg viewBox="0 0 320 110" style={{ width: '100%', height: 'auto' }} fill="none">
                <line x1="0" y1="100" x2="320" y2="100" stroke="rgba(212,148,63,.18)"></line>
                <polyline points="0,96 50,84 100,70 150,58 200,40 260,24 320,8" stroke="var(--acc)" strokeWidth="2"></polyline>
                <polygon points="0,96 50,84 100,70 150,58 200,40 260,24 320,8 320,100 0,100" fill="rgba(212,148,63,.08)"></polygon>
              </svg>
            </div>
            <div className="res-card reveal">
              <h4>Nereden izleniyor</h4>
              <div className="gauge-row">
                {regions.map((r) => (
                  <div className="gauge" key={r.name}>
                    <div className="circ" style={{ '--p': `${r.p}%` }}><b>{r.p}%</b></div>
                    <span>{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section className="sec-pad" id="faq">
        <div className="wrap">
          <div className="sec-head reveal"><h2>Sıkça <span className="serif">sorulanlar.</span></h2><p>En çok merak edilenler — sürpriz yok.</p></div>
          <div className="faq reveal">
            {faqs.map((f, i) => (
              <div className="faq-item" key={i}>
                <div className="faq-q">{f.q}<span className="pm">+</span></div>
                <div className="faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-glow"></div>
        <div className="wrap">
          <h2 className="reveal">Takipte <span className="serif acc">kal.</span></h2>
          <p className="reveal">Yeni videolar, canlı yayınlar ve perde arkası — hepsini kaçırma.</p>
          <div className="hero-cta reveal" style={{ justifyContent: 'center' }}>
            <Magnetic className="btn btn-primary" href={settings.youtube || 'https://youtube.com/@kadirardademirr'}>YouTube'da abone ol →</Magnetic>
            <Magnetic className="btn btn-ghost" to="/links">Tüm linkler</Magnetic>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a className="brand" href="#top"><span className="logo"><span>k</span></span>Kadir Demir</a>
              <p>{settings.description || "İstanbul'dan içerik üreten bir YouTuber. Vlog, oyun ve canlı yayın — hepsi tek yerde."}</p>
            </div>
            <div className="foot-col"><h5>Keşfet</h5><Link to="/videolar">Videolar</Link><Link to="/blog">Blog</Link><Link to="/hakkimda">Hakkımda</Link><Link to="/links">Links</Link></div>
            <div className="foot-col"><h5>Sosyal</h5><a href={settings.youtube} target="_blank" rel="noreferrer">YouTube</a><a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a><a href={settings.tiktok} target="_blank" rel="noreferrer">TikTok</a><a href={settings.twitter} target="_blank" rel="noreferrer">X</a></div>
            <div className="foot-col"><h5>Yasal</h5><Link to="/kvkk">KVKK</Link><Link to="/gizlilik">Gizlilik</Link><Link to="/cerez-politikasi">Çerez Politikası</Link></div>
          </div>
          <div className="foot-bot">
            <span>© 2026 Kadir Demir — İçerik Üreticisi</span>
            <span>İstanbul'dan sevgiyle</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
