import { useCallback, useEffect, useState } from 'react'

const API = '/api/ops?resource=push'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [status, setStatus] = useState('idle') // idle | loading | granted | denied | unsupported
  const [vapidKey, setVapidKey] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    setStatus(Notification.permission === 'granted' ? 'granted' : 'idle')
    fetch(`${API}&action=vapid-public-key`)
      .then((r) => r.json())
      .then((d) => { if (d.key) setVapidKey(d.key) })
      .catch(() => {})
  }, [])

  const subscribe = useCallback(async () => {
    if (!vapidKey) return setStatus('unsupported')
    setStatus('loading')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const { endpoint, keys } = sub.toJSON()
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, keys, permission: 'granted' }),
      })
      setStatus('granted')
    } catch (e) {
      console.error('Push subscribe error:', e)
      setStatus('denied')
    }
  }, [vapidKey])

  return { status, subscribe }
}
