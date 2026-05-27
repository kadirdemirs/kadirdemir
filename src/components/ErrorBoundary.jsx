import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null, info: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env?.DEV
      const msg = this.state.error?.message || String(this.state.error || 'Unknown error')
      const stack = this.state.error?.stack || ''
      const compStack = this.state.info?.componentStack || ''
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: '16px',
          background: '#0a0a0a', color: '#fff', textAlign: 'center', padding: '20px',
        }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Bir şeyler ters gitti</h2>
          <p style={{ color: '#888', margin: 0 }}>Sayfa yüklenirken bir hata oluştu.</p>
          {isDev && (
            <details style={{
              maxWidth: 720, width: '100%', textAlign: 'left',
              background: '#171717', border: '1px solid #333', borderRadius: 8,
              padding: 14, color: '#e5e5e5', fontFamily: 'ui-monospace, monospace', fontSize: '.82rem',
            }}>
              <summary style={{ cursor: 'pointer', color: '#f59e0b', fontWeight: 600 }}>{msg}</summary>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10, maxHeight: 240, overflow: 'auto' }}>{stack}</pre>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: 6, maxHeight: 200, overflow: 'auto', color: '#9ca3af' }}>{compStack}</pre>
            </details>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, error: null, info: null }); window.location.reload() }}
            style={{
              padding: '12px 28px', background: '#f59e0b', color: '#000',
              border: 'none', borderRadius: '8px', fontWeight: 600,
              cursor: 'pointer', fontSize: '1rem',
            }}
          >
            Tekrar Dene
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
