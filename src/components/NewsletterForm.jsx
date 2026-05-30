import { useId } from 'react'
import { HiOutlineArrowRight, HiOutlineBell, HiOutlineCheck } from 'react-icons/hi'
import { useNewsletterSubscribe } from '../hooks/useNewsletterSubscribe'
import { usePushNotifications } from '../hooks/usePushNotifications'
import './NewsletterForm.css'

export default function NewsletterForm({ variant = 'default', lang = 'tr' }) {
  const id = useId()
  const emailId = `${id}-email`
  const statusId = `${id}-status`
  const isEn = lang === 'en'
  const { email, setEmail, status, submitting, submit } = useNewsletterSubscribe({ lang })
  const { status: pushStatus, subscribe: pushSubscribe } = usePushNotifications()

  return (
    <form className={`kd-newsletter-form kd-newsletter-${variant}`} onSubmit={submit} noValidate>
      <label htmlFor={emailId} className="visually-hidden">
        {isEn ? 'Your email address' : 'E-posta adresin'}
      </label>
      <div className="kd-newsletter-row">
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="senin@e-posta.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
          aria-invalid={status?.type === 'error'}
          aria-describedby={statusId}
        />
        <button type="submit" disabled={submitting}>
          <span>{submitting ? (isEn ? 'Sending...' : 'Gönderiliyor...') : (isEn ? 'Subscribe' : 'Abone ol')}</span>
          <HiOutlineArrowRight />
        </button>
      </div>
      <div
        id={statusId}
        className={`kd-newsletter-status ${status ? `is-${status.type}` : ''}`}
        role="status"
        aria-live="polite"
      >
        {status?.text || ' '}
      </div>
      <p className="kd-newsletter-fineprint">
        {isEn ? 'By subscribing you accept the ' : 'Kayıt olarak '}
        <a href="/gizlilik">{isEn ? 'Privacy Policy' : 'Gizlilik Politikası'}</a>
        {isEn ? '.' : "'nı kabul etmiş olursun."}
      </p>

      {pushStatus !== 'unsupported' && (
        <div className="kd-push-row">
          {pushStatus === 'granted' ? (
            <span className="kd-push-ok"><HiOutlineCheck size={14} /> {isEn ? 'Push notifications on' : 'Push bildirimleri açık'}</span>
          ) : (
            <button type="button" className="kd-push-btn" onClick={pushSubscribe} disabled={pushStatus === 'loading'}>
              <HiOutlineBell size={14} />
              {pushStatus === 'loading'
                ? (isEn ? 'Activating…' : 'Açılıyor…')
                : pushStatus === 'denied'
                  ? (isEn ? 'Notifications blocked (check browser settings)' : 'Bildirimler engellendi')
                  : (isEn ? 'Enable push notifications' : 'Anlık bildirim al')}
            </button>
          )}
        </div>
      )}
    </form>
  )
}
