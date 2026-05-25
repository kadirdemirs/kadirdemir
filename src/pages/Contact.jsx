import { useState } from 'react'
import { FaYoutube, FaInstagram } from 'react-icons/fa'
import { HiOutlineMail, HiOutlinePhone } from 'react-icons/hi'
import { useSiteSettings } from '../hooks/useSiteSettings.jsx'
import { useLanguage } from '../i18n/LanguageContext'
import { sendContactApi } from '../api'
import { useSEO } from '../hooks/useSEO'
import { BreadcrumbSchema } from '../components/StructuredData'
import './Contact.css'

export default function Contact() {
  const { settings } = useSiteSettings()
  const { t } = useLanguage()
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
    title: t('contact.pill'),
    description: `${settings.businessName || 'Kadir Demir'} — ${t('contact.heroSub')}`,
    path: '/iletisim',
  })

  const followCards = [
    settings.youtube && {
      icon: FaYoutube,
      name: 'YouTube',
      desc: t('contact.followDescYoutube'),
      url: settings.youtube,
    },
    settings.instagram && {
      icon: FaInstagram,
      name: 'Instagram',
      desc: t('contact.followDescInstagram'),
      url: settings.instagram,
    },
    settings.email && {
      icon: HiOutlineMail,
      name: t('contact.email'),
      desc: t('contact.followDescEmail'),
      url: `mailto:${settings.email}`,
    },
    settings.businessEmail && {
      icon: HiOutlinePhone,
      name: t('contact.business'),
      desc: t('contact.followDescBusiness'),
      url: `mailto:${settings.businessEmail}`,
    },
  ].filter(Boolean)

  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setStatus({ type: 'error', text: t('contact.errorRequired') })
      return
    }
    setSubmitting(true)
    setStatus(null)
    try {
      await sendContactApi({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject || t('contact.pill'),
        message: form.message,
      })
      setStatus({ type: 'success', text: t('contact.success') })
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message || t('contact.errorGeneric') })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="kd-contact">
      <BreadcrumbSchema items={[{ name: t('nav.home'), path: '/' }, { name: t('contact.pill'), path: '/iletisim' }]} />
      <section className="kd-contact-top">
        <div className="kd-contact-left">
          <h1>
            {t('contact.heroTitleA')} <span className="kd-accent">{t('contact.heroTitleB')}</span>
          </h1>
          <p>{t('contact.heroSub')}</p>

          {settings.email && (
            <div className="kd-contact-card">
              <span className="kd-contact-card-icon">
                <HiOutlineMail size={20} />
              </span>
              <div>
                <div className="kd-contact-card-kind">{t('contact.email')}</div>
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
                <div className="kd-contact-card-kind">{t('contact.business')}</div>
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
              <label htmlFor="kd-name">{t('contact.formName')}</label>
            </div>
            <div className="kd-field">
              <input
                type="email"
                value={form.email}
                onChange={handle('email')}
                placeholder=" "
                id="kd-email"
              />
              <label htmlFor="kd-email">{t('contact.formEmail')}</label>
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
              <label htmlFor="kd-phone">{t('contact.formPhone')}</label>
            </div>
            <div className="kd-field">
              <input
                type="text"
                value={form.subject}
                onChange={handle('subject')}
                placeholder=" "
                id="kd-subject"
              />
              <label htmlFor="kd-subject">{t('contact.formSubject')}</label>
            </div>
          </div>

          <div className="kd-field kd-field-textarea">
            <label htmlFor="kd-message" className="visually-hidden">{t('contact.formMessageLabel')}</label>
            <textarea
              id="kd-message"
              value={form.message}
              onChange={handle('message')}
              placeholder={t('contact.formMessage')}
              rows={6}
              required
              minLength={10}
              maxLength={4000}
              aria-required="true"
            />
          </div>

          <button type="submit" className="kd-contact-submit" disabled={submitting}>
            {submitting ? t('contact.submitting') : t('contact.submit')}
          </button>

          {status && (
            <div className={`kd-form-status ${status.type}`} role="status" aria-live="polite">{status.text}</div>
          )}

          <p className="kd-contact-note">{t('contact.spamNote')}</p>
        </form>
      </section>

      <section className="kd-contact-follow">
        <div className="kd-follow-head">
          <h2>
            {t('contact.followTitleA')} <span className="kd-accent">{t('contact.followTitleB')}</span>
          </h2>
          <p>{t('contact.followSub')}</p>
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
              <span className="kd-follow-tile-link">{t('contact.followCta')} ↗</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
