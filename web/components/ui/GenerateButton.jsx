'use client';
/**
 * secret-suite/components/ui/GenerateButton.jsx
 */
import { Loader2 } from 'lucide-react';

export default function GenerateButton({ onClick, loading = false, label = 'Generate', icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        background: loading ? 'var(--ss-bg-elevated)' : 'var(--ss-btn-bg)',
        color: loading ? 'var(--ss-text-secondary)' : 'var(--ss-btn-text)',
        border: 'none',
        borderRadius: 'var(--ss-radius-sm)',
        padding: '9px 18px',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.65 : 1,
        transition: 'background 0.15s',
        fontFamily: 'Inter, sans-serif',
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--ss-btn-hover-bg)'; }}
      onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'var(--ss-btn-bg)'; }}
    >
      {loading
        ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
        : Icon && <Icon size={14} />
      }
      {loading ? 'Working…' : label}
    </button>
  );
}
