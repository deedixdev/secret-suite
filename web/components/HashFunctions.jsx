'use client';
/**
 * Hash Functions panel — SHA*, SHA3*, HMAC.
 */
import { useState } from 'react';
import { Hash } from 'lucide-react';
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

function DataHashRow({ label, type }) {
  const [data, setData] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try { setResult(await callApi(type, { data })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ marginBottom: '0.8rem', padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
      <InputField label={label} id={type + '-data'} value={data} onChange={setData} placeholder="Enter data to hash" />
      <GenerateButton onClick={run} loading={loading} label="Hash" />
      {result && <ResultBox result={result} label={label} />}
    </div>
  );
}

function HmacRow({ label, type }) {
  const [key, setKey]   = useState('');
  const [data, setData] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try { setResult(await callApi(type, { key, data })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ marginBottom: '0.8rem', padding: '10px', background: 'var(--ss-bg-tertiary)', borderRadius: 'var(--ss-radius-sm)' }}>
      <InputField label={`${label} — Key`} id={type + '-key'}  value={key}  onChange={setKey}  placeholder="HMAC key" />
      <InputField label={`${label} — Data`} id={type + '-data'} value={data} onChange={setData} placeholder="Data to sign" />
      <GenerateButton onClick={run} loading={loading} label="Sign" />
      {result && <ResultBox result={result} label={label} />}
    </div>
  );
}

export default function HashFunctions() {
  return (
    <SectionCard title="Hash Functions" icon={Hash} color="var(--ss-amber)">
      <DataHashRow label="SHA-256"  type="sha256" />
      <DataHashRow label="SHA-512"  type="sha512" />
      <DataHashRow label="SHA3-256" type="sha3-256" />
      <DataHashRow label="SHA3-512" type="sha3-512" />
      <HmacRow     label="HMAC-SHA256" type="hmac-sha256" />
      <HmacRow     label="HMAC-SHA512" type="hmac-sha512" />
    </SectionCard>
  );
}
