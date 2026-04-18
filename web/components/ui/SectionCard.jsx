'use client';
/**
 * secret-suite/components/ui/SectionCard.jsx
 * Collapsible card wrapping a crypto tool section.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SectionCard({ title, icon: Icon, color = 'var(--ss-accent)', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: 'var(--ss-card-bg)',
        border: '1px solid var(--ss-card-border)',
        borderRadius: 'var(--ss-radius-lg)',
        overflow: 'hidden',
        marginBottom: '1px',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ss-text-primary)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={15} style={{ color, flexShrink: 0 }} />}
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--ss-text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--ss-text-tertiary)' }} />}
      </button>

      {/* Body */}
      {open && (
        <div
          className="ss-fade-in"
          style={{ padding: '0 16px 16px' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
