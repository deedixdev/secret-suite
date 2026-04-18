'use client';
/**
 * secret/components/Overview.jsx
 * Landing page — suite description, usage guide, tool index.
 */
import {
  Key, Lock, Shuffle, PackageCheck,
  Hash, ShieldOff,
  Zap, Terminal,
  Code2, ScanSearch, Clock,
  FileCode, ShieldAlert,
  ArrowRight, Info, MousePointerClick, ShieldCheck,
  Link2, Grid2X2, Braces,
  TextSearch, Database, QrCode,
  Layers, KeySquare, FileKey,
} from 'lucide-react';

const VERSION = 'v1.0.0';

const GROUPS = [
  {
    label: 'Generators',
    accent: 'var(--ss-accent)',
    accentDim: 'var(--ss-accent-dim)',
    tools: [
      { id: 'secret-gen',  icon: Key,          label: 'Secret Generators',   line: 'Cryptographically-random JWT secrets, API keys, webhook secrets, and password peppers.' },
      { id: 'enc-keys',    icon: Lock,         label: 'Encryption Keys',     line: 'AES-256 keys and IVs produced in Base64, Hex, and URL-safe encodings.' },
      { id: 'uuid-rand',   icon: Shuffle,      label: 'UUID & Random',       line: 'UUID v4 and raw random bytes as hex, Base64, or URL-safe strings.' },
      { id: 'node-compat', icon: PackageCheck, label: 'Node Compat',         line: 'Shorthand generators matching the output of Node.js crypto.randomBytes.' },
    ],
  },
  {
    label: 'Hashing',
    accent: 'var(--ss-amber)',
    accentDim: 'var(--ss-amber-dim)',
    tools: [
      { id: 'hash-fn',  icon: Hash,     label: 'Hash Functions',   line: 'SHA-256, SHA-512, SHA3-256, SHA3-512, HMAC-SHA256, and HMAC-SHA512.' },
      { id: 'pwd-hash', icon: ShieldOff, label: 'Password Hashing', line: 'bcrypt, PBKDF2, and Argon2id with configurable cost — hash and verify.' },
    ],
  },
  {
    label: 'Cryptography',
    accent: 'var(--ss-purple)',
    accentDim: 'var(--ss-purple-dim)',
    tools: [
      { id: 'adv-crypto',  icon: Zap,      label: 'Advanced Crypto', line: 'AES-GCM encryption, RSA-4096, Ed25519, PGP keypairs, and TOTP QR codes.' },
      { id: 'ssh-keypair', icon: Terminal, label: 'SSH ed25519',      line: 'Full OpenSSH ed25519 keypair — wire-format public key and PEM private key.' },
    ],
  },
  {
    label: 'Inspect & Decode',
    accent: 'var(--ss-green)',
    accentDim: 'var(--ss-green-dim)',
    tools: [
      { id: 'encoders',    icon: Code2,      label: 'Encoders / Decoders', line: 'Encode and decode between plaintext, Base64, Base64url, and Hex.' },
      { id: 'jwt-inspect', icon: ScanSearch, label: 'JWT Inspector',       line: 'Decode any JWT — inspect header, payload claims, expiry, and algorithm.' },
      { id: 'timestamps',  icon: Clock,      label: 'Timestamp Tools',     line: 'Live Unix/ISO clock, bidirectional timestamp converter, and expiry calculator.' },
    ],
  },
  {
    label: 'Dev Tools',
    accent: 'var(--ss-red)',
    accentDim: 'var(--ss-red-dim)',
    tools: [
      { id: 'env-fmt', icon: FileCode,   label: '.env Formatter',        line: 'Format key/value pairs into correctly-quoted .env file blocks.' },
      { id: 'ctc',     icon: ShieldAlert, label: 'Constant-Time Compare', line: 'Timing-safe string comparison via crypto.timingSafeEqual — prevents timing attacks.' },
    ],
  },
  {
    label: 'Encoding Tools',
    accent: 'var(--ss-accent)',
    accentDim: 'var(--ss-accent-dim)',
    tools: [
      { id: 'url-enc',    icon: Link2,    label: 'URL Encoder / Decoder',    line: 'encodeURIComponent / decodeURIComponent with component and full URI modes.' },
      { id: 'base32',     icon: Grid2X2,  label: 'Base32 Encoder / Decoder', line: 'RFC 4648 Base32 — the same alphabet used by TOTP authenticator secrets.' },
      { id: 'str-escape', icon: Braces,   label: 'String Escaper',           line: 'JSON stringify/parse, HTML entity escape, Base64, and shell single-quote escaping.' },
    ],
  },
  {
    label: 'Dev Utilities',
    accent: 'var(--ss-amber)',
    accentDim: 'var(--ss-amber-dim)',
    tools: [
      { id: 'pwd-strength', icon: ShieldCheck, label: 'Password Strength',     line: 'Entropy analysis, charset coverage, and score 0–8 with actionable feedback.' },
      { id: 'regex-tester', icon: TextSearch,  label: 'Regex Tester',          line: 'Live pattern testing with inline match highlighting and group capture display.' },
      { id: 'unicode-insp', icon: Braces,      label: 'Unicode Inspector',     line: 'Code points, UTF-8 byte representations, and printability for every character.' },
      { id: 'fake-data',    icon: Database,    label: 'Fake Data Generator',   line: 'Realistic test records — names, emails, UUIDs, IPs — in JSON, CSV, or plain text.' },
      { id: 'checksum',     icon: Hash,        label: 'Checksum Calculator',   line: 'Server-side MD5, SHA-1, SHA-256, and SHA-512 checksums for any input string.' },
    ],
  },
  {
    label: 'Security & Keys',
    accent: 'var(--ss-purple)',
    accentDim: 'var(--ss-purple-dim)',
    tools: [
      { id: 'http-headers', icon: ShieldAlert, label: 'HTTP Headers Builder', line: 'Visual builder for CSP, HSTS, X-Frame-Options, Referrer-Policy, and Permissions-Policy.' },
      { id: 'pem-inspect',  icon: FileKey,     label: 'PEM Inspector',        line: 'Parse X.509 certificates: subject, issuer, expiry, fingerprint, SANs, and key type.' },
      { id: 'qr-gen',       icon: QrCode,      label: 'QR Code Generator',    line: 'Any URL or text to QR PNG with configurable error correction level. Download ready.' },
      { id: 'hkdf',         icon: Layers,      label: 'HKDF Derivation',      line: 'Extract-and-expand key derivation (RFC 5869) with SHA-256/384/512 digest.' },
      { id: 'scrypt',       icon: Lock,        label: 'scrypt Derivation',    line: 'Memory-hard password-based KDF (RFC 7914) with configurable N, r, and p parameters.' },
      { id: 'ecdh-keypair', icon: KeySquare,   label: 'ECDH Keypair',         line: 'P-256 / P-384 / P-521 Diffie-Hellman keypairs exported as PEM and JWK.' },
    ],
  },
];

