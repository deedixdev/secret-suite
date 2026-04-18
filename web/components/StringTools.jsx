'use client';
/**
 * secret/components/StringTools.jsx
 * URL Encoder/Decoder · Base32 Encoder/Decoder · String Escaper
 */
import { useState } from 'react';
import { Link2, Grid2X2, Braces } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import InputField from './ui/InputField';
import CopyButton from './ui/CopyButton';

// ── Base32 (RFC 4648) ─────────────────────────────────────────────────────────
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const B32_MAP = Object.fromEntries([...B32].map((c, i) => [c, i]));

function base32Encode(input) {
  const bytes = new TextEncoder().encode(input);
  let bits = 0, val = 0, out = '';
  for (const b of bytes) {
    val = (val << 8) | b;
    bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  while (out.length % 8) out += '=';
  return out;
}

function base32Decode(input) {
  const s = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0, val = 0;
  const bytes = [];
  for (const c of s) {
    if (!(c in B32_MAP)) throw new Error(`Invalid Base32 character: "${c}"`);
    val = (val << 5) | B32_MAP[c];
    bits += 5;
    if (bits >= 8) { bytes.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// ── HTML entity helpers ───────────────────────────────────────────────────────
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function unescapeHtml(s) {
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
          .replace(/&quot;/g,'"').replace(/&#39;/g,"'")
          .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function escapeJson(s) { return JSON.stringify(s); }
function unescapeJson(s) {
  try { return JSON.parse(s); } catch { throw new Error('Invalid JSON string'); }
}
function escapeShell(s) { return "'" + s.replace(/'/g, "'\\''") + "'"; }

// ── Result display ────────────────────────────────────────────────────────────
function Out({ value, error }) {
  if (!value && !error) return null;
  return (
    <div
      className="ss-fade-in"
      style={{
        marginTop: 10,
        background: 'var(--ss-bg-secondary)',
        border: `1px solid ${error ? 'var(--ss-red)' : 'var(--ss-border)'}`,
        borderRadius: 'var(--ss-radius-md)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 10px', background: 'var(--ss-bg-tertiary)',
        borderBottom: '1px solid var(--ss-border)',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: error ? 'var(--ss-red)' : 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {error ? 'Error' : 'Result'}
        </span>
        {!error && <CopyButton text={value} size={12} />}
      </div>
      <pre style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace", color: error ? 'var(--ss-red)' : 'var(--ss-green)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {error || value}
      </pre>
    </div>
  );
}

function ActionBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--ss-btn-bg)', color: 'var(--ss-btn-text)', border: 'none',
        borderRadius: 'var(--ss-radius-sm)', padding: '6px 14px',
        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ss-btn-hover-bg)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ss-btn-bg)')}
    >
      {children}
    </button>
  );
}

// ── URL Encoder / Decoder ─────────────────────────────────────────────────────
export function UrlEncoderDecoder() {
  const [input, setInput]   = useState('');
  const [output, setOutput] = useState('');
  const [error, setError]   = useState('');

  const run = (fn) => {
    setError('');
    try { setOutput(fn(input)); } catch (e) { setError(e.message); setOutput(''); }
  };

  return (
    <SectionCard title="URL Encoder / Decoder" icon={Link2} color="var(--ss-accent)">
      <InputField label="Input" id="url-input" value={input} onChange={setInput} multiline rows={3} placeholder="https://example.com/path?q=hello world" />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <ActionBtn onClick={() => run((s) => encodeURIComponent(s))}>Encode (component)</ActionBtn>
        <ActionBtn onClick={() => run((s) => encodeURI(s))}>Encode (URI)</ActionBtn>
        <ActionBtn onClick={() => run((s) => decodeURIComponent(s))}>Decode (component)</ActionBtn>
        <ActionBtn onClick={() => run((s) => decodeURI(s))}>Decode (URI)</ActionBtn>
      </div>
      <Out value={output} error={error} />
    </SectionCard>
  );
}

// ── Base32 Encoder / Decoder ──────────────────────────────────────────────────
export function Base32Tool() {
  const [input, setInput]   = useState('');
  const [output, setOutput] = useState('');
  const [error, setError]   = useState('');

  const run = (fn) => {
    setError('');
    try { setOutput(fn(input)); } catch (e) { setError(e.message); setOutput(''); }
  };

  return (
    <SectionCard title="Base32 Encoder / Decoder" icon={Grid2X2} color="var(--ss-amber)">
      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--ss-text-tertiary)' }}>RFC 4648 — same alphabet used by TOTP secrets.</p>
      <InputField label="Input" id="b32-input" value={input} onChange={setInput} multiline rows={3} placeholder="Text to encode  or  JBSWY3DPEB3W64TMMQ====== to decode" />
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <ActionBtn onClick={() => run(base32Encode)}>Encode</ActionBtn>
        <ActionBtn onClick={() => run(base32Decode)}>Decode</ActionBtn>
      </div>
      <Out value={output} error={error} />
    </SectionCard>
  );
}

// ── String Escaper ────────────────────────────────────────────────────────────
const ESCAPE_MODES = [
  { id: 'html-esc',   label: 'HTML Escape',   fn: escapeHtml },
  { id: 'html-unesc', label: 'HTML Unescape', fn: unescapeHtml },
  { id: 'json-esc',   label: 'JSON Stringify',fn: escapeJson },
  { id: 'json-unesc', label: 'JSON Parse',    fn: (s) => { const v = unescapeJson(s); return typeof v === 'string' ? v : JSON.stringify(v, null, 2); } },
  { id: 'shell',      label: 'Shell Escape',  fn: escapeShell },
  { id: 'b64-enc',    label: 'Base64 Encode', fn: (s) => btoa(unescape(encodeURIComponent(s))) },
  { id: 'b64-dec',    label: 'Base64 Decode', fn: (s) => decodeURIComponent(escape(atob(s.trim()))) },
];

export function StringEscaper() {
  const [input, setInput]   = useState('');
  const [output, setOutput] = useState('');
  const [error, setError]   = useState('');

  const run = (fn) => {
    setError('');
    try { setOutput(fn(input)); } catch (e) { setError(e.message); setOutput(''); }
  };

  return (
    <SectionCard title="String Escaper / Transformer" icon={Braces} color="var(--ss-purple)">
      <InputField label="Input" id="esc-input" value={input} onChange={setInput} multiline rows={4} placeholder="Paste your string here" />
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
        {ESCAPE_MODES.map((m) => (
          <ActionBtn key={m.id} onClick={() => run(m.fn)}>{m.label}</ActionBtn>
        ))}
      </div>
      <Out value={output} error={error} />
    </SectionCard>
  );
}
