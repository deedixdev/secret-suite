'use client';
/**
 * secret/components/DevTools.jsx
 * .env Formatter + Constant-time compare.
 */
import { useState } from 'react';
import { FileCode2, ShieldAlert } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import ResultBox from './ui/ResultBox';
import InputField from './ui/InputField';
import GenerateButton from './ui/GenerateButton';
import CopyButton from './ui/CopyButton';

// ── .env Formatter ─────────────────────────────────────────────────────────────
export function EnvFormatter() {
  const [pairs, setPairs] = useState([{ key: '', value: '' }]);
  const [output, setOutput] = useState('');

  const addRow = () => setPairs((p) => [...p, { key: '', value: '' }]);
  const removeRow = (i) => setPairs((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => setPairs((p) => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const generate = () => {
    const lines = pairs
      .filter((r) => r.key.trim())
      .map((r) => {
        const v = r.value;
        // Quote value if it contains spaces, special chars, or is empty
        const needsQuote = !v || /[\s"'#$`\\]/.test(v);
        const escaped = v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `${r.key.trim().toUpperCase()}="${needsQuote ? escaped : v}"`;
      });
    setOutput(lines.join('\n'));
  };

  return (
    <SectionCard title=".env Formatter" icon={FileCode2} color="var(--ss-green)">
      <div>
        {pairs.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 6 }}>
            <div style={{ flex: '0 0 160px' }}>
              <InputField
                label={i === 0 ? 'KEY' : undefined}
                id={`env-key-${i}`}
                value={row.key}
                onChange={(v) => updateRow(i, 'key', v)}
                placeholder="JWT_SECRET"
              />
            </div>
            <div style={{ flex: 1 }}>
              <InputField
                label={i === 0 ? 'VALUE' : undefined}
                id={`env-val-${i}`}
                value={row.value}
                onChange={(v) => updateRow(i, 'value', v)}
                placeholder="abc123..."
              />
            </div>
            {pairs.length > 1 && (
              <button
                onClick={() => removeRow(i)}
                style={{ background: 'transparent', border: 'none', color: 'var(--ss-text-tertiary)', cursor: 'pointer', padding: '0 4px', marginBottom: 12, fontSize: '1rem', lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <button
            onClick={addRow}
            style={{ background: 'var(--ss-bg-elevated)', border: '1px solid var(--ss-border)', color: 'var(--ss-text-secondary)', borderRadius: 'var(--ss-radius-sm)', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            + Add row
          </button>
          <button
            onClick={generate}
            style={{ background: 'var(--ss-btn-bg)', border: 'none', color: 'var(--ss-btn-text)', borderRadius: 'var(--ss-radius-sm)', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ss-btn-hover-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ss-btn-bg)')}
          >
            Format .env
          </button>
        </div>

        {output && (
          <div
            className="ss-fade-in"
            style={{ marginTop: '0.75rem', background: 'var(--ss-bg-secondary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-md)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--ss-bg-tertiary)', borderBottom: '1px solid var(--ss-border)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>.env output</span>
              <CopyButton text={output} size={13} />
            </div>
            <pre style={{ margin: 0, padding: '10px 12px', fontSize: '0.8rem', color: 'var(--ss-green)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {output}
            </pre>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ── Constant-time compare ──────────────────────────────────────────────────────
async function callApi(type, params) {
  const res = await fetch('/api/secret/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, params }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unknown error');
  return data.result;
}

export function ConstantTimeCompare() {
  const [a, setA]           = useState('');
  const [b, setB]           = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    setLoading(true);
    try { setResult(await callApi('const-time-compare', { a, b })); }
    catch (e) { setResult('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <SectionCard title="Constant-Time Compare" icon={ShieldAlert} color="var(--ss-red)">
      <p style={{ fontSize: '0.78rem', color: 'var(--ss-text-tertiary)', marginBottom: '0.75rem' }}>
        Compares two values using <code style={{ fontFamily: "'JetBrains Mono', monospace", background: 'var(--ss-bg-tertiary)', padding: '1px 4px', borderRadius: 3 }}>crypto.timingSafeEqual</code> to prevent timing attacks.
      </p>
      <InputField label="Value A" id="ctc-a" value={a} onChange={setA} multiline rows={2} placeholder="Hash, token, or secret A" />
      <InputField label="Value B" id="ctc-b" value={b} onChange={setB} multiline rows={2} placeholder="Hash, token, or secret B" />
      <GenerateButton onClick={compare} loading={loading} label="Compare" />
      {result && <ResultBox result={result} label="Result" />}
    </SectionCard>
  );
}
