'use client';

/**
 * secret-suite/components/ui/CopyButton.jsx
 * Copies text to clipboard; shows green tick on success.
 */
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CopyButton({ text, size = 14 }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: copied ? 'var(--ss-green)' : 'var(--ss-text-tertiary)',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 'var(--ss-radius-sm)',
        transition: 'color 0.15s',
        flexShrink: 0,
      }}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}
