'use client';
/**
 * secret-suite/components/ui/InputField.jsx
 * Minimal styled input / textarea for the crypto forms.
 */
export default function InputField({
  label,
  id,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  multiline = false,
  rows = 3,
  hint = '',
  required = false,
}) {
  const shared = {
    width: '100%',
    background: 'var(--ss-bg-tertiary)',
    border: '1px solid var(--ss-border)',
    borderRadius: 'var(--ss-radius-sm)',
    color: 'var(--ss-text-primary)',
    fontSize: '0.875rem',
    fontFamily: type === 'password' ? "'JetBrains Mono', monospace" : 'Inter, sans-serif',
    padding: '9px 11px',
    outline: 'none',
    transition: 'border-color 0.15s',
    resize: 'vertical',
  };

  return (
    <div style={{ marginBottom: '0.85rem' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--ss-text-secondary)',
            marginBottom: '5px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--ss-red)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          style={shared}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ss-accent)')}
          onBlur={(e)  => (e.target.style.borderColor = 'var(--ss-border)')}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={shared}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ss-accent)')}
          onBlur={(e)  => (e.target.style.borderColor = 'var(--ss-border)')}
        />
      )}
      {hint && (
        <p style={{ marginTop: 4, fontSize: '0.73rem', color: 'var(--ss-text-tertiary)' }}>{hint}</p>
      )}
    </div>
  );
}
