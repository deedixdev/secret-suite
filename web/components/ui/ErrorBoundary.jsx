'use client';
/**
 * secret-suite/components/ui/ErrorBoundary.jsx
 * Catches render errors inside any individual tool panel so one
 * broken tool can't take down the whole dashboard.
 */
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to console for debugging; could be extended to Sentry
    console.error('[SecretSuite] Tool error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const msg = this.state.error?.message || String(this.state.error);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: '48px 28px',
          textAlign: 'center',
          color: 'var(--ss-text-secondary)',
        }}
      >
        <AlertTriangle size={32} style={{ color: 'var(--ss-amber)' }} />
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--ss-text-primary)', fontSize: '0.95rem' }}>
            This tool crashed
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--ss-text-tertiary)', maxWidth: 360 }}>
            {msg}
          </p>
        </div>
        <button
          onClick={() => this.setState({ error: null })}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 'var(--ss-radius-sm)',
            background: 'var(--ss-btn-bg)', color: 'var(--ss-btn-text)',
            border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <RefreshCw size={13} />
          Try again
        </button>
      </div>
    );
  }
}
