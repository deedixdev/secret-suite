'use client';
/**
 * secret/components/DataTools.jsx
 * Checksum Calculator · QR Code Generator
 */
import { useState } from 'react';
import { Hash, QrCode } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import InputField from './ui/InputField';
import CopyButton from './ui/CopyButton';
import GenerateButton from './ui/GenerateButton';

const API = '/api/secret/generate';

// ── Shared helpers ────────────────────────────────────────────────────────────
function Out({ value, error, imageUrl }) {
  if (!value && !error && !imageUrl) return null;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--ss-bg-tertiary)', borderBottom: '1px solid var(--ss-border)' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: error ? 'var(--ss-red)' : 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {error ? 'Error' : 'Result'}
        </span>
        {!error && value && <CopyButton text={value} size={12} />}
      </div>
      {imageUrl ? (
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center', background: '#fff' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="QR code" style={{ display: 'block', maxWidth: 256 }} />
        </div>
      ) : (
        <pre style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace", color: error ? 'var(--ss-red)' : 'var(--ss-green)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {error || value}
        </pre>
      )}
    </div>
  );
}

// ── Checksum Calculator ───────────────────────────────────────────────────────
const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'];

export function ChecksumCalc() {
  const [input, setInput]   = useState('');
  const [algo, setAlgo]     = useState('sha256');
  const [result, setResult] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'checksum', params: { input, algorithm: algo } }),
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
    <SectionCard title="Checksum Calculator" icon={Hash} color="var(--ss-amber)">
      <InputField label="Input text" id="cs-input" value={input} onChange={setInput} multiline rows={3} placeholder="Paste text to hash" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {ALGORITHMS.map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              style={{
                padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600,
                background: algo === a ? 'var(--ss-accent-dim)' : 'var(--ss-bg-elevated)',
                color: algo === a ? 'var(--ss-accent)' : 'var(--ss-text-secondary)',
                border: `1px solid ${algo === a ? 'var(--ss-accent)' : 'var(--ss-border)'}`,
                borderRadius: 'var(--ss-radius-sm)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {a.toUpperCase()}
            </button>
          ))}
        </div>
        <GenerateButton onClick={run} label={loading ? 'Hashing…' : 'Compute'} disabled={loading || !input.trim()} />
      </div>
      <Out value={result} error={error} />
    </SectionCard>
  );
}

// ── QR Code Generator ─────────────────────────────────────────────────────────
const EC_LEVELS = [
  { id: 'L', label: 'L – Low (7%)'    },
  { id: 'M', label: 'M – Medium (15%)' },
  { id: 'Q', label: 'Q – Quartile (25%)' },
  { id: 'H', label: 'H – High (30%)'  },
];

export function QrGenerator() {
  const [text, setText]     = useState('');
  const [level, setLevel]   = useState('M');
  const [imgUrl, setImgUrl] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setImgUrl('');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'qr-generate', params: { text, errorCorrectionLevel: level } }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setImgUrl(json.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  return (
    <SectionCard title="QR Code Generator" icon={QrCode} color="var(--ss-purple)">
      <InputField label="Content" id="qr-text" value={text} onChange={setText} multiline rows={3} placeholder="URL, text, vCard, Wi-Fi config…" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          style={{ background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-primary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-sm)', padding: '5px 8px', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif' }}
        >
          {EC_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <GenerateButton onClick={generate} label={loading ? 'Generating…' : 'Generate QR'} disabled={loading || !text.trim()} />
        {imgUrl && (
          <button
            onClick={download}
            style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600, background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-secondary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-sm)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            Download PNG
          </button>
        )}
      </div>
      {error && <p className="ss-fade-in" style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--ss-red)' }}>Error: {error}</p>}
      {imgUrl && (
        <div className="ss-fade-in" style={{ marginTop: 12, display: 'flex', justifyContent: 'center', padding: 16, background: '#fff', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-md)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt="Generated QR code" style={{ display: 'block', maxWidth: 256 }} />
        </div>
      )}
    </SectionCard>
  );
}
