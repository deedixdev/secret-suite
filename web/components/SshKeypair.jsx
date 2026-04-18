'use client';
/**
 * secret/components/SshKeypair.jsx
 * Generate SSH ed25519 keypair in proper OpenSSH wire format.
 */
import { useState } from 'react';
import { Terminal } from 'lucide-react';
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

export default function SshKeypair() {
  const [comment, setComment] = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const keypair = await callApi('ssh-ed25519-keypair', { comment });
      setResult(keypair);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="SSH ed25519 Keypair" icon={Terminal} color="var(--ss-green)">
      <p style={{ fontSize: '0.78rem', color: 'var(--ss-text-tertiary)', marginBottom: '0.75rem' }}>
        Generates a proper OpenSSH ed25519 keypair — public key in SSH wire format, private key in OpenSSH PEM format. Drop directly into <code style={{ fontFamily: "'JetBrains Mono', monospace", background: 'var(--ss-bg-tertiary)', padding: '1px 4px', borderRadius: 3 }}>~/.ssh/</code>.
      </p>
      <InputField
        label="Comment (optional)"
        id="ssh-comment"
        value={comment}
        onChange={setComment}
        placeholder="user@hostname"
        hint="Appended to the public key line"
      />
      <GenerateButton onClick={generate} loading={loading} label="Generate Keypair" />

      {result && !result.error && (
        <div className="ss-fade-in" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Public Key — paste into authorized_keys / GitHub / Vercel
            </p>
            <ResultBox result={result.publicKey} label="id_ed25519.pub" />
          </div>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ss-red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Private Key — keep secret, save as id_ed25519
            </p>
            <ResultBox result={result.privateKey} label="id_ed25519 (private)" />
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--ss-text-tertiary)' }}>
            Save as <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>~/.ssh/id_ed25519</code> (chmod 600) and the public key as <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>~/.ssh/id_ed25519.pub</code>.
          </p>
        </div>
      )}
      {result?.error && <ResultBox result={'Error: ' + result.error} label="Error" />}
    </SectionCard>
  );
}
