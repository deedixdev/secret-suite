'use client';
/**
 * secret/components/TimestampTools.jsx
 * Current timestamps, ISO conversions, expiry calculator.
 * Fully client-side.
 */
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import ResultBox from './ui/ResultBox';
import CopyButton from './ui/CopyButton';
import InputField from './ui/InputField';

function LiveRow({ label, getValue }) {
  const [val, setVal] = useState(getValue());
  useEffect(() => {
    const id = setInterval(() => setVal(getValue()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 10px',
        background: 'var(--ss-bg-tertiary)',
        borderRadius: 'var(--ss-radius-sm)',
        marginBottom: 4,
        gap: 8,
      }}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--ss-text-tertiary)', minWidth: 110 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--ss-green)', fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>{val}</span>
      <CopyButton text={String(val)} size={13} />
    </div>
  );
}

// ── Expiry calculator ─────────────────────────────────────────────────────────
const PRESETS = [
  { label: '15 min', seconds: 900 },
  { label: '1 hr',   seconds: 3600 },
  { label: '24 hrs', seconds: 86400 },
  { label: '7 days', seconds: 604800 },
  { label: '30 days',seconds: 2592000 },
  { label: '90 days',seconds: 7776000 },
  { label: '1 year', seconds: 31536000 },
];

function ExpiryCalc() {
  const [seconds, setSeconds] = useState('3600');
  const [result, setResult]   = useState(null);

  const calculate = () => {
    const secs = parseInt(seconds, 10);
    if (isNaN(secs) || secs <= 0) { setResult(null); return; }
    const now   = Math.floor(Date.now() / 1000);
    const exp   = now + secs;
    const expMs = exp * 1000;
    setResult({
      'now (unix)':     now,
      'exp (unix)':     exp,
      'exp (ISO)':      new Date(expMs).toISOString(),
      'duration (s)':   secs,
      'duration (ms)':  secs * 1000,
      'expires in':     humanDuration(secs),
    });
  };

  return (
    <div style={{ marginTop: '0.75rem', padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>Expiry Calculator</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        {PRESETS.map((p) => (
          <button
            key={p.seconds}
            onClick={() => { setSeconds(String(p.seconds)); }}
            style={{
              background: String(p.seconds) === seconds ? 'var(--ss-accent-dim)' : 'var(--ss-bg-elevated)',
              color: String(p.seconds) === seconds ? 'var(--ss-accent)' : 'var(--ss-text-secondary)',
              border: `1px solid ${String(p.seconds) === seconds ? 'var(--ss-accent)' : 'var(--ss-border)'}`,
              borderRadius: 99,
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <InputField label="Seconds" id="exp-seconds" value={seconds} onChange={setSeconds} placeholder="3600" hint="Duration in seconds from now" />
      <button
        onClick={calculate}
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
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ss-btn-hover-bg)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ss-btn-bg)')}
      >
        Calculate
      </button>
      {result && <ResultBox result={result} label="Expiry Values" />}
    </div>
  );
}

// ── ISO ↔ Unix converter ──────────────────────────────────────────────────────
function IsoUnixConverter() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  const convert = () => {
    setError(''); setResult(null);
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) {
      // Unix → ISO
      const ms = trimmed.length === 13 ? parseInt(trimmed) : parseInt(trimmed) * 1000;
      const d = new Date(ms);
      if (isNaN(d)) { setError('Invalid timestamp'); return; }
      setResult({ 'ISO 8601': d.toISOString(), 'Unix (s)': Math.floor(ms / 1000), 'Unix (ms)': ms, 'Human': d.toLocaleString() });
    } else {
      // ISO → Unix
      const d = new Date(trimmed);
      if (isNaN(d)) { setError('Invalid date string'); return; }
      setResult({ 'ISO 8601': d.toISOString(), 'Unix (s)': Math.floor(d.getTime() / 1000), 'Unix (ms)': d.getTime(), 'Human': d.toLocaleString() });
    }
  };

  return (
    <div style={{ marginTop: '0.75rem', padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>ISO ↔ Unix Converter</p>
      <InputField label="Unix timestamp or ISO date string" id="ts-conv" value={input} onChange={setInput} placeholder="1713369600  or  2024-04-17T12:00:00Z" />
      <button
        onClick={convert}
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
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ss-btn-hover-bg)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ss-btn-bg)')}
      >
        Convert
      </button>
      {error  && <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--ss-red)' }}>{error}</p>}
      {result && <ResultBox result={result} label="Converted" />}
    </div>
  );
}

function humanDuration(secs) {
  if (secs < 60)     return `${secs}s`;
  if (secs < 3600)   return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  if (secs < 86400)  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  return `${Math.floor(secs / 86400)}d ${Math.floor((secs % 86400) / 3600)}h`;
}

export default function TimestampTools() {
  return (
    <SectionCard title="Timestamp Tools" icon={Clock} color="var(--ss-green)">
      <div style={{ marginBottom: '0.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--ss-text-tertiary)', marginBottom: 6 }}>Live — updates every second</p>
        <LiveRow label="Unix (s)"   getValue={() => Math.floor(Date.now() / 1000)} />
        <LiveRow label="Unix (ms)"  getValue={() => Date.now()} />
        <LiveRow label="ISO 8601"   getValue={() => new Date().toISOString()} />
        <LiveRow label="UTC string" getValue={() => new Date().toUTCString()} />
      </div>
      <IsoUnixConverter />
      <ExpiryCalc />
    </SectionCard>
  );
}