const STEPS = [
  { icon: MousePointerClick, text: 'Pick a tool from the sidebar on the left.' },
  { icon: Info,              text: 'Fill in any required inputs (key length, rounds, comment…).' },
  { icon: ShieldCheck,       text: 'Click Generate — results are processed server-side and never stored.' },
];

export default function Overview({ onSelect }) {
  return (
    <div className="ss-fade-in">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '32px 0 28px',
          borderBottom: '1px solid var(--ss-border)',
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <ShieldCheck size={28} style={{ color: 'var(--ss-accent)', flexShrink: 0 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Cryptographic Suite
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ss-text-tertiary)', marginTop: 3, fontWeight: 500 }}>
              by{' '}
              <a href="https://deedixtech.com" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--ss-accent)', textDecoration: 'none', fontWeight: 600 }}>
                DeediX Technologies
              </a>
              {' · '}{VERSION}
            </p>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ss-text-secondary)', lineHeight: 1.65, maxWidth: 580 }}>
          A self-hosted internal toolkit for generating cryptographic secrets, hashing passwords, encrypting data,
          creating keypairs, inspecting tokens, and more — built on Node.js <code style={monoStyle}>crypto</code>,{' '}
          bcrypt, Argon2id, AES-GCM, RSA-4096, Ed25519, OpenPGP, TOTP, HKDF, scrypt, and ECDH.
          All sensitive operations run server-side via the local Next.js API. <strong>Nothing is logged or stored.</strong>
        </p>
      </div>

      {/* ── How to use ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeading>How to use</SectionHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ss-text-tertiary)', flexShrink: 0, width: 16, textAlign: 'right' }}>{i + 1}.</span>
                <Icon size={13} style={{ color: 'var(--ss-accent)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: 'var(--ss-text-secondary)' }}>{step.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tool index ───────────────────────────────────────────────────── */}
      <div>
        <SectionHeading>Tools</SectionHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 14 }}>
          {GROUPS.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <p style={{
                margin: '0 0 6px', fontSize: '0.67rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', color: group.accent,
              }}>
                {group.label}
              </p>
              {/* Tool rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => onSelect(tool.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', background: 'var(--ss-card-bg)',
                        border: '1px solid var(--ss-card-border)', borderRadius: 'var(--ss-radius-md)',
                        cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.12s, background 0.12s',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ss-border-hover)';
                        e.currentTarget.style.background  = 'var(--ss-bg-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--ss-card-border)';
                        e.currentTarget.style.background  = 'var(--ss-card-bg)';
                      }}
                    >
                      <Icon size={15} style={{ color: group.accent, flexShrink: 0 }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: 'var(--ss-text-primary)' }}>
                          {tool.label}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--ss-text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tool.line}
                        </p>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--ss-text-tertiary)', flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <p style={{
      margin: 0, fontSize: '0.72rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ss-text-tertiary)',
      paddingBottom: 6, borderBottom: '1px solid var(--ss-border)',
    }}>
      {children}
    </p>
  );
}

const monoStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.82em',
  background: 'var(--ss-bg-elevated)',
  padding: '1px 5px',
  borderRadius: 3,
};
