'use client';
/**
 * secret/components/DevUtils.jsx
 * Password Strength Meter · Regex Tester · Unicode Inspector · Fake Data Generator
 */
import { useState, useCallback } from 'react';
import { ShieldCheck, TextSearch, Braces, Database } from 'lucide-react';
import SectionCard from './ui/SectionCard';
import InputField from './ui/InputField';
import CopyButton from './ui/CopyButton';
import GenerateButton from './ui/GenerateButton';

// ── Password Strength Meter ───────────────────────────────────────────────────
function calcStrength(pw) {
  let score = 0;
  const checks = {
    length8:   pw.length >= 8,
    length12:  pw.length >= 12,
    length16:  pw.length >= 16,
    lower:     /[a-z]/.test(pw),
    upper:     /[A-Z]/.test(pw),
    digit:     /\d/.test(pw),
    symbol:    /[^a-zA-Z0-9]/.test(pw),
    noRepeat:  !/(.)\1{2,}/.test(pw),
  };
  if (checks.length8)   score++;
  if (checks.length12)  score++;
  if (checks.length16)  score++;
  if (checks.lower)     score++;
  if (checks.upper)     score++;
  if (checks.digit)     score++;
  if (checks.symbol)    score++;
  if (checks.noRepeat)  score++;
  // Entropy estimate (bits)
  let pool = 0;
  if (checks.lower)  pool += 26;
  if (checks.upper)  pool += 26;
  if (checks.digit)  pool += 10;
  if (checks.symbol) pool += 32;
  if (pool === 0) pool = 26;
  const entropy = Math.round(pw.length * Math.log2(pool));
  const level =
    score <= 2 ? { label: 'Very Weak', color: 'var(--ss-red)',   pct: 15 } :
    score <= 3 ? { label: 'Weak',      color: 'var(--ss-red)',   pct: 30 } :
    score <= 4 ? { label: 'Fair',      color: 'var(--ss-amber)', pct: 50 } :
    score <= 5 ? { label: 'Good',      color: 'var(--ss-amber)', pct: 65 } :
    score <= 6 ? { label: 'Strong',    color: 'var(--ss-green)', pct: 82 } :
                 { label: 'Very Strong',color: 'var(--ss-green)', pct: 100 };
  return { checks, entropy, level, score };
}

function CheckRow({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: ok ? 'var(--ss-green)' : 'var(--ss-text-tertiary)' }}>
      <span style={{ fontSize: '0.7rem' }}>{ok ? '✓' : '○'}</span>
      {label}
    </div>
  );
}

