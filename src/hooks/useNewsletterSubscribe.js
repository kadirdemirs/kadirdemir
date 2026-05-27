import { useState } from 'react'
import { subscribeNewsletterApi } from '../api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MESSAGES = {
  tr: {
    invalid: 'Geçerli bir e-posta adresi gir.',
    success: 'Teşekkürler, onay maili gönderildi. Spam klasörünü de kontrol et.',
    error: 'Şu an abone olunamadı, biraz sonra tekrar dener misin?',
  },
  en: {
    invalid: 'Please enter a valid email.',
    success: 'Thanks, a confirmation email is on its way. Check your spam folder too.',
    error: 'Could not subscribe right now. Mind trying again in a moment?',
  },
}

export function useNewsletterSubscribe({ lang = 'tr' } = {}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const messages = MESSAGES[lang] || MESSAGES.tr

  const submit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setStatus({ type: 'error', text: messages.invalid })
      return false
    }
    setSubmitting(true)
    setStatus(null)
    try {
      await subscribeNewsletterApi(trimmed)
      setStatus({ type: 'success', text: messages.success })
      setEmail('')
      return true
    } catch (err) {
      setStatus({ type: 'error', text: err?.message || messages.error })
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return { email, setEmail, status, submitting, submit }
}
