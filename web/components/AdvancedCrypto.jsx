'use client';
/**
 * Advanced Crypto panel — AES-GCM, RSA, Ed25519, PGP, TOTP QR.
 */
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
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

// ── AES-GCM ─────────────────────────────────────────────────────────────────
function AesGcmPanel() {
  const [plaintext, setPlaintext] = useState('');
  const [aad, setAad]             = useState('');
  const [jsonBlob, setJsonBlob]   = useState('');
  const [encResult, setEncResult] = useState(null);
  const [decResult, setDecResult] = useState(null);
  const [loadingE, setLoadingE]   = useState(false);
  const [loadingD, setLoadingD]   = useState(false);

  const runEnc = async () => {
    setLoadingE(true);
    try { setEncResult(await callApi('aes-gcm-encrypt', { plaintext, aad })); }
    catch (e) { setEncResult('Error: ' + e.message); }
    finally { setLoadingE(false); }
  };
  const runDec = async () => {
    setLoadingD(true);
    try {
      const parsed = JSON.parse(jsonBlob);
      setDecResult(await callApi('aes-gcm-decrypt', parsed));
    } catch (e) { setDecResult('Error: ' + e.message); }
    finally { setLoadingD(false); }
  };

  return (
    <div style={{ padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)', marginBottom: '0.8rem' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>AES-256-GCM</p>
      <InputField label="Plaintext" id="aes-pt" value={plaintext} onChange={setPlaintext} multiline rows={2} placeholder="Text to encrypt" />
      <InputField label="AAD (optional)" id="aes-aad" value={aad} onChange={setAad} placeholder="Additional authenticated data" hint="Leave blank to skip" />
      <GenerateButton onClick={runEnc} loading={loadingE} label="Encrypt" />
      {encResult && <ResultBox result={encResult} label="AES-GCM Encrypted Blob" />}

      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--ss-border)', paddingTop: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--ss-text-tertiary)', marginBottom: '0.5rem' }}>Decrypt</p>
        <InputField label="AES-GCM JSON blob" id="aes-blob" value={jsonBlob} onChange={setJsonBlob} multiline rows={5} placeholder='{"key":"...","iv":"...","ciphertext":"...","tag":"..."}' />
        <GenerateButton onClick={runDec} loading={loadingD} label="Decrypt" />
        {decResult && <ResultBox result={decResult} label="Decrypted Plaintext" />}
      </div>
    </div>
  );
}

// ── Keypairs (one-click) ────────────────────────────────────────────────────
function KeypairPanel({ label, type, note }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try { setResult(await callApi(type)); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)', marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', margin: 0 }}>{label}</p>
          {note && <p style={{ fontSize: '0.7rem', color: 'var(--ss-text-tertiary)', margin: '2px 0 0' }}>{note}</p>}
        </div>
        <GenerateButton onClick={run} loading={loading} label="Generate Keypair" />
      </div>
      {result && <ResultBox result={result} label={label} />}
    </div>
  );
}

// ── PGP ─────────────────────────────────────────────────────────────────────
function PgpPanel() {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const run = async () => {
    setLoading(true);
    try { setResult(await callApi('pgp-keypair', { name, email, passphrase })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)', marginBottom: '0.8rem' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>PGP RSA-4096 Keypair</p>
      <InputField label="Name" id="pgp-name" value={name} onChange={setName} placeholder="John Doe" required />
      <InputField label="Email" id="pgp-email" value={email} onChange={setEmail} type="email" placeholder="john@example.com" required />
      <InputField label="Passphrase (optional)" id="pgp-pass" value={passphrase} onChange={setPassphrase} type="password" placeholder="Leave blank for no passphrase" />
      <GenerateButton onClick={run} loading={loading} label="Generate PGP Keypair" />
      {result && <ResultBox result={result} label="PGP Keypair" />}
    </div>
  );
}

// ── TOTP QR ─────────────────────────────────────────────────────────────────
function TotpPanel() {
  const [issuer, setIssuer]   = useState('');
  const [account, setAccount] = useState('');
  const [secret, setSecret]   = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try { setResult(await callApi('totp-qr', { issuer, account, secret })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>TOTP QR (otpauth://)</p>
      <InputField label="Issuer" id="totp-issuer" value={issuer} onChange={setIssuer} placeholder="DeediX Mail" required />
      <InputField label="Account" id="totp-account" value={account} onChange={setAccount} placeholder="user@example.com" required />
      <InputField label="TOTP Secret (Base32, blank = random)" id="totp-secret" value={secret} onChange={setSecret} placeholder="Optional — auto-generated if blank" />
      <GenerateButton onClick={run} loading={loading} label="Generate QR" />
      {result && (
        <div className="ss-fade-in" style={{ marginTop: '1rem' }}>
          {result.qrDataUrl && (
            <img src={result.qrDataUrl} alt="TOTP QR Code" style={{ width: 180, height: 180, display: 'block', marginBottom: '0.75rem', borderRadius: 'var(--ss-radius-sm)' }} />
          )}
          <ResultBox result={{ uri: result.uri, secret: result.secret }} label="TOTP Details" />
        </div>
      )}
    </div>
  );
}

export default function AdvancedCrypto() {
  return (
    <SectionCard title="Advanced Crypto" icon={ShieldCheck} color="var(--ss-purple)">
      <AesGcmPanel />
      <KeypairPanel label="RSA-4096 Keypair" type="rsa-keypair" note="Generation may take a moment — 4096-bit modulus" />
      <KeypairPanel label="Ed25519 Keypair"  type="ed25519-keypair" />
      <PgpPanel />
      <TotpPanel />
    </SectionCard>
  );
}
