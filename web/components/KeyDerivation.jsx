'use client';
/**
 * secret/components/KeyDerivation.jsx
 * HKDF Key Derivation · scrypt Key Derivation · ECDH Keypair Generator
 */
import { useState } from 'react';
import { Layers, Lock, KeySquare } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import InputField from './ui/InputField';
import CopyButton from './ui/CopyButton';
import GenerateButton from './ui/GenerateButton';

const API = '/api/secret/generate';

// ── Shared result block ───────────────────────────────────────────────────────
function ResultBlock({ label, value }) {
  return (
    <div style={{ marginBottom: 6, background: 'var(--ss-bg-secondary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-md)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', background: 'var(--ss-bg-tertiary)', borderBottom: '1px solid var(--ss-border)' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <CopyButton text={value} size={12} />
      </div>
      <pre style={{ margin: 0, padding: '7px 12px', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--ss-green)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {value}
      </pre>
    </div>
  );
}

// ── HKDF Key Derivation ───────────────────────────────────────────────────────
export function HkdfDerive() {
  const [ikm, setIkm]       = useState('');
  const [salt, setSalt]     = useState('');
  const [info, setInfo]     = useState('');
  const [length, setLength] = useState('32');
  const [digest, setDigest] = useState('sha256');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!ikm.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hkdf-derive', params: { ikm, salt, info, length: Number(length) || 32, digest } }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResult(json.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="HKDF Key Derivation" icon={Layers} color="var(--ss-accent)">
      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--ss-text-tertiary)' }}>
        HMAC-based Extract-and-Expand Key Derivation Function (RFC 5869). Derives a cryptographically strong key from input key material.
      </p>
      <InputField label="Input Key Material (IKM)" id="hkdf-ikm" value={ikm} onChange={setIkm} placeholder="Secret key, password, or shared secret" />
      <InputField label="Salt (optional)" id="hkdf-salt" value={salt} onChange={setSalt} placeholder="Random value, leave empty for all-zeros" />
      <InputField label="Info / context (optional)" id="hkdf-info" value={info} onChange={setInfo} placeholder="Application context string" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 90 }}>
          <InputField label="Output bytes" id="hkdf-len" value={length} onChange={setLength} placeholder="32" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Digest</label>
          <select
            value={digest}
            onChange={(e) => setDigest(e.target.value)}
            style={{ background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-primary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-sm)', padding: '6px 8px', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif' }}
          >
            {['sha256','sha384','sha512'].map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
          </select>
        </div>
        <GenerateButton onClick={run} label={loading ? 'Deriving…' : 'Derive Key'} disabled={loading || !ikm.trim()} />
      </div>
      {error && <p className="ss-fade-in" style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--ss-red)' }}>Error: {error}</p>}
      {result && (
        <div className="ss-fade-in" style={{ marginTop: 10 }}>
          <ResultBlock label={`Hex (${result.hex.length / 2} bytes)`} value={result.hex} />
          <ResultBlock label="Base64" value={result.base64} />
        </div>
      )}
    </SectionCard>
  );
}

// ── scrypt Key Derivation ─────────────────────────────────────────────────────
export function ScryptDerive() {
  const [password, setPassword] = useState('');
  const [salt, setSalt]         = useState('');
  const [keylen, setKeylen]     = useState('32');
  const [N, setN]               = useState('16384');
  const [r, setR]               = useState('8');
  const [p, setP]               = useState('1');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const run = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scrypt-derive', params: { password, salt: salt || 'salt', keylen: Number(keylen) || 32, N: Number(N) || 16384, r: Number(r) || 8, p: Number(p) || 1 } }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResult(json.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const paramInput = (label, val, setter, id) => (
    <div style={{ width: 90 }}>
      <InputField label={label} id={id} value={val} onChange={setter} placeholder="" />
    </div>
  );

  return (
    <SectionCard title="scrypt Key Derivation" icon={Lock} color="var(--ss-purple)">
      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--ss-text-tertiary)' }}>
        Memory-hard password-based key derivation (RFC 7914). Resistant to GPU/ASIC attacks. N must be a power of 2.
      </p>
      <InputField label="Password" id="sc-pw" value={password} onChange={setPassword} placeholder="Password or secret to derive from" />
      <InputField label="Salt" id="sc-salt" value={salt} onChange={setSalt} placeholder="Random salt (leave empty for 'salt')" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {paramInput('Key length', keylen, setKeylen, 'sc-kl')}
        {paramInput('N (CPU/mem cost)', N, setN, 'sc-n')}
        {paramInput('r (block size)', r, setR, 'sc-r')}
        {paramInput('p (parallelism)', p, setP, 'sc-p')}
        <GenerateButton onClick={run} label={loading ? 'Deriving…' : 'Derive Key'} disabled={loading || !password.trim()} />
      </div>
      {error && <p className="ss-fade-in" style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--ss-red)' }}>Error: {error}</p>}
      {result && (
        <div className="ss-fade-in" style={{ marginTop: 10 }}>
          <ResultBlock label={`Hex (${result.hex.length / 2} bytes)`} value={result.hex} />
          <ResultBlock label="Base64" value={result.base64} />
        </div>
      )}
    </SectionCard>
  );
}

// ── ECDH Keypair Generator ────────────────────────────────────────────────────
const CURVES = [
  { id: 'prime256v1', label: 'P-256 (prime256v1)' },
  { id: 'secp384r1',  label: 'P-384 (secp384r1)'  },
  { id: 'secp521r1',  label: 'P-521 (secp521r1)'  },
];

export function EcdhKeypair() {
  const [curve, setCurve]   = useState('prime256v1');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab]       = useState('pem');

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ecdh-keypair', params: { curve } }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResult(json.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="ECDH Keypair Generator" icon={KeySquare} color="var(--ss-green)">
      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--ss-text-tertiary)' }}>
        Generates an Elliptic Curve Diffie-Hellman keypair for key exchange. Output includes PEM and JWK formats.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Curve</label>
          <select
            value={curve}
            onChange={(e) => setCurve(e.target.value)}
            style={{ background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-primary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-sm)', padding: '6px 8px', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif' }}
          >
            {CURVES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <GenerateButton onClick={generate} label={loading ? 'Generating…' : 'Generate Keypair'} disabled={loading} />
      </div>
      {error && <p className="ss-fade-in" style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--ss-red)' }}>Error: {error}</p>}
      {result && (
        <div className="ss-fade-in" style={{ marginTop: 8 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {['pem','jwk'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600,
                  background: tab === t ? 'var(--ss-accent-dim)' : 'var(--ss-bg-elevated)',
                  color: tab === t ? 'var(--ss-accent)' : 'var(--ss-text-secondary)',
                  border: `1px solid ${tab === t ? 'var(--ss-accent)' : 'var(--ss-border)'}`,
                  borderRadius: 'var(--ss-radius-sm)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          {tab === 'pem' ? (
            <>
              <ResultBlock label="Public Key (SPKI PEM)" value={result.publicKey} />
              <ResultBlock label="Private Key (PKCS8 PEM)" value={result.privateKey} />
            </>
          ) : (
            <>
              <ResultBlock label="Public Key JWK" value={result.jwkPublic} />
              <ResultBlock label="Private Key JWK" value={result.jwkPrivate} />
            </>
          )}
        </div>
      )}
    </SectionCard>
  );
}
