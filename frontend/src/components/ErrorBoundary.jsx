import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application crash:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#050505',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Manrope, sans-serif'
        }}>
          <div style={{ maxWidth: '720px', width: '100%' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '12px', color: '#00F0FF' }}>
              The app hit an error.
            </h1>
            <p style={{ opacity: 0.85, marginBottom: '16px' }}>
              A runtime error prevented the page from rendering. Use reload and check console logs for details.
            </p>
            <pre style={{
              background: '#0C0C0F',
              border: '1px solid rgba(0,240,255,0.25)',
              borderRadius: '8px',
              padding: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {String(this.state.error?.message || this.state.error || 'Unknown error')}
            </pre>
            <button
              onClick={this.handleReload}
              style={{
                marginTop: '16px',
                padding: '10px 16px',
                border: '1px solid rgba(0,240,255,0.4)',
                borderRadius: '8px',
                background: 'rgba(0,240,255,0.1)',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
