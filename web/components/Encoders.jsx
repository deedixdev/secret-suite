'use client';
/**
 * secret/components/Encoders.jsx
 * Base64 and Hex encoder/decoder — fully client-side, no API call.
 */
import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import ResultBox from './ui/ResultBox';
import InputField from './ui/InputField';

function EncoderPanel({ title, encode, decode, inputPlaceholder, outputPlaceholder }) {
  const [input, setInput]   = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  const run = (fn, label) => {
    setError('');
    try {
      setResult({ value: fn(input), label });
    } catch (e) {
      setError(e.message);
      setResult(null);
    }
  };

  return (
    <div style={{ padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)', marginBottom: '0.8rem' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>{title}</p>
      <InputField
        label="Input"
        id={`enc-${title}`}
        value={input}
        onChange={setInput}
        multiline
        rows={2}
        placeholder={inputPlaceholder}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => run(encode, 'Encoded')}
          style={btnStyle('var(--ss-btn-bg)', 'var(--ss-btn-text)')}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ss-btn-hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ss-btn-bg)')}
        >
          Encode →
        </button>
        <button
          onClick={() => run(decode, 'Decoded')}
          style={btnStyle('var(--ss-btn-bg)', 'var(--ss-btn-text)')}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ss-btn-hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ss-btn-bg)')}
        >
          ← Decode
        </button>
      </div>
      {error && <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--ss-red)' }}>{error}</p>}
      {result && <ResultBox result={result.value} label={result.label} />}
    </div>
  );
}

function btnStyle(bg, color = 'var(--ss-text-primary)') {
  return {
    background: bg,
    border: '1px solid var(--ss-border)',
    color,
    borderRadius: 'var(--ss-radius-sm)',
    padding: '7px 14px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    transition: 'background 0.15s',
  };
}

// ── Conversion helpers ────────────────────────────────────────────────────────
const b64Encode = (s) => btoa(unescape(encodeURIComponent(s)));
const b64Decode = (s) => decodeURIComponent(escape(atob(s.trim())));
const b64urlEncode = (s) => b64Encode(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlDecode = (s) => {
  let t = s.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  return b64Decode(t);
};
const hexEncode = (s) => Array.from(new TextEncoder().encode(s)).map((b) => b.toString(16).padStart(2, '0')).join('');
const hexDecode = (s) => {
  const clean = s.trim().replace(/\s/g, '');
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error('Invalid hex string');
  const bytes = clean.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
  return new TextDecoder().decode(new Uint8Array(bytes));
};

export default function Encoders() {
  return (
    <SectionCard title="Base64 / Hex Encoder" icon={ArrowLeftRight} color="var(--ss-accent)">
      <EncoderPanel
        title="Base64 (standard)"
        encode={b64Encode}
        decode={b64Decode}
        inputPlaceholder="Enter text to encode / base64 to decode"
      />
      <EncoderPanel
        title="Base64 URL-safe"
        encode={b64urlEncode}
        decode={b64urlDecode}
        inputPlaceholder="Enter text to encode / base64url to decode"
      />
      <EncoderPanel
        title="Hex"
        encode={hexEncode}
        decode={hexDecode}
        inputPlaceholder="Enter text to encode / hex to decode"
      />
    </SectionCard>
  );
}
