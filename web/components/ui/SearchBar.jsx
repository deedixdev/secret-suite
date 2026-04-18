'use client';
/**
 * secret-suite/components/ui/SearchBar.jsx
 * Full-width topbar search.
 * - Searches tool names, descriptions, and keyword tags
 * - Live dropdown suggestions as the user types
 * - Placeholder cycles through random tool names
 * - Keyboard nav: ↑ ↓ Enter Escape
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Terminal, ChevronRight, Code2 } from 'lucide-react';

// Rotating / hint icons (cycles when unfocused)
const HINT_ICONS = [
  { type: 'text', value: '/' },
  { type: 'icon', value: Terminal },
  { type: 'text', value: '/' },
  { type: 'icon', value: ChevronRight },
  { type: 'text', value: '/' },
  { type: 'icon', value: Code2 },
];

// ── Search index: all tools with searchable terms ────────────────────────────
const INDEX = [
  { id: 'secret-gen',    label: 'Secret Generators',       group: 'Generators',       tags: 'jwt secret api key webhook pepper random' },
  { id: 'enc-keys',      label: 'Encryption Keys',         group: 'Generators',       tags: 'aes 256 iv key base64 hex url-safe encrypt' },
  { id: 'uuid-rand',     label: 'UUID & Random',           group: 'Generators',       tags: 'uuid v4 random bytes hex base64 urandom' },
  { id: 'node-compat',   label: 'Node Compat',             group: 'Generators',       tags: 'crypto randombytes node hex slice' },
  { id: 'hash-fn',       label: 'Hash Functions',          group: 'Hashing',          tags: 'sha256 sha512 sha3 hmac hash digest' },
  { id: 'pwd-hash',      label: 'Password Hashing',        group: 'Hashing',          tags: 'bcrypt argon2 pbkdf2 hash verify password salted' },
  { id: 'adv-crypto',    label: 'Advanced Crypto',         group: 'Cryptography',     tags: 'aes gcm rsa ed25519 pgp totp qr openpgp keypair encrypt decrypt' },
  { id: 'ssh-keypair',   label: 'SSH ed25519',             group: 'Cryptography',     tags: 'ssh keygen ed25519 openssh public private key' },
  { id: 'encoders',      label: 'Encoders / Decoders',     group: 'Inspect & Decode', tags: 'base64 hex encode decode b64 url-safe' },
  { id: 'jwt-inspect',   label: 'JWT Inspector',           group: 'Inspect & Decode', tags: 'jwt decode token header payload exp iat claims' },
  { id: 'timestamps',    label: 'Timestamp Tools',         group: 'Inspect & Decode', tags: 'unix iso timestamp date convert expiry epoch' },
  { id: 'env-fmt',       label: '.env Formatter',          group: 'Dev Tools',        tags: 'env dotenv format key value environment variable' },
  { id: 'ctc',           label: 'Constant-Time Compare',   group: 'Dev Tools',        tags: 'timing safe compare equal crypto secret' },
  { id: 'url-enc',       label: 'URL Encoder / Decoder',   group: 'Encoding Tools',   tags: 'url encode decode uri component percent' },
  { id: 'base32',        label: 'Base32 Encoder',          group: 'Encoding Tools',   tags: 'base32 rfc 4648 totp authenticator encode decode' },
  { id: 'str-escape',    label: 'String Escaper',          group: 'Encoding Tools',   tags: 'escape html json shell string entities base64 unescape' },
  { id: 'pwd-strength',  label: 'Password Strength',       group: 'Dev Utilities',    tags: 'password strength entropy score meter weak strong bits' },
  { id: 'regex-tester',  label: 'Regex Tester',            group: 'Dev Utilities',    tags: 'regex regexp pattern test match flags groups' },
  { id: 'unicode-insp',  label: 'Unicode Inspector',       group: 'Dev Utilities',    tags: 'unicode code point utf8 character bytes emoji inspect' },
  { id: 'fake-data',     label: 'Fake Data Generator',     group: 'Dev Utilities',    tags: 'fake test data fixture name email uuid ip phone seed' },
  { id: 'checksum',      label: 'Checksum Calculator',     group: 'Dev Utilities',    tags: 'md5 sha1 sha256 sha512 checksum hash file verify' },
  { id: 'http-headers',  label: 'HTTP Headers Builder',    group: 'Security & Keys',  tags: 'csp hsts x-frame referrer permissions policy security headers' },
  { id: 'pem-inspect',   label: 'PEM Inspector',           group: 'Security & Keys',  tags: 'pem x509 certificate cert subject issuer expiry fingerprint san' },
  { id: 'qr-gen',        label: 'QR Code Generator',       group: 'Security & Keys',  tags: 'qr qrcode barcode scan url wifi vcard' },
  { id: 'hkdf',          label: 'HKDF Derivation',         group: 'Security & Keys',  tags: 'hkdf kdf derive key hmac extract expand rfc5869' },
  { id: 'scrypt',        label: 'scrypt Derivation',       group: 'Security & Keys',  tags: 'scrypt kdf password derive memory hard gpu asic rfc7914' },
  { id: 'ecdh-keypair',  label: 'ECDH Keypair',            group: 'Security & Keys',  tags: 'ecdh ec elliptic curve p256 p384 p521 jwk pem keypair' },
];

// Rotating placeholder pool
const PLACEHOLDERS = INDEX.map((t) => t.label);

function search(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const scored = INDEX.map((item) => {
    const haystack = `${item.label} ${item.group} ${item.tags}`.toLowerCase();
    if (item.label.toLowerCase().startsWith(q)) return { item, score: 3 };
    if (item.label.toLowerCase().includes(q))   return { item, score: 2 };
    if (haystack.includes(q))                    return { item, score: 1 };
    return null;
  }).filter(Boolean);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map((s) => s.item);
}

// Highlight matching substring
function Highlight({ text, query }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--ss-accent-dim)', color: 'var(--ss-accent)', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function SearchBar({ onSelect, inputRef: externalRef }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [cursor, setCursor]     = useState(-1);
  const [phIdx, setPhIdx]       = useState(0);
  const [phFade, setPhFade]     = useState(true);
  const [focused, setFocused]   = useState(false);
  const [hintIdx, setHintIdx]   = useState(0);
  const [hintFade, setHintFade] = useState(true);

  const internalRef = useRef(null);
  const inputRef    = externalRef || internalRef;
  const dropRef     = useRef(null);
  const cycleRef    = useRef(null);
  const hintRef     = useRef(null);

  // ── Rotating placeholder ──────────────────────────────────────────────────
  useEffect(() => {
    cycleRef.current = setInterval(() => {
      setPhFade(false);
      setTimeout(() => {
        setPhIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPhFade(true);
      }, 250);
    }, 3000);
    return () => clearInterval(cycleRef.current);
  }, []);

  // ── Rotating hint icon ────────────────────────────────────────────────────
  useEffect(() => {
    hintRef.current = setInterval(() => {
      setHintFade(false);
      setTimeout(() => {
        setHintIdx((i) => (i + 1) % HINT_ICONS.length);
        setHintFade(true);
      }, 200);
    }, 2200);
    return () => clearInterval(hintRef.current);
  }, []);

  // Stop cycling while focused
  const pauseCycle = () => clearInterval(cycleRef.current);
  const resumeCycle = () => {
    cycleRef.current = setInterval(() => {
      setPhFade(false);
      setTimeout(() => {
        setPhIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPhFade(true);
      }, 250);
    }, 3000);
  };

  // ── Live search ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setCursor(-1);
    const hits = search(v);
    setResults(hits);
    setOpen(v.trim().length > 0); // open even if 0 results (to show no-results state)
  };

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, -1)); }
    if (e.key === 'Enter') {
      if (cursor >= 0 && results[cursor]) {
        commit(results[cursor]);
      }
    }
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  }, [open, cursor, results]);

  const commit = (item) => {
    onSelect(item.id);
    setQuery('');
    setResults([]);
    setOpen(false);
    setCursor(-1);
    inputRef.current?.blur();
  };

  // ── Click outside to close ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const placeholder = `Search "${PLACEHOLDERS[phIdx]}"…`;

  // Group consecutive results
  const grouped = results.reduce((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.group === item.group) {
      last.items.push(item);
    } else {
      acc.push({ group: item.group, items: [item] });
    }
    return acc;
  }, []);

  return (
    <div style={{ position: 'relative', flex: 1, width: '100%' }}>
      <style>{`.ss-search-input::placeholder{color:var(--ss-text-tertiary);opacity:1}.ss-search-wrap,.ss-search-wrap *{outline:none!important;box-shadow:none!important}`}</style>
      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div
        className="ss-search-wrap focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--ss-bg-elevated)',
          border: '1px solid var(--ss-border)',
          borderRadius: open ? 'var(--ss-radius-md) var(--ss-radius-md) 0 0' : 'var(--ss-radius-md)',
          boxShadow: focused ? '0 0 0 2px var(--ss-bg-tertiary)' : 'none',
          outline: 'none',
          padding: '0 10px',
          height: 32,
          transition: 'border-color 0.15s',
        }}
      >
        <Search size={13} style={{ color: 'var(--ss-text-tertiary)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { setFocused(true); pauseCycle(); if (query && results.length) setOpen(true); }}
          onBlur={() => { setFocused(false); resumeCycle(); }}
          placeholder={placeholder}
          className="ss-search-input focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--ss-text-primary)',
            fontSize: '0.8rem',
            fontFamily: 'Inter, sans-serif',
            opacity: phFade ? 1 : 0,
            transition: 'opacity 0.25s',
            minWidth: 0,
          }}
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ss-text-tertiary)' }}
          >
            <X size={12} />
          </button>
        ) : !focused && (() => {
          const h = HINT_ICONS[hintIdx];
          const HIcon = h.type === 'icon' ? h.value : null;
          return (
            <span
              className="ss-sidebar-desktop-only"
              style={{
                fontSize: '0.65rem',
                color: 'var(--ss-text-tertiary)',
                padding: '1px 5px',
                background: 'var(--ss-bg-tertiary)',
                border: '1px solid var(--ss-border)',
                borderRadius: 4,
                fontFamily: 'JetBrains Mono, monospace',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 18,
                height: 18,
                opacity: hintFade ? 1 : 0,
                transition: 'opacity 0.2s',
                userSelect: 'none',
              }}
            >
              {HIcon ? <HIcon size={10} /> : h.value}
            </span>
          );
        })()}
      </div>

      {/* ── Dropdown ───────────────────────────────────────────────────────── */}
      {open && (
        <div
          ref={dropRef}
          className="ss-fade-in"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 200,
            background: 'var(--ss-bg-secondary)',
            border: '1px solid var(--ss-border)',
            borderTop: 'none',
            borderRadius: '0 0 var(--ss-radius-md) var(--ss-radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--ss-text-tertiary)', fontSize: '0.8rem' }}>
              No tools match <strong style={{ color: 'var(--ss-text-secondary)' }}>"{query}"</strong>
            </div>
          ) : (
            <>
              {grouped.map((g) => (
                <div key={g.group}>
                  <div style={{ padding: '5px 12px 3px', fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--ss-text-tertiary)', background: 'var(--ss-bg-tertiary)', borderBottom: '1px solid var(--ss-border)' }}>
                    {g.group}
                  </div>
                  {g.items.map((item) => {
                    const globalIdx = results.indexOf(item);
                    const active = cursor === globalIdx;
                    return (
                      <button
                        key={item.id}
                        onMouseDown={(e) => { e.preventDefault(); commit(item); }}
                        onMouseEnter={() => setCursor(globalIdx)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 14px',
                          background: active ? 'var(--ss-accent-dim)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'Inter, sans-serif',
                          transition: 'background 0.1s',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: active ? 'var(--ss-accent)' : 'var(--ss-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Highlight text={item.label} query={query} />
                          </p>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--ss-text-tertiary)', marginTop: 1 }}>
                            {item.tags.split(' ').slice(0, 5).join(' · ')}
                          </p>
                        </div>
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--ss-bg-elevated)', color: 'var(--ss-text-tertiary)', borderRadius: 99, flexShrink: 0 }}>↵</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              <div style={{ padding: '5px 12px', fontSize: '0.65rem', color: 'var(--ss-text-tertiary)', borderTop: '1px solid var(--ss-border)', background: 'var(--ss-bg-tertiary)', display: 'flex', gap: 10 }}>
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>Esc close</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
