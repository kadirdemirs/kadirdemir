import { HiOutlineArrowRight } from 'react-icons/hi'
import { useNewsletterSubscribe } from '../hooks/useNewsletterSubscribe'
import './NewsletterForm.css'

export default function NewsletterForm({ variant = 'default' }) {
  const { email, setEmail, status, submitting, submit } = useNewsletterSubscribe()

  return (
    <form className={`kd-newsletter-form kd-newsletter-${variant}`} onSubmit={submit} noValidate>
      <label htmlFor="kd-newsletter-email" className="visually-hidden">
        E-posta adresin
      </label>
      <div className="kd-newsletter-row">
        <input
          id="kd-newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="senin@e-posta.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
          aria-invalid={status?.type === 'error'}
          aria-describedby="kd-newsletter-status"
        />
        <button type="submit" disabled={submitting}>
          <span>{submitting ? 'Gönderiliyor…' : 'Abone ol'}</span>
          <HiOutlineArrowRight />
        </button>
      </div>
      <div
        id="kd-newsletter-status"
        className={`kd-newsletter-status ${status ? `is-${status.type}` : ''}`}
        role="status"
        aria-live="polite"
      >
        {status?.text || ' '}
      </div>
      <p className="kd-newsletter-fineprint">
        Kayıt olarak <a href="/gizlilik">Gizlilik Politikası</a>’nı kabul etmiş olursun.
      </p>
    </form>
  )
}
