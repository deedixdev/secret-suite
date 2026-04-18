'use client';
/**
 * Panels for simple one-click generators (no user input required).
 * Secret Generators, Encryption Keys, UUID & Random, Node-compat.
 */
import { useState } from 'react';
import { Key, RefreshCw, Hash, Fingerprint, Cpu } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import ResultBox from './ui/ResultBox';
import GenerateButton from './ui/GenerateButton';
import InputField from './ui/InputField';

async function callApi(type, params = {}) {
  const res = await fetch('/api/secret/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, params }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unknown error');
  return data.result;
}

// ─── One-click generator row ────────────────────────────────────────────────
function GenRow({ label, type, params }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try { setResult(await callApi(type, params)); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--ss-text-secondary)', minWidth: 180 }}>{label}</span>
        <GenerateButton onClick={run} loading={loading} label="Generate" icon={RefreshCw} />
      </div>
      {result && <ResultBox result={result} label={label} />}
    </div>
  );
}


// ─── Secret Generators ──────────────────────────────────────────────────────
export function SecretGenerators() {
  const [customBytes, setCustomBytes] = useState('32');
  const [pwLen, setPwLen] = useState('16');
  const [customResult, setCustomResult] = useState(null);
  const [pwResult, setPwResult]     = useState(null);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [loadingPw, setLoadingPw]         = useState(false);

  const runCustom = async () => {
    setLoadingCustom(true);
    try { setCustomResult(await callApi('custom-secret', { bytes: customBytes })); }
    catch (e) { setCustomResult('Error: ' + e.message); }
    finally { setLoadingCustom(false); }
  };
  const runPw = async () => {
    setLoadingPw(true);
    try { setPwResult(await callApi('random-password', { length: pwLen })); }
    catch (e) { setPwResult('Error: ' + e.message); }
    finally { setLoadingPw(false); }
  };

  return (
    <SectionCard title="Secret Generators" icon={Key} color="var(--ss-accent)" defaultOpen={true}>
      <GenRow label="JWT Secret (HS256/HS512)" type="jwt-secret" />
      <GenRow label="API Key"                   type="api-key" />
      <GenRow label="Webhook Secret (hex)"      type="webhook-secret" />
      <GenRow label="Password Pepper"           type="password-pepper" />

      {/* Custom length */}
      <div style={{ marginTop: '0.75rem', padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
        <InputField label="Custom-Length Secret" id="custom-bytes" value={customBytes} onChange={setCustomBytes} placeholder="32" hint="Length in bytes (max 512)" />
        <GenerateButton onClick={runCustom} loading={loadingCustom} label="Generate" icon={RefreshCw} />
        {customResult && <ResultBox result={customResult} label="Custom Secret" />}
      </div>

      {/* Random password */}
      <div style={{ marginTop: '0.6rem', padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
        <InputField label="Random Password" id="pw-len" value={pwLen} onChange={setPwLen} placeholder="16" hint="Length in characters (max 128)" />
        <GenerateButton onClick={runPw} loading={loadingPw} label="Generate" icon={RefreshCw} />
        {pwResult && <ResultBox result={pwResult} label="Random Password" />}
      </div>
    </SectionCard>
  );
}


// ─── Encryption Keys ────────────────────────────────────────────────────────
export function EncryptionKeys() {
  return (
    <SectionCard title="Encryption Keys" icon={Hash} color="var(--ss-green)">
      <GenRow label="32-byte Encryption Key (Base64 urlsafe)" type="enc-key-b64" />
      <GenRow label="256-bit AES Key (hex)"                   type="aes-key-hex" />
      <GenRow label="256-bit AES Key (urlsafe)"               type="aes-key-urlsafe" />
      <GenRow label="12-byte IV (hex)"                        type="iv-12" />
      <GenRow label="16-byte IV (hex)"                        type="iv-16" />
    </SectionCard>
  );
}


// ─── UUID & Random Data ─────────────────────────────────────────────────────
function RandomBytesRow({ label, type }) {
  const [bytes, setBytes] = useState('16');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try { setResult(await callApi(type, { bytes })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ marginBottom: '0.6rem', padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
      <InputField label={label} id={type + '-bytes'} value={bytes} onChange={setBytes} placeholder="16" hint="Number of bytes" />
      <GenerateButton onClick={run} loading={loading} label="Generate" icon={RefreshCw} />
      {result && <ResultBox result={result} label={label} />}
    </div>
  );
}

export function UuidRandom() {
  return (
    <SectionCard title="UUID & Random Data" icon={Fingerprint} color="var(--ss-purple)">
      <GenRow label="UUID v4" type="uuid-v4" />
      <RandomBytesRow label="Random Bytes (hex)"    type="random-hex" />
      <RandomBytesRow label="Random Bytes (base64)" type="random-b64" />
      <RandomBytesRow label="Random Bytes (urlsafe)"type="random-urlsafe" />
    </SectionCard>
  );
}


// ─── Node.js Compatible Generators ─────────────────────────────────────────
export function NodeCompat() {
  return (
    <SectionCard title="Node.js Compatible" icon={Cpu} color="var(--ss-amber)">
      <GenRow label="randomBytes(32).toString('hex').slice(0,32)" type="node-hex-slice32" />
      <GenRow label="randomBytes(16).toString('hex')"             type="node-hex16" />
      <GenRow label="randomBytes(32).toString('base64')"          type="node-b64-32" />
      <GenRow label="crypto.randomUUID()"                         type="node-uuid" />
    </SectionCard>
  );
}
