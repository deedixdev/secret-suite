'use client';
/**
 * secret/components/JwtInspector.jsx
 * Decode & inspect any JWT — header + payload + signature status.
 * Fully client-side. No secret needed — just structural inspection.
 */
import { useState } from 'react';
import { ScanSearch } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import CopyButton from './ui/CopyButton';

function b64urlDecode(s) {
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  return JSON.parse(atob(t));
}

function formatUnixDate(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  const now = Date.now();
  const diff = ts * 1000 - now;
  const abs = Math.abs(diff);
  const label =
    abs < 60000     ? 'just now' :
    abs < 3600000   ? `${Math.round(abs / 60000)}m ${diff > 0 ? 'from now' : 'ago'}` :
    abs < 86400000  ? `${Math.round(abs / 3600000)}h ${diff > 0 ? 'from now' : 'ago'}` :
                      `${Math.round(abs / 86400000)}d ${diff > 0 ? 'from now' : 'ago'}`;
  return `${d.toISOString()} (${label})`;
}

function ClaimRow({ k, v }) {
  const isTime = ['iat', 'exp', 'nbf'].includes(k);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 8,
        padding: '6px 0',
        borderBottom: '1px solid var(--ss-border)',
        alignItems: 'start',
      }}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--ss-text-tertiary)', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
        {k}
      </span>
      <div>
        <span style={{ fontSize: '0.8rem', color: 'var(--ss-text-primary)', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
        </span>
        {isTime && typeof v === 'number' && (
          <div style={{ fontSize: '0.7rem', color: k === 'exp' && v * 1000 < Date.now() ? 'var(--ss-red)' : 'var(--ss-text-tertiary)', marginTop: 2 }}>
            {formatUnixDate(v)}
            {k === 'exp' && v * 1000 < Date.now() && ' ⚠ EXPIRED'}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, data, color }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {title}
        </span>
        <CopyButton text={JSON.stringify(data, null, 2)} size={12} />
      </div>
      <div style={{ background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)', padding: '0 10px' }}>
        {Object.entries(data).map(([k, v]) => <ClaimRow key={k} k={k} v={v} />)}
      </div>
    </div>
  );
}

export default function JwtInspector() {
  const [token, setToken] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError]   = useState('');

  const inspect = () => {
    setError('');
    setParsed(null);
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      setError('Not a valid JWT — expected 3 dot-separated parts.');
      return;
    }
    try {
      const header  = b64urlDecode(parts[0]);
      const payload = b64urlDecode(parts[1]);
      setParsed({ header, payload, sig: parts[2] });
    } catch {
      setError('Failed to decode JWT — check the token is a valid JWT.');
    }
  };

  return (
    <SectionCard title="JWT Inspector" icon={ScanSearch} color="var(--ss-amber)">
      <div style={{ marginBottom: '0.75rem' }}>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste JWT here…  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          rows={3}
          style={{
            width: '100%',
            background: 'var(--ss-bg-tertiary)',
            border: '1px solid var(--ss-border)',
            borderRadius: 'var(--ss-radius-sm)',
            color: 'var(--ss-text-primary)',
            fontSize: '0.78rem',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '9px 11px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ss-accent)')}
          onBlur={(e)  => (e.target.style.borderColor = 'var(--ss-border)')}
        />
      </div>
      <button
        onClick={inspect}
        style={{
          background: 'var(--ss-btn-bg)',
          color: 'var(--ss-btn-text)',
          border: 'none',
          borderRadius: 'var(--ss-radius-sm)',
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '0.75rem',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ss-btn-hover-bg)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ss-btn-bg)')}
      >
        Inspect
      </button>

      {error && <p style={{ fontSize: '0.8rem', color: 'var(--ss-red)', marginBottom: '0.5rem' }}>{error}</p>}

      {parsed && (
        <div className="ss-fade-in">
          {/* Algorithm badge */}
          <div style={{ marginBottom: '0.6rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={badgeStyle('var(--ss-accent-dim)', 'var(--ss-accent)')}>{parsed.header.alg || '?'}</span>
            <span style={badgeStyle('var(--ss-purple-dim)', 'var(--ss-purple)')}>{parsed.header.typ || 'JWT'}</span>
            {parsed.payload.exp && (
              <span style={badgeStyle(
                parsed.payload.exp * 1000 < Date.now() ? 'var(--ss-red-dim)' : 'var(--ss-green-dim)',
                parsed.payload.exp * 1000 < Date.now() ? 'var(--ss-red)'     : 'var(--ss-green)',
              )}>
                {parsed.payload.exp * 1000 < Date.now() ? 'EXPIRED' : 'VALID exp'}
              </span>
            )}
          </div>
          <Section title="Header"    data={parsed.header}  color="var(--ss-accent)" />
          <Section title="Payload"   data={parsed.payload} color="var(--ss-green)" />
          <div style={{ fontSize: '0.72rem', color: 'var(--ss-text-tertiary)', padding: '6px 0', wordBreak: 'break-all', fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: 'var(--ss-text-tertiary)', marginRight: 6 }}>SIG</span>
            {parsed.sig}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--ss-text-tertiary)', marginTop: 4 }}>
            ⚠ Signature is not verified — structural decode only.
          </p>
        </div>
      )}
    </SectionCard>
  );
}

function badgeStyle(bg, color) {
  return {
    fontSize: '0.7rem',
    padding: '2px 8px',
    background: bg,
    color,
    borderRadius: 99,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
  };
}
