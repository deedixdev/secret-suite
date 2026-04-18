'use client';
/**
 * secret/components/SecurityTools.jsx
 * HTTP Security Headers Builder · PEM Certificate Inspector
 */
import { useState } from 'react';
import { ShieldAlert, FileKey } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import InputField from './ui/InputField';
import CopyButton from './ui/CopyButton';
import GenerateButton from './ui/GenerateButton';

const API = '/api/secret/generate';

// ── HTTP Security Headers Builder ─────────────────────────────────────────────
const DIRECTIVES = [
  { key: 'default-src',     label: "default-src",     hint: "'self'" },
  { key: 'script-src',      label: "script-src",      hint: "'self' 'nonce-{nonce}'" },
  { key: 'style-src',       label: "style-src",       hint: "'self' 'unsafe-inline'" },
  { key: 'img-src',         label: "img-src",         hint: "'self' data: https:" },
  { key: 'font-src',        label: "font-src",        hint: "'self' https://fonts.gstatic.com" },
  { key: 'connect-src',     label: "connect-src",     hint: "'self'" },
  { key: 'frame-ancestors', label: "frame-ancestors", hint: "'none'" },
  { key: 'object-src',      label: "object-src",      hint: "'none'" },
  { key: 'base-uri',        label: "base-uri",        hint: "'self'" },
  { key: 'form-action',     label: "form-action",     hint: "'self'" },
];

const DEFAULT_DIRECTIVES = {
  'default-src':     { enabled: true,  val: "'self'" },
  'script-src':      { enabled: true,  val: "'self'" },
  'style-src':       { enabled: true,  val: "'self' 'unsafe-inline'" },
  'img-src':         { enabled: true,  val: "'self' data:" },
  'font-src':        { enabled: false, val: "'self'" },
  'connect-src':     { enabled: false, val: "'self'" },
  'frame-ancestors': { enabled: true,  val: "'none'" },
  'object-src':      { enabled: true,  val: "'none'" },
  'base-uri':        { enabled: true,  val: "'self'" },
  'form-action':     { enabled: false, val: "'self'" },
};

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10, padding: 0, border: 'none', cursor: 'pointer',
        background: on ? 'var(--ss-accent)' : 'var(--ss-bg-elevated)', position: 'relative', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16,
        borderRadius: '50%', background: 'var(--ss-bg-primary)', transition: 'left 0.15s',
      }} />
    </button>
  );
}