export function PasswordStrength() {
  const [pw, setPw] = useState('');
  const info = pw ? calcStrength(pw) : null;

  return (
    <SectionCard title="Password Strength" icon={ShieldCheck} color="var(--ss-green)">
      <InputField label="Password" id="ps-pw" value={pw} onChange={setPw} placeholder="Type or paste a password to audit" type="text" />
      {info && (
        <div className="ss-fade-in" style={{ marginTop: 10 }}>
          {/* Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'var(--ss-bg-elevated)', borderRadius: 99 }}>
              <div style={{ width: `${info.level.pct}%`, height: '100%', background: info.level.color, borderRadius: 99, transition: 'width 0.3s, background 0.3s' }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: info.level.color, whiteSpace: 'nowrap' }}>{info.level.label}</span>
          </div>
          {/* Entropy */}
          <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'var(--ss-text-tertiary)' }}>
            ~{info.entropy} bits of entropy · score {info.score}/8
          </p>
          {/* Checks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
            <CheckRow ok={info.checks.length8}  label="≥ 8 characters" />
            <CheckRow ok={info.checks.lower}    label="Lowercase letters" />
            <CheckRow ok={info.checks.length12} label="≥ 12 characters" />
            <CheckRow ok={info.checks.upper}    label="Uppercase letters" />
            <CheckRow ok={info.checks.length16} label="≥ 16 characters" />
            <CheckRow ok={info.checks.digit}    label="Numbers" />
            <CheckRow ok={info.checks.noRepeat} label="No 3+ repeats" />
            <CheckRow ok={info.checks.symbol}   label="Symbols" />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ── Regex Tester ──────────────────────────────────────────────────────────────
export function RegexTester() {
  const [pattern, setPattern]   = useState('');
  const [flags, setFlags]       = useState('gm');
  const [text, setText]         = useState('');

  const result = useCallback(() => {
    if (!pattern || !text) return null;
    try {
      const re = new RegExp(pattern, flags);
      const matches = [];
      let m;
      if (flags.includes('g')) {
        while ((m = re.exec(text)) !== null) {
          matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
          if (m.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        m = re.exec(text);
        if (m) matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
      }
      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: e.message };
    }
  }, [pattern, flags, text])();

  const highlighted = useCallback(() => {
    if (!result || result.error || result.matches.length === 0) return text;
    let out = '', last = 0;
    for (const { match, index } of result.matches) {
      out += text.slice(last, index).replace(/</g,'&lt;');
      out += `<mark style="background:rgba(37,99,235,0.25);color:var(--ss-accent);border-radius:2px;padding:0 1px">${match.replace(/</g,'&lt;')}</mark>`;
      last = index + match.length;
    }
    out += text.slice(last).replace(/</g,'&lt;');
    return out;
  }, [result, text])();

  return (
    <SectionCard title="Regex Tester" icon={TextSearch} color="var(--ss-purple)">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <InputField label="Pattern" id="re-pattern" value={pattern} onChange={setPattern} placeholder="(https?):\/\/([^\/\s]+)" />
        </div>
        <div style={{ width: 80 }}>
          <InputField label="Flags" id="re-flags" value={flags} onChange={setFlags} placeholder="gim" />
        </div>
      </div>
      <InputField label="Test string" id="re-text" value={text} onChange={setText} multiline rows={4} placeholder="Paste text to test against the pattern" />
      {result && (
        <div className="ss-fade-in" style={{ marginTop: 8 }}>
          {result.error ? (
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ss-red)' }}>Error: {result.error}</p>
          ) : (
            <>
              <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: result.matches.length ? 'var(--ss-green)' : 'var(--ss-amber)' }}>
                {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
              </p>
              {text && (
                <div
                  style={{ padding: '8px 12px', background: 'var(--ss-bg-secondary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-md)', fontSize: '0.82rem', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              )}
              {result.matches.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {result.matches.slice(0, 20).map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--ss-text-tertiary)', width: 20 }}>#{i + 1}</span>
                      <code style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--ss-accent)', background: 'var(--ss-accent-dim)', padding: '1px 5px', borderRadius: 3 }}>{m.match}</code>
                      <span style={{ color: 'var(--ss-text-tertiary)' }}>@{m.index}</span>
                      {m.groups.length > 0 && <span style={{ color: 'var(--ss-text-tertiary)' }}>groups: {m.groups.map(g => `"${g ?? ''}"`).join(', ')}</span>}
                    </div>
                  ))}
                  {result.matches.length > 20 && <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ss-text-tertiary)' }}>…and {result.matches.length - 20} more</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ── Unicode Inspector ─────────────────────────────────────────────────────────
export function UnicodeInspector() {
  const [input, setInput] = useState('');

  const chars = input ? [...input].slice(0, 100).map((c) => {
    const cp = c.codePointAt(0);
    const utf8 = Array.from(new TextEncoder().encode(c)).map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
    const name = `U+${cp.toString(16).toUpperCase().padStart(4,'0')}`;
    const isPrint = cp > 31 && !(cp >= 127 && cp < 160);
    return { char: c, cp, hex: name, utf8, isPrint };
  }) : [];

  return (
    <SectionCard title="Unicode Inspector" icon={Braces} color="var(--ss-amber)">
      <InputField label="Input" id="uni-input" value={input} onChange={setInput} placeholder="Paste any text — emoji, RTL, invisible chars…" />
      {chars.length > 0 && (
        <div className="ss-fade-in" style={{ marginTop: 8, overflow: 'auto', maxHeight: 300 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>
            <thead>
              <tr>
                {['Char','Code point','UTF-8 bytes','Printable'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--ss-text-tertiary)', fontWeight: 600, borderBottom: '1px solid var(--ss-border)', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chars.map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--ss-border)' }}>
                  <td style={{ padding: '4px 8px', color: 'var(--ss-text-primary)', fontSize: '1rem' }}>{c.isPrint ? c.char : '·'}</td>
                  <td style={{ padding: '4px 8px', color: 'var(--ss-accent)' }}>{c.hex}</td>
                  <td style={{ padding: '4px 8px', color: 'var(--ss-green)' }}>{c.utf8}</td>
                  <td style={{ padding: '4px 8px', color: c.isPrint ? 'var(--ss-green)' : 'var(--ss-red)' }}>{c.isPrint ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {input.length > 100 && <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--ss-text-tertiary)' }}>Showing first 100 of {[...input].length} characters.</p>}
        </div>
      )}
    </SectionCard>
  );
}

// ── Fake Data Generator ───────────────────────────────────────────────────────
const FIRST = ['James','Olivia','Liam','Emma','Noah','Sophia','Ethan','Ava','Lucas','Isabella','Chidi','Ngozi','Amara','Temi','Kofi','Abena'];
const LAST  = ['Smith','Johnson','Williams','Brown','Jones','Okafor','Mensah','Adeola','Nwosu','Ibrahim','Chen','Patel','Garcia','Müller'];
const DOMAINS = ['example.com','test.dev','demo.io','sample.net','fake.org'];
const TLDS = ['com','io','dev','net','org','co.uk'];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function generateFakeData(count = 5) {
  return Array.from({ length: count }, () => {
    const first = rnd(FIRST), last = rnd(LAST);
    const username = `${first.toLowerCase()}.${last.toLowerCase()}${rndInt(1,99)}`;
    return {
      name:     `${first} ${last}`,
      email:    `${username}@${rnd(DOMAINS)}`,
      username,
      phone:    `+${rndInt(1,99)} ${rndInt(100,999)} ${rndInt(1000,9999)} ${rndInt(1000,9999)}`,
      uuid:     makeUuid(),
      ip:       `${rndInt(10,254)}.${rndInt(0,255)}.${rndInt(0,255)}.${rndInt(1,254)}`,
      ipv6:     Array.from({length:8},()=>rndInt(0,65535).toString(16).padStart(4,'0')).join(':'),
      domain:   `${first.toLowerCase()}${rnd(TLDS) ? `.${rnd(TLDS)}` : '.com'}`,
      port:     rndInt(1024, 65535),
      date:     new Date(Date.now() - rndInt(0, 1e11)).toISOString().split('T')[0],
    };
  });
}

export function FakeDataGenerator() {
  const [count, setCount]   = useState('5');
  const [data, setData]     = useState([]);
  const [format, setFormat] = useState('json');

  const generate = () => {
    const rows = generateFakeData(Math.min(Number(count) || 5, 50));
    setData(rows);
  };

  const output = format === 'json'
    ? JSON.stringify(data, null, 2)
    : format === 'csv'
      ? [Object.keys(data[0] || {}).join(','), ...data.map(r => Object.values(r).map(v=>`"${v}"`).join(','))].join('\n')
      : data.map(r => Object.entries(r).map(([k,v]) => `${k}: ${v}`).join('\n')).join('\n---\n');

  return (
    <SectionCard title="Fake Data Generator" icon={Database} color="var(--ss-green)">
      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--ss-text-tertiary)' }}>
        Generates realistic-looking test data for fixtures, seeds, and demos.
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ width: 80 }}>
          <InputField label="Count" id="fd-count" value={count} onChange={setCount} placeholder="5" />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['json','csv','text'].map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              style={{
                padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600,
                background: format === f ? 'var(--ss-accent-dim)' : 'var(--ss-bg-elevated)',
                color: format === f ? 'var(--ss-accent)' : 'var(--ss-text-secondary)',
                border: `1px solid ${format === f ? 'var(--ss-accent)' : 'var(--ss-border)'}`,
                borderRadius: 'var(--ss-radius-sm)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <GenerateButton onClick={generate} label="Generate" />
      </div>
      {data.length > 0 && (
        <div className="ss-fade-in" style={{ background: 'var(--ss-bg-secondary)', border: '1px solid var(--ss-border)', borderRadius: 'var(--ss-radius-md)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--ss-bg-tertiary)', borderBottom: '1px solid var(--ss-border)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ss-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{data.length} records</span>
            <CopyButton text={output} size={12} />
          </div>
          <pre style={{ margin: 0, padding: '10px 12px', fontSize: '0.75rem', color: 'var(--ss-text-secondary)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 360, overflow: 'auto' }}>
            {output}
          </pre>
        </div>
      )}
    </SectionCard>
  );
}
