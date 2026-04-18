'use client';

/**
 * secret-suite/components/ui/ResultBox.jsx
 * Displays the result of a crypto operation — handles string and object results.
 */
import CopyButton from './CopyButton';

export default function ResultBox({ result, label = 'Result' }) {
  if (result === null || result === undefined) return null;

  const isObj = typeof result === 'object';
  const displayText = isObj ? JSON.stringify(result, null, 2) : String(result);
  const isEmpty = displayText.trim() === '';

  return (
    <div
      className="ss-fade-in"
      style={{
        marginTop: '1rem',
        background: 'var(--ss-bg-secondary)',
        border: '1px solid var(--ss-border)',
        borderRadius: 'var(--ss-radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--ss-border)',
          background: 'var(--ss-bg-tertiary)',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--ss-text-tertiary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <CopyButton text={result} size={13} />
      </div>

      {/* Body */}
      <pre
        className="ss-scrollbar"
        style={{
          margin: 0,
          padding: '12px',
          fontSize: '0.8rem',
          lineHeight: '1.7',
          color: isEmpty ? 'var(--ss-text-tertiary)' : 'var(--ss-green)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight: '320px',
          overflowY: 'auto',
        }}
      >
        {isEmpty ? '—' : displayText}
      </pre>
    </div>
  );
}
