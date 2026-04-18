'use client';
/**
 * Password Hashing panel — bcrypt, PBKDF2, Argon2id.
 */
import { useState } from 'react';
import { Lock } from 'lucide-react';
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

function BcryptPanel() {
  const [pwd, setPwd]       = useState('');
  const [rounds, setRounds] = useState('12');
  const [hash, setHash]     = useState('');
  const [verifyPwd, setVerifyPwd] = useState('');
  const [result, setResult] = useState(null);
  const [loadingH, setLoadingH] = useState(false);
  const [loadingV, setLoadingV] = useState(false);

  const runHash = async () => {
    setLoadingH(true);
    try { setResult(await callApi('bcrypt-hash', { password: pwd, rounds })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoadingH(false); }
  };
  const runVerify = async () => {
    setLoadingV(true);
    try { setResult(await callApi('bcrypt-verify', { password: verifyPwd, hash })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoadingV(false); }
  };

  return (
    <div style={{ padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)', marginBottom: '0.8rem' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>Bcrypt</p>
      <InputField label="Password" id="bcrypt-pwd" value={pwd} onChange={setPwd} type="password" placeholder="Enter password" />
      <InputField label="Salt rounds" id="bcrypt-rounds" value={rounds} onChange={setRounds} placeholder="12" hint="4–16 recommended" />
      <GenerateButton onClick={runHash} loading={loadingH} label="Hash Password" />

      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--ss-border)', paddingTop: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--ss-text-tertiary)', marginBottom: '0.5rem' }}>Verify</p>
        <InputField label="Bcrypt hash" id="bcrypt-hash-in" value={hash} onChange={setHash} placeholder="$2b$12$..." />
        <InputField label="Password to verify" id="bcrypt-verify-pwd" value={verifyPwd} onChange={setVerifyPwd} type="password" placeholder="Enter password" />
        <GenerateButton onClick={runVerify} loading={loadingV} label="Verify" />
      </div>
      {result && <ResultBox result={result} label="Bcrypt Result" />}
    </div>
  );
}

function Pbkdf2Panel() {
  const [pwd, setPwd]         = useState('');
  const [iterations, setIter] = useState('310000');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try { setResult(await callApi('pbkdf2-hash', { password: pwd, iterations })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)', marginBottom: '0.8rem' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>PBKDF2-HMAC-SHA256</p>
      <InputField label="Password" id="pbkdf2-pwd" value={pwd} onChange={setPwd} type="password" placeholder="Enter password" />
      <InputField label="Iterations" id="pbkdf2-iter" value={iterations} onChange={setIter} placeholder="310000" hint="Default 310,000 (NIST recommended)" />
      <GenerateButton onClick={run} loading={loading} label="Hash Password" />
      {result && <ResultBox result={result} label="PBKDF2 Result" />}
    </div>
  );
}

function Argon2Panel() {
  const [pwd, setPwd]         = useState('');
  const [hash, setHash]       = useState('');
  const [verifyPwd, setVPwd]  = useState('');
  const [result, setResult]   = useState(null);
  const [loadingH, setLoadingH] = useState(false);
  const [loadingV, setLoadingV] = useState(false);

  const runHash = async () => {
    setLoadingH(true);
    try { setResult(await callApi('argon2-hash', { password: pwd })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoadingH(false); }
  };
  const runVerify = async () => {
    setLoadingV(true);
    try { setResult(await callApi('argon2-verify', { hash, password: verifyPwd })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoadingV(false); }
  };
  return (
    <div style={{ padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ss-text-secondary)', marginBottom: '0.5rem' }}>Argon2id <span style={{ color: 'var(--ss-green)', fontWeight: 400, fontSize: '0.7rem' }}>(recommended)</span></p>
      <InputField label="Password" id="argon2-pwd" value={pwd} onChange={setPwd} type="password" placeholder="Enter password" />
      <GenerateButton onClick={runHash} loading={loadingH} label="Hash Password" />
      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--ss-border)', paddingTop: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--ss-text-tertiary)', marginBottom: '0.5rem' }}>Verify</p>
        <InputField label="Argon2id hash" id="argon2-hash-in" value={hash} onChange={setHash} placeholder="$argon2id$..." />
        <InputField label="Password to verify" id="argon2-verify-pwd" value={verifyPwd} onChange={setVPwd} type="password" placeholder="Enter password" />
        <GenerateButton onClick={runVerify} loading={loadingV} label="Verify" />
      </div>
      {result && <ResultBox result={result} label="Argon2id Result" />}
    </div>
  );
}

export default function PasswordHashing() {
  return (
    <SectionCard title="Password Hashing" icon={Lock} color="var(--ss-red)">
      <BcryptPanel />
      <Pbkdf2Panel />
      <Argon2Panel />
    </SectionCard>
  );
}
