import { useState } from 'react'
import { FaYoutube, FaInstagram } from 'react-icons/fa'
import { HiOutlineMail, HiOutlinePhone } from 'react-icons/hi'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { sendContactApi } from '../api'
import { useSEO } from '../hooks/useSEO'
import { BreadcrumbSchema } from '../components/StructuredData'
import './Contact.css'

export default function Contact() {
  const { settings } = useSiteSettings()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useSEO({
    title: 'İletişim',
    description: `${settings.businessName || 'Kadir Demir'} ile iletişime geç — iş birliği, sponsorluk veya doğrudan mesaj için.`,
    path: '/iletisim',
  })

  const followCards = [
    settings.youtube && {
      icon: FaYoutube,
      name: 'YouTube',
      desc: 'Haftada birkaç yeni video. Oyun, vlog ve eğlence içerikleri.',
      url: settings.youtube,
    },
    settings.instagram && {
      icon: FaInstagram,
      name: 'Instagram',
      desc: "Kamera arkası, story'ler ve günlük hayattan kareler.",
      url: settings.instagram,
    },
    settings.email && {
      icon: HiOutlineMail,
      name: 'E-posta',
      desc: 'Genel sorular ve fikirler için doğrudan mail atabilirsin.',
      url: `mailto:${settings.email}`,
    },
    settings.businessEmail && {
      icon: HiOutlinePhone,
      name: 'İş birliği',
      desc: 'Marka iş birlikleri ve sponsorluk teklifleri için.',
      url: `mailto:${settings.businessEmail}`,
    },
  ].filter(Boolean)

  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setStatus({ type: 'error', text: 'Lütfen ad, e-posta ve mesaj alanlarını doldur.' })
      return
    }
    setSubmitting(true)
    setStatus(null)
    try {
      await sendContactApi({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject || 'İletişim formu',
        message: form.message,
      })
      setStatus({ type: 'success', text: 'Mesajın iletildi. En kısa sürede dönüş yapacağım.' })
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Bir hata oluştu, lütfen tekrar dene.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="kd-contact">
      <BreadcrumbSchema items={[{ name: 'Ana Sayfa', path: '/' }, { name: 'İletişim', path: '/iletisim' }]} />
      <section className="kd-contact-top">
        <div className="kd-contact-left">
          <h1>
            İletişime <span className="kd-accent">geç</span>
          </h1>
          <p>
            İş birliği teklifleri, sponsorluk veya bana ulaşmak istediğin başka bir konu
            olursa formu doldur ya da aşağıdaki bilgilerden ulaş — en kısa sürede dönüş
            yaparım.
          </p>

          {settings.email && (
            <div className="kd-contact-card">
              <span className="kd-contact-card-icon">
                <HiOutlineMail size={20} />
              </span>
              <div>
                <div className="kd-contact-card-kind">E-posta</div>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </div>
            </div>
          )}

          {settings.businessEmail && (
            <div className="kd-contact-card">
              <span className="kd-contact-card-icon">
                <HiOutlinePhone size={20} />
              </span>
              <div>
                <div className="kd-contact-card-kind">İş birliği</div>
                <a href={`mailto:${settings.businessEmail}`}>{settings.businessEmail}</a>
              </div>
            </div>
          )}
        </div>

        <form className="kd-contact-form" onSubmit={submit}>
          <div className="kd-contact-row">
            <div className="kd-field">
              <input
                type="text"
                value={form.name}
                onChange={handle('name')}
                placeholder=" "
                id="kd-name"
              />
              <label htmlFor="kd-name">Ad Soyad</label>
            </div>
            <div className="kd-field">
              <input
                type="email"
                value={form.email}
                onChange={handle('email')}
                placeholder=" "
                id="kd-email"
              />
              <label htmlFor="kd-email">E-posta</label>
            </div>
          </div>

          <div className="kd-contact-row">
            <div className="kd-field">
              <input
                type="tel"
                value={form.phone}
                onChange={handle('phone')}
                placeholder=" "
                id="kd-phone"
              />
              <label htmlFor="kd-phone">Telefon (opsiyonel)</label>
            </div>
            <div className="kd-field">
              <input
                type="text"
                value={form.subject}
                onChange={handle('subject')}
                placeholder=" "
                id="kd-subject"
              />
              <label htmlFor="kd-subject">Konu</label>
            </div>
          </div>

          <div className="kd-field kd-field-textarea">
            <textarea
              value={form.message}
              onChange={handle('message')}
              placeholder="Mesajını buraya yaz..."
              rows={6}
            />
          </div>

          <button type="submit" className="kd-contact-submit" disabled={submitting}>
            {submitting ? 'Gönderiliyor...' : 'Mesajı gönder'}
          </button>

          {status && (
            <div className={`kd-form-status ${status.type}`}>{status.text}</div>
          )}

          <p className="kd-contact-note">
            Spam koruması için 15 dakikada bir form gönderebilirsin.
          </p>
        </form>
      </section>

      <section className="kd-contact-follow">
        <div className="kd-follow-head">
          <h2>
            Beni takip <span className="kd-accent">et</span>
          </h2>
          <p>
            Sosyal medyada da bulabilirsin. Mesajına en hızlı buralardan dönüş
            yapıyorum.
          </p>
        </div>
        <div className="kd-follow-cards">
          {followCards.map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="kd-follow-tile"
            >
              <span className="kd-follow-tile-icon">
                <c.icon size={22} />
              </span>
              <h4>{c.name}</h4>
              <p>{c.desc}</p>
              <span className="kd-follow-tile-link">Takip et ↗</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
