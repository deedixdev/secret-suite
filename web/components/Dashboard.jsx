'use client';
/**
 * secret/components/Dashboard.jsx
 * Sidebar navigation + main content panel layout.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, Sun, Moon,
  Key, Lock, Shuffle, PackageCheck,
  Hash, ShieldOff,
  Hexagon, Terminal,
  Code2, ScanSearch, Clock,
  FileCode, ShieldAlert,
  ChevronDown, ChevronRight,
  Home, Menu, X as CloseIcon,
  Link2, Grid2X2, Braces,
  TextSearch, Database, QrCode,
  Layers, KeySquare, FileKey,
  ChevronRight as Chevron,
  ShieldAlert as ShieldAlertIcon,
} from 'lucide-react';
import { SecretGenerators, EncryptionKeys, UuidRandom, NodeCompat } from './Generators';
import HashFunctions from './HashFunctions';
import PasswordHashing from './PasswordHashing';
import AdvancedCrypto from './AdvancedCrypto';
import Encoders from './Encoders';
import JwtInspector from './JwtInspector';
import TimestampTools from './TimestampTools';
import { EnvFormatter, ConstantTimeCompare } from './DevTools';
import SshKeypair from './SshKeypair';
import Overview from './Overview';
import SearchBar from './ui/SearchBar';
import ErrorBoundary from './ui/ErrorBoundary';
import { UrlEncoderDecoder, Base32Tool, StringEscaper } from './StringTools';
import { PasswordStrength, RegexTester, UnicodeInspector, FakeDataGenerator } from './DevUtils';
import { ChecksumCalc, QrGenerator } from './DataTools';
import { HttpHeadersBuilder, PemInspector } from './SecurityTools';
import { HkdfDerive, ScryptDerive, EcdhKeypair } from './KeyDerivation';

// ── Navigation definition ────────────────────────────────────────────────────
const NAV = [
  {
    group: 'Generators',
    accent: 'var(--ss-accent)',
    items: [
      { id: 'secret-gen',  label: 'Secret Generators',  desc: 'JWT secrets, API keys, webhooks, peppers',        icon: Key,          render: () => <SecretGenerators /> },
      { id: 'enc-keys',    label: 'Encryption Keys',    desc: 'AES-256 keys, IVs in multiple encodings',         icon: Lock,         render: () => <EncryptionKeys /> },
      { id: 'uuid-rand',   label: 'UUID & Random',      desc: 'UUID v4, random hex, Base64, URL-safe bytes',     icon: Shuffle,      render: () => <UuidRandom /> },
      { id: 'node-compat', label: 'Node Compat',        desc: 'crypto.randomBytes shorthand generators',         icon: PackageCheck, render: () => <NodeCompat /> },
    ],
  },
  {
    group: 'Hashing',
    accent: 'var(--ss-amber)',
    items: [
      { id: 'hash-fn',  label: 'Hash Functions',   desc: 'SHA-256/512, SHA3, HMAC-SHA256/512',            icon: Hash,     render: () => <HashFunctions /> },
      { id: 'pwd-hash', label: 'Password Hashing', desc: 'bcrypt, PBKDF2, Argon2id — hash & verify',     icon: ShieldOff, render: () => <PasswordHashing /> },
    ],
  },
  {
    group: 'Cryptography',
    accent: 'var(--ss-purple)',
    items: [
      { id: 'adv-crypto',  label: 'Advanced Crypto', desc: 'AES-GCM, RSA-4096, Ed25519, PGP, TOTP QR', icon: Hexagon,      render: () => <AdvancedCrypto /> },
      { id: 'ssh-keypair', label: 'SSH ed25519',      desc: 'Generate OpenSSH keypair in wire format',   icon: Terminal, render: () => <SshKeypair /> },
    ],
  },
  {
    group: 'Inspect & Decode',
    accent: 'var(--ss-green)',
    items: [
      { id: 'encoders',    label: 'Encoders / Decoders', desc: 'Base64, Base64url, Hex encode & decode',      icon: Code2,      render: () => <Encoders /> },
      { id: 'jwt-inspect', label: 'JWT Inspector',       desc: 'Decode JWT header, payload, expiry status',   icon: ScanSearch, render: () => <JwtInspector /> },
      { id: 'timestamps',  label: 'Timestamp Tools',     desc: 'Live clock, ISO↔Unix converter, expiry calc', icon: Clock,      render: () => <TimestampTools /> },
    ],
  },
  {
    group: 'Dev Tools',
    accent: 'var(--ss-red)',
    items: [
      { id: 'env-fmt', label: '.env Formatter',        desc: 'Format key/value pairs into .env syntax',          icon: FileCode,   render: () => <EnvFormatter /> },
      { id: 'ctc',     label: 'Constant-Time Compare', desc: 'Timing-safe comparison via crypto.timingSafeEqual', icon: ShieldAlert, render: () => <ConstantTimeCompare /> },
    ],
  },
  {
    group: 'Encoding Tools',
    accent: 'var(--ss-accent)',
    items: [
      { id: 'url-enc',    label: 'URL Encoder / Decoder',       desc: 'encodeURIComponent / decodeURIComponent',         icon: Link2,      render: () => <UrlEncoderDecoder /> },
      { id: 'base32',     label: 'Base32 Encoder / Decoder',    desc: 'RFC 4648 Base32 — same alphabet as TOTP secrets',  icon: Grid2X2,    render: () => <Base32Tool /> },
      { id: 'str-escape', label: 'String Escaper',              desc: 'JSON, HTML entities, Base64, shell escaping',      icon: Braces,     render: () => <StringEscaper /> },
    ],
  },
  {
    group: 'Dev Utilities',
    accent: 'var(--ss-amber)',
    items: [
      { id: 'pwd-strength',  label: 'Password Strength',      desc: 'Entropy, charset coverage, score 0–8',            icon: ShieldCheck,  render: () => <PasswordStrength /> },
      { id: 'regex-tester',  label: 'Regex Tester',           desc: 'Test patterns with live match highlighting',      icon: TextSearch,   render: () => <RegexTester /> },
      { id: 'unicode-insp',  label: 'Unicode Inspector',      desc: 'Code points, UTF-8 bytes, printability',          icon: Braces,       render: () => <UnicodeInspector /> },
      { id: 'fake-data',     label: 'Fake Data Generator',    desc: 'Names, emails, UUIDs, IPs — JSON / CSV / text',   icon: Database,     render: () => <FakeDataGenerator /> },
      { id: 'checksum',      label: 'Checksum Calculator',    desc: 'MD5, SHA-1, SHA-256, SHA-512 server-side hashes', icon: Hash,         render: () => <ChecksumCalc /> },
    ],
  },
  {
    group: 'Security & Keys',
    accent: 'var(--ss-purple)',
    items: [
      { id: 'http-headers',  label: 'HTTP Headers Builder',   desc: 'CSP, HSTS, X-Frame, Referrer-Policy generator',   icon: ShieldAlertIcon, render: () => <HttpHeadersBuilder /> },
      { id: 'pem-inspect',   label: 'PEM Inspector',          desc: 'Parse X.509 certs: subject, expiry, fingerprint', icon: FileKey,         render: () => <PemInspector /> },
      { id: 'qr-gen',        label: 'QR Code Generator',      desc: 'Any URL or text → QR code PNG with EC level',     icon: QrCode,          render: () => <QrGenerator /> },
      { id: 'hkdf',          label: 'HKDF Derivation',        desc: 'HMAC-based key derivation (RFC 5869)',            icon: Layers,          render: () => <HkdfDerive /> },
      { id: 'scrypt',        label: 'scrypt Derivation',      desc: 'Memory-hard password-based KDF (RFC 7914)',       icon: Lock,            render: () => <ScryptDerive /> },
      { id: 'ecdh-keypair',  label: 'ECDH Keypair',           desc: 'P-256/P-384/P-521 keypair in PEM + JWK',         icon: KeySquare,       render: () => <EcdhKeypair /> },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);
const OVERVIEW_ID = 'overview';

// ── Sidebar nav item ─────────────────────────────────────────────────────────
function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onClick(item.id)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 10px 7px 12px',
        borderRadius: 'var(--ss-radius-sm)',
        border: 'none',
        borderLeft: active ? '2px solid var(--ss-accent)' : '2px solid transparent',
        cursor: 'pointer',
        background: active ? 'var(--ss-accent-dim)' : 'transparent',
        color: active ? 'var(--ss-accent)' : 'var(--ss-text-secondary)',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.82rem',
        fontWeight: active ? 600 : 400,
        textAlign: 'left',
        transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--ss-bg-elevated)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={14} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
    </button>
  );
}

// ── Collapsible group header ─────────────────────────────────────────────────
function NavGroup({ group, accent, items, activeId, onSelect }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 10px 4px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ss-text-tertiary)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.67rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginTop: 10,
        }}
      >
        <span style={{ color: accent, display: 'flex', alignItems: 'center' }}>
          {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
        {group}
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingLeft: 4, marginTop: 2 }}>
          {items.map((item) => (
            <NavItem key={item.id} item={item} active={activeId === item.id} onClick={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [theme,    setTheme]    = useState('dark');
  const [activeId, setActiveId] = useState(OVERVIEW_ID);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef(null);

  // ── Restore persisted state ──────────────────────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem('ss-theme');
    const a = localStorage.getItem('ss-active');
    const resolvedTheme = (t === 'light' || t === 'dark') ? t : 'dark';
    setTheme(resolvedTheme);
    document.documentElement.setAttribute('data-ss-theme', resolvedTheme);
    if (a && (a === OVERVIEW_ID || ALL_ITEMS.find((i) => i.id === a))) setActiveId(a);
    return () => document.documentElement.removeAttribute('data-ss-theme');
  }, []);

  // ── '/' key focuses search ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const selectTool = useCallback((id) => {
    setActiveId(id);
    setSidebarOpen(false);
    localStorage.setItem('ss-active', id);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('ss-theme', next);
    document.documentElement.setAttribute('data-ss-theme', next);
  };

  const isOverview = activeId === OVERVIEW_ID;
  const activeTool = ALL_ITEMS.find((i) => i.id === activeId);
  const ActiveIcon = activeTool?.icon ?? ShieldCheck;

  return (
    <div
      data-ss-theme={theme}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--ss-bg-primary)',
        color: 'var(--ss-text-primary)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ── Mobile sidebar overlay ──────────────────────────────────────── */}
      <div
        className={`ss-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          flexShrink: 0,
          height: 52,
          zIndex: 50,
          background: 'var(--ss-header-bg)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--ss-border)',
          padding: '0 16px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* ── Left: hamburger + logo ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="ss-hamburger"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ss-text-secondary)', display: 'none',
              alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 'var(--ss-radius-sm)', flexShrink: 0,
            }}
          >
            {sidebarOpen ? <CloseIcon size={18} /> : <Menu size={18} />}
          </button>
          <ShieldCheck size={17} className="ss-logo-icon" style={{ color: 'var(--ss-accent)', flexShrink: 0 }} />
          <span className="ss-header-title" style={{ fontWeight: 800, fontSize: '0.88rem', letterSpacing: '-0.01em', color: 'var(--ss-header-text)', whiteSpace: 'nowrap' }}>
            Cryptographic Suite
          </span>
          <span className="ss-badge-local" style={{ fontSize: '0.62rem', padding: '2px 6px', background: 'var(--ss-green-dim)', color: 'var(--ss-green)', borderRadius: 99, fontWeight: 700, flexShrink: 0, letterSpacing: '0.04em' }}>
            LOCAL ONLY
          </span>
        </div>

        {/* ── Centre: search ─────────────────────────────────────────────── */}
        <div className="ss-header-search" style={{ width: 420, maxWidth: '100%' }}>
          <SearchBar onSelect={selectTool} inputRef={searchRef} />
        </div>

        {/* ── Right: theme toggle ───────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'var(--ss-bg-elevated)', border: '1px solid var(--ss-border)',
              borderRadius: 'var(--ss-radius-sm)', color: 'var(--ss-header-text)',
              cursor: 'pointer', width: 32, height: 32, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ss-border-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ss-border)')}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={`ss-sidebar ss-sidebar-drawer${sidebarOpen ? ' open' : ''}`}
          style={{
            width: 218,
            flexShrink: 0,
            overflowY: 'auto',
            borderRight: '1px solid var(--ss-border)',
            background: 'var(--ss-bg-secondary)',
            padding: '4px 8px 24px',
          }}
        >
          {/* Close button — only shown on mobile drawer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 8px 4px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ss-text-tertiary)', display: 'flex', alignItems: 'center', padding: 4 }}
            >
              <CloseIcon size={14} />
            </button>
          </div>

          {/* Home / Overview link */}
          <div style={{ padding: '0 4px 4px' }}>
            <button
              onClick={() => selectTool(OVERVIEW_ID)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 10px 7px 12px', borderRadius: 'var(--ss-radius-sm)',
                border: 'none',
                borderLeft: isOverview ? '2px solid var(--ss-accent)' : '2px solid transparent',
                cursor: 'pointer',
                background: isOverview ? 'var(--ss-accent-dim)' : 'transparent',
                color: isOverview ? 'var(--ss-accent)' : 'var(--ss-text-secondary)',
                fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                fontWeight: isOverview ? 600 : 400, textAlign: 'left',
              }}
              onMouseEnter={(e) => { if (!isOverview) e.currentTarget.style.background = 'var(--ss-bg-elevated)'; }}
              onMouseLeave={(e) => { if (!isOverview) e.currentTarget.style.background = 'transparent'; }}
            >
              <Home size={14} style={{ flexShrink: 0 }} />
              <span>Overview</span>
            </button>
          </div>
          <div style={{ height: 1, background: 'var(--ss-border)', margin: '0 8px 0' }} />
          {NAV.map((group) => (
            <NavGroup
              key={group.group}
              group={group.group}
              accent={group.accent}
              items={group.items}
              activeId={activeId}
              onSelect={selectTool}
            />
          ))}
        </aside>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--ss-bg-primary)', display: 'flex', flexDirection: 'column' }}>

          {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
          <div className="ss-tool-titlebar" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 28px', height: 34, borderBottom: '1px solid var(--ss-border)', background: 'var(--ss-bg-secondary)' }}>
            <button
              onClick={() => selectTool(OVERVIEW_ID)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, color: isOverview ? 'var(--ss-text-primary)' : 'var(--ss-text-tertiary)', fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: isOverview ? 600 : 400 }}
            >
              <Home size={11} />
              <span>Overview</span>
            </button>
            {!isOverview && activeTool && (
              <>
                <span style={{ color: 'var(--ss-border-hover)', fontSize: '0.72rem', userSelect: 'none' }}>/</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--ss-text-primary)', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  {activeTool.label}
                </span>
              </>
            )}
          </div>

          {/* Active tool title bar */}
          {!isOverview && activeTool && (
            <div
              className="ss-tool-titlebar"
              style={{
                flexShrink: 0, padding: '14px 28px',
                borderBottom: '1px solid var(--ss-border)',
                background: 'var(--ss-bg-secondary)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <ActiveIcon size={18} style={{ color: 'var(--ss-accent)', flexShrink: 0 }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {activeTool.label}
                </h1>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ss-text-secondary)', marginTop: 2 }}>
                  {activeTool.desc}
                </p>
              </div>
            </div>
          )}

          {/* Content — keyed so it remounts on switch */}
          <div key={activeId} className="ss-fade-in ss-main-content" style={{ padding: '22px 28px 40px', maxWidth: 700, flex: 1 }}>
            <ErrorBoundary key={activeId}>
              {isOverview
                ? <Overview onSelect={selectTool} />
                : activeTool?.render()
              }
            </ErrorBoundary>
          </div>

          {/* ── Footer ── */}
          <footer style={{
            flexShrink: 0, borderTop: '1px solid var(--ss-border)',
            padding: '12px 28px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
            background: 'var(--ss-bg-secondary)',
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ss-text-tertiary)' }}>
              Cryptographic Suite · v1.0.0 · Created by DeediX
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <FooterLink href="https://deedixtech.com">DeediX Technologies</FooterLink>
              <FooterLink href="https://ai.deedixtech.com">DeediX AI</FooterLink>
              <FooterLink href="https://store.deedixtech.com">DeediX Store</FooterLink>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

// ── Footer link helper ───────────────────────────────────────────────────────
function FooterLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: '0.72rem', color: 'var(--ss-text-tertiary)',
        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ss-accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ss-text-tertiary)')}
    >
      {children}
    </a>
  );
}