export function HttpHeadersBuilder() {
  const [directives, setDirectives] = useState(DEFAULT_DIRECTIVES);
  const [hstsAge, setHstsAge]         = useState('31536000');
  const [hstsEnabled, setHstsEnabled] = useState(true);
  const [hstsSubdomains, setHstsSubdomains] = useState(true);
  const [hstsPreload, setHstsPreload]   = useState(false);
  const [xFrame, setXFrame]             = useState('DENY');
  const [xFrameEnabled, setXFrameEnabled] = useState(true);
  const [xContentType, setXContentType] = useState(true);
  const [referrer, setReferrer]         = useState('no-referrer');
  const [referrerEnabled, setReferrerEnabled] = useState(true);
  const [permissionsEnabled, setPermissionsEnabled] = useState(true);

  const setDir = (key, field, value) =>
    setDirectives((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const csp = DIRECTIVES.filter((d) => directives[d.key]?.enabled)
    .map((d) => `${d.key} ${directives[d.key].val}`)
    .join('; ');

  const headers = [];
  if (csp) headers.push(`Content-Security-Policy: ${csp}`);
  if (hstsEnabled) {
    let h = `max-age=${hstsAge || '31536000'}`;
    if (hstsSubdomains) h += '; includeSubDomains';
    if (hstsPreload) h += '; preload';
    headers.push(`Strict-Transport-Security: ${h}`);
  }
  if (xFrameEnabled) headers.push(`X-Frame-Options: ${xFrame}`);
  if (xContentType) headers.push(`X-Content-Type-Options: nosniff`);
  if (referrerEnabled) headers.push(`Referrer-Policy: ${referrer}`);
  if (permissionsEnabled) headers.push(`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`);
  headers.push(`X-XSS-Protection: 0`);

  const output = headers.join('\n');

  const labelStyle = { fontSize: '0.7rem', fontWeight: 700, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 };
  const rowStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--ss-border)' };
  const subLabel = { fontSize: '0.78rem', color: 'var(--ss-text-primary)', flex: 1 };

  return (
    <SectionCard title="HTTP Security Headers Builder" icon={ShieldAlert} color="var(--ss-amber)">
      <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: 'var(--ss-text-tertiary)' }}>
        Configure security headers visually. Copy the output into your server config or middleware.
      </p>

      {/* CSP */}
      <div style={{ marginBottom: 12 }}>
        <p style={labelStyle}>Content-Security-Policy</p>
        {DIRECTIVES.map((d) => (
          <div key={d.key} style={rowStyle}>
            <Toggle on={directives[d.key]?.enabled} onChange={(v) => setDir(d.key, 'enabled', v)} />
            <code style={{ fontSize: '0.73rem', color: 'var(--ss-purple)', width: 140, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{d.key}</code>
            <input
              value={directives[d.key]?.val ?? d.hint}
              onChange={(e) => setDir(d.key, 'val', e.target.value)}
              disabled={!directives[d.key]?.enabled}
              placeholder={d.hint}
              style={{
                flex: 1, background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-primary)', border: '1px solid var(--ss-border)',
                borderRadius: 'var(--ss-radius-sm)', padding: '3px 8px', fontSize: '0.73rem', fontFamily: "'JetBrains Mono', monospace",
                opacity: directives[d.key]?.enabled ? 1 : 0.4,
              }}
            />
          </div>
        ))}
      </div>

      {/* HSTS */}
      <div style={{ marginBottom: 10 }}>
        <p style={labelStyle}>Strict-Transport-Security</p>
        <div style={rowStyle}>
          <Toggle on={hstsEnabled} onChange={setHstsEnabled} />
          <span style={subLabel}>Enabled</span>
        </div>
        {hstsEnabled && (
          <>
            <div style={{ ...rowStyle, paddingLeft: 10 }}>
              <span style={{ fontSize: '0.73rem', color: 'var(--ss-text-tertiary)', width: 130 }}>max-age (seconds)</span>
              <input value={hstsAge} onChange={(e) => setHstsAge(e.target.value)} style={{ width: 120, background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-primary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-sm)', padding: '3px 8px', fontSize: '0.73rem', fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
            <div style={{ ...rowStyle, paddingLeft: 10 }}>
              <Toggle on={hstsSubdomains} onChange={setHstsSubdomains} />
              <span style={{ ...subLabel, fontSize: '0.73rem' }}>includeSubDomains</span>
            </div>
            <div style={{ ...rowStyle, paddingLeft: 10 }}>
              <Toggle on={hstsPreload} onChange={setHstsPreload} />
              <span style={{ ...subLabel, fontSize: '0.73rem' }}>preload</span>
            </div>
          </>
        )}
      </div>

      {/* Other headers */}
      <div style={{ marginBottom: 10 }}>
        <p style={labelStyle}>Other Headers</p>
        <div style={rowStyle}>
          <Toggle on={xFrameEnabled} onChange={setXFrameEnabled} />
          <span style={{ fontSize: '0.73rem', color: 'var(--ss-text-tertiary)', width: 130, flexShrink: 0 }}>X-Frame-Options</span>
          <select value={xFrame} onChange={(e) => setXFrame(e.target.value)} style={{ background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-primary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-sm)', padding: '3px 6px', fontSize: '0.73rem', fontFamily: 'Inter, sans-serif' }}>
            <option value="DENY">DENY</option>
            <option value="SAMEORIGIN">SAMEORIGIN</option>
          </select>
        </div>
        <div style={rowStyle}>
          <Toggle on={xContentType} onChange={setXContentType} />
          <span style={{ ...subLabel, fontSize: '0.73rem' }}>X-Content-Type-Options: nosniff</span>
        </div>
        <div style={rowStyle}>
          <Toggle on={referrerEnabled} onChange={setReferrerEnabled} />
          <span style={{ fontSize: '0.73rem', color: 'var(--ss-text-tertiary)', width: 130, flexShrink: 0 }}>Referrer-Policy</span>
          <select value={referrer} onChange={(e) => setReferrer(e.target.value)} style={{ background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-primary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-sm)', padding: '3px 6px', fontSize: '0.73rem', fontFamily: 'Inter, sans-serif' }}>
            {['no-referrer','no-referrer-when-downgrade','origin','origin-when-cross-origin','same-origin','strict-origin','strict-origin-when-cross-origin'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={rowStyle}>
          <Toggle on={permissionsEnabled} onChange={setPermissionsEnabled} />
          <span style={{ ...subLabel, fontSize: '0.73rem' }}>Permissions-Policy (camera, mic, geo, payment)</span>
        </div>
      </div>

      {/* Output */}
      <div style={{ background: 'var(--ss-bg-secondary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-md)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--ss-bg-tertiary)', borderBottom: '1px solid var(--ss-border)' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headers output</span>
          <CopyButton text={output} size={12} />
        </div>
        <pre style={{ margin: 0, padding: '10px 12px', fontSize: '0.73rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ss-text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {output || '(no headers selected)'}
        </pre>
      </div>
    </SectionCard>
  );
}

// ── PEM Certificate Inspector ─────────────────────────────────────────────────
export function PemInspector() {
  const [pem, setPem]       = useState('');
  const [info, setInfo]     = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const inspect = async () => {
    if (!pem.trim()) return;
    setLoading(true);
    setError('');
    setInfo(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pem-inspect', params: { pem } }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setInfo(json.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  function isExpired(validTo) {
    try { return new Date(validTo) < new Date(); } catch { return false; }
  }

  const Row = ({ label, value, color }) => (
    <tr>
      <td style={{ padding: '4px 10px', fontSize: '0.72rem', color: 'var(--ss-text-tertiary)', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top', borderBottom: '1px solid var(--ss-border)' }}>{label}</td>
      <td style={{ padding: '4px 10px', fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", color: color || 'var(--ss-text-secondary)', wordBreak: 'break-all', borderBottom: '1px solid var(--ss-border)' }}>{value || '—'}</td>
    </tr>
  );

  return (
    <SectionCard title="PEM Certificate Inspector" icon={FileKey} color="var(--ss-red)">
      <InputField label="PEM certificate" id="pem-input" value={pem} onChange={setPem} multiline rows={6} placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDdzCCAl+gA...&#10;-----END CERTIFICATE-----" />
      <div style={{ marginTop: 6 }}>
        <GenerateButton onClick={inspect} label={loading ? 'Inspecting…' : 'Inspect Certificate'} disabled={loading || !pem.trim()} />
      </div>
      {error && <p className="ss-fade-in" style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--ss-red)' }}>Error: {error}</p>}
      {info && (
        <div className="ss-fade-in" style={{ marginTop: 10, background: 'var(--ss-bg-secondary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '6px 10px', background: 'var(--ss-bg-tertiary)', borderBottom: '1px solid var(--ss-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ss-text-tertiary)' }}>Certificate Details</span>
            {info.isCA && <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'var(--ss-accent-dim)', color: 'var(--ss-accent)', borderRadius: 99, fontWeight: 700 }}>CA</span>}
            {isExpired(info.validTo) && <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'rgba(220,38,38,0.15)', color: 'var(--ss-red)', borderRadius: 99, fontWeight: 700 }}>EXPIRED</span>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <Row label="Subject"      value={info.subject} />
              <Row label="Issuer"       value={info.issuer} />
              <Row label="Valid from"   value={info.validFrom} color="var(--ss-green)" />
              <Row label="Valid to"     value={info.validTo}   color={isExpired(info.validTo) ? 'var(--ss-red)' : 'var(--ss-amber)'} />
              <Row label="Serial"       value={info.serialNumber} />
              <Row label="Key type"     value={`${info.keyType || '?'}${info.keySize ? ` (${info.keySize})` : ''}`} />
              <Row label="Fingerprint SHA-1"   value={info.fingerprint} />
              <Row label="Fingerprint SHA-256" value={info.fingerprint256} />
              {info.subjectAltName && <Row label="SANs" value={info.subjectAltName} />}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
