#!/usr/bin/env node
/**
 * secret-util.js — Secret Suite CLI (Node.js / ESM)
 * DeediX Technologies — https://deedixtech.com
 *
 * Usage:
 *   node secret-util.js          interactive TUI
 *   node secret-util.js --help   show all commands
 */

import readline from "readline";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import bcrypt from "bcryptjs";
import argon2 from "argon2";
import qrcode from "qrcode";
import * as openpgp from "openpgp";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const LOG_FILE          = path.join(__dirname, "secret-util.log");
const LOG_META_FILE     = path.join(__dirname, "secret-log-meta.json");
const SECRET_STORE_FILE = path.join(__dirname, "secret-store.json");

// Session-cached keys (unlocked once per run)
let _sessionStoreKey = null;
let _sessionLogKey   = null;

// ── Key derivation ─────────────────────────────────────────────────────────
const STORE_SENTINEL = Buffer.from("DEEDIX_STORE_V1");
const LOG_SENTINEL   = Buffer.from("DEEDIX_LOG_V1");

function deriveKey(password, salt) {
  // maxmem must be > 128 * N * r bytes (64 MB for these params)
  return crypto.scryptSync(password, salt, 32, { N: 65536, r: 8, p: 2, maxmem: 128 * 1024 * 1024 });
}

async function unlockStore() {
  if (_sessionStoreKey) return _sessionStoreKey;
  const store = loadStore();
  const meta  = store.__meta__;
  if (!meta) {
    console.log(dim("\n  First-time Secret Store setup. Choose a master password."));
    console.log(dim("  This password encrypts ALL secrets — do not lose it.\n"));
    const pwd     = await question(cyan("  Set master password: "));
    if (!pwd) { console.log(red("  Password cannot be empty.")); return null; }
    const confirm = await question(cyan("  Confirm password: "));
    if (pwd !== confirm) { console.log(red("  Passwords don't match.")); return null; }
    const salt    = crypto.randomBytes(16);
    const key     = deriveKey(pwd, salt);
    const iv      = crypto.randomBytes(12);
    const cipher  = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ct      = Buffer.concat([cipher.update(STORE_SENTINEL), cipher.final()]);
    const tag     = cipher.getAuthTag();
    store.__meta__ = {
      salt: salt.toString("base64"),
      iv:   iv.toString("base64"),
      ct:   ct.toString("base64"),
      tag:  tag.toString("base64"),
    };
    saveStore(store);
    _sessionStoreKey = key;
    console.log(green("  Store created and locked with master password.\n"));
    return key;
  } else {
    const salt = Buffer.from(meta.salt, "base64");
    const iv   = Buffer.from(meta.iv,   "base64");
    const ct   = Buffer.from(meta.ct,   "base64");
    const tag  = Buffer.from(meta.tag,  "base64");
    const pwd  = await question(cyan("  Store master password: "));
    const key  = deriveKey(pwd, salt);
    try {
      const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
      d.setAuthTag(tag);
      d.update(ct); d.final();
    } catch { console.log(red("  Wrong password.")); return null; }
    _sessionStoreKey = key;
    return key;
  }
}

async function unlockLog() {
  if (_sessionLogKey) return _sessionLogKey;
  if (fs.existsSync(LOG_META_FILE)) {
    const meta = JSON.parse(fs.readFileSync(LOG_META_FILE, "utf8"));
    const salt = Buffer.from(meta.salt, "base64");
    const iv   = Buffer.from(meta.iv,   "base64");
    const ct   = Buffer.from(meta.ct,   "base64");
    const tag  = Buffer.from(meta.tag,  "base64");
    const pwd  = await question(cyan("  Log password: "));
    const key  = deriveKey(pwd, salt);
    try {
      const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
      d.setAuthTag(tag);
      d.update(ct); d.final();
    } catch { console.log(red("  Wrong log password.")); return null; }
    _sessionLogKey = key;
    return key;
  } else {
    console.log(dim("\n  First-time log setup. Set a log password."));
    console.log(dim("  Entries are AES-GCM encrypted — unreadable without this password.\n"));
    const pwd     = await question(cyan("  New log password: "));
    if (!pwd) { console.log(red("  Password cannot be empty.")); return null; }
    const confirm = await question(cyan("  Confirm password: "));
    if (pwd !== confirm) { console.log(red("  Passwords don't match.")); return null; }
    const salt   = crypto.randomBytes(16);
    const key    = deriveKey(pwd, salt);
    const iv     = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ct     = Buffer.concat([cipher.update(LOG_SENTINEL), cipher.final()]);
    const tag    = cipher.getAuthTag();
    fs.writeFileSync(LOG_META_FILE, JSON.stringify({
      salt: salt.toString("base64"),
      iv:   iv.toString("base64"),
      ct:   ct.toString("base64"),
      tag:  tag.toString("base64"),
    }, null, 2), "utf8");
    _sessionLogKey = key;
    console.log(green("  Log locked with password.\n"));
    return key;
  }
}

// ── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  cyan:    "\x1b[36m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  red:     "\x1b[31m",
  magenta: "\x1b[35m",
  blue:    "\x1b[34m",
  white:   "\x1b[97m",
  gray:    "\x1b[90m",
};

const c = (color, text) => `${C[color]}${text}${C.reset}`;
const bold   = (t) => c("bold",    t);
const dim    = (t) => c("dim",     t);
const cyan   = (t) => c("cyan",    t);
const green  = (t) => c("green",   t);
const yellow = (t) => c("yellow",  t);
const red    = (t) => c("red",     t);
const gray   = (t) => c("gray",    t);
const white  = (t) => c("white",   t);

// ── readline ─────────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));

// ── Banner ───────────────────────────────────────────────────────────────────
function printBanner() {
  console.clear();
  console.log(cyan(`
 ██████╗ ███████╗███████╗██████╗ ██╗██╗  ██╗
 ██╔══██╗██╔════╝██╔════╝██╔══██╗██║╚██╗██╔╝
 ██║  ██║█████╗  █████╗  ██║  ██║██║ ╚███╔╝ 
 ██║  ██║██╔══╝  ██╔══╝  ██║  ██║██║ ██╔██╗ 
 ██████╔╝███████╗███████╗██████╔╝██║██╔╝ ██╗
 ╚═════╝ ╚══════╝╚══════╝╚═════╝ ╚═╝╚═╝  ╚═╝
`));
  console.log(gray("───────────────────────────────────────────────────"));
  console.log(bold(white(" Secret Suite CLI  ·  v2.0 ·  DeediX Technologies ")));
  console.log(gray("───────────────────────────────────────────────────\n"));
}

// ── Output ───────────────────────────────────────────────────────────────────
async function chooseOutputMode() {
  console.log(dim("\n  Output mode:"));
  console.log(`  ${cyan("1")}  Plain value`);
  console.log(`  ${cyan("2")}  Labeled`);
  console.log(`  ${cyan("3")}  Labeled + log to file`);
  const mode = await question(cyan("\n  Mode [1/2/3]: "));
  return ["1","2","3"].includes(mode) ? mode : "1";
}

async function writeLog(label, value) {
  const key = await unlockLog();
  if (!key) { console.log(red("  Could not unlock log — entry not saved.")); return; }
  const ts        = new Date().toISOString();
  const plaintext = Buffer.from(`[${ts}] ${label}: ${value}`, "utf8");
  const iv        = crypto.randomBytes(12);
  const cipher    = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct        = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag       = cipher.getAuthTag();
  const entry     = JSON.stringify({ n: iv.toString("base64"), c: ct.toString("base64"), t: tag.toString("base64") });
  fs.appendFileSync(LOG_FILE, entry + "\n", "utf8");
}

async function outputResult(label, value) {
  const mode = await chooseOutputMode();
  console.log();
  if (mode === "1") {
    console.log(green(value));
  } else if (mode === "2") {
    console.log(yellow(`  ┌── ${label}`));
    console.log(green(`  ${value.split("\n").join("\n  ")}`));
    console.log(yellow(`  └─────────────────────────`));
  } else {
    console.log(yellow(`  ┌── ${label}  ${dim("[logged]")}`));
    console.log(green(`  ${value.split("\n").join("\n  ")}`));
    console.log(yellow(`  └─────────────────────────`));
    await writeLog(label, value);
    console.log(dim(`  Logged → ${LOG_FILE}`));
  }
  await question(dim("\n  Press Enter to continue…"));
}

// ── Secret Generators ────────────────────────────────────────────────────────
const generateJwtSecret     = () => crypto.randomBytes(48).toString("base64url");
const generateApiKey        = () => crypto.randomBytes(36).toString("base64url");
const generateWebhookSecret = () => crypto.randomBytes(32).toString("hex");
const generatePasswordPepper= () => crypto.randomBytes(24).toString("base64url");

async function generateCustomSecret() {
  const len = parseInt(await question("  Bytes (default 32): ") || "32", 10);
  return crypto.randomBytes(len).toString("base64url");
}

async function generateRandomPassword() {
  const len = parseInt(await question("  Length (default 20): ") || "20", 10);
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.<>/?";
  let pwd = "";
  for (let i = 0; i < len; i++) pwd += alphabet[crypto.randomInt(0, alphabet.length)];
  return pwd;
}

// ── Encryption Keys ───────────────────────────────────────────────────────────
const generateEncryptionKeyBase64 = () => crypto.randomBytes(32).toString("base64url");
const generateAesKeyHex           = () => crypto.randomBytes(32).toString("hex");
const generateAesKeyUrlSafe       = () => crypto.randomBytes(32).toString("base64url");
const generateIv                  = () => crypto.randomBytes(16).toString("hex");
const generateIv96                = () => crypto.randomBytes(12).toString("hex");

// ── Password Hashing ──────────────────────────────────────────────────────────
async function bcryptHashPassword() {
  const password = await question("  Password: ");
  const rounds   = parseInt(await question("  Rounds (default 12): ") || "12", 10);
  const hash     = bcrypt.hashSync(password, bcrypt.genSaltSync(rounds));
  return `hash=${hash}\nrounds=${rounds}`;
}

async function bcryptVerifyPassword() {
  const hash     = await question("  Bcrypt hash: ");
  const password = await question("  Password: ");
  return bcrypt.compareSync(password, hash)
    ? "✔  VALID — password matches"
    : "✘  INVALID — password does NOT match";
}

async function pbkdf2HashPassword() {
  const password   = await question("  Password: ");
  const iterations = parseInt(await question("  Iterations (default 310000): ") || "310000", 10);
  const salt       = crypto.randomBytes(16);
  const dk         = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
  return `salt=${salt.toString("hex")}\niterations=${iterations}\nhash=${dk.toString("hex")}`;
}

async function argon2HashPassword() {
  const password = await question("  Password: ");
  return argon2.hash(password, { type: argon2.argon2id, timeCost: 3, memoryCost: 65536, parallelism: 2, hashLength: 32 });
}

async function argon2VerifyPassword() {
  const hash     = await question("  Argon2id hash: ");
  const password = await question("  Password: ");
  try {
    return (await argon2.verify(hash, password))
      ? "✔  VALID — password matches"
      : "✘  INVALID — password does NOT match";
  } catch { return "✘  INVALID — bad hash format"; }
}

// ── Hash Functions ────────────────────────────────────────────────────────────
const hashOf = (algo) => async () => {
  const data = await question("  Input: ");
  return crypto.createHash(algo).update(data).digest("hex");
};

async function hmacOf(algo) {
  const key  = await question("  HMAC key: ");
  const data = await question("  Data: ");
  return crypto.createHmac(algo, key).update(data).digest("hex");
}

const sha256Hash   = hashOf("sha256");
const sha512Hash   = hashOf("sha512");
const sha3_256Hash = hashOf("sha3-256");
const sha3_512Hash = hashOf("sha3-512");
const hmacSha256   = () => hmacOf("sha256");
const hmacSha512   = () => hmacOf("sha512");

// ── UUID & Random ─────────────────────────────────────────────────────────────
const generateUuidV4 = () => crypto.randomUUID();

const randomBytes = (enc) => async () => {
  const len = parseInt(await question("  Bytes (default 16): ") || "16", 10);
  return crypto.randomBytes(len).toString(enc);
};

const randomBytesHex     = randomBytes("hex");
const randomBytesBase64  = randomBytes("base64");
const randomBytesUrlSafe = randomBytes("base64url");

// ── Node compat ───────────────────────────────────────────────────────────────
const nodeStyleHexSlice32        = () => crypto.randomBytes(32).toString("hex").slice(0, 32);
const nodeStyleRandomBytes16Hex  = () => crypto.randomBytes(16).toString("hex");
const nodeStyleRandomBytes32B64  = () => crypto.randomBytes(32).toString("base64");
const nodeStyleRandomUuid        = () => crypto.randomUUID();

// ── Encoders / Decoders ───────────────────────────────────────────────────────
async function base64Encode() {
  const input = await question("  Input (UTF-8): ");
  return Buffer.from(input, "utf8").toString("base64");
}

async function base64Decode() {
  const input = await question("  Base64 input: ");
  try { return Buffer.from(input, "base64").toString("utf8"); }
  catch { return "[error] Invalid Base64"; }
}

async function base64UrlEncode() {
  const input = await question("  Input (UTF-8): ");
  return Buffer.from(input, "utf8").toString("base64url");
}

async function hexEncode() {
  const input = await question("  Input (UTF-8): ");
  return Buffer.from(input, "utf8").toString("hex");
}

async function hexDecode() {
  const input = await question("  Hex input: ");
  try { return Buffer.from(input, "hex").toString("utf8"); }
  catch { return "[error] Invalid hex"; }
}

async function urlEncode() {
  const input = await question("  Input: ");
  return encodeURIComponent(input);
}

async function urlDecode() {
  const input = await question("  URL-encoded input: ");
  try { return decodeURIComponent(input); }
  catch { return "[error] Invalid URL encoding"; }
}

// ── JWT Inspector ─────────────────────────────────────────────────────────────
async function jwtInspect() {
  const token = await question("  JWT token: ");
  const parts = token.split(".");
  if (parts.length !== 3) return "[error] Not a valid JWT (expected 3 parts)";

  const decode = (s) => {
    try {
      const padded = s + "=".repeat((4 - s.length % 4) % 4);
      return JSON.parse(Buffer.from(padded, "base64url").toString("utf8"));
    } catch { return "[invalid]"; }
  };

  const header  = decode(parts[0]);
  const payload = decode(parts[1]);
  const now     = Math.floor(Date.now() / 1000);
  const exp     = payload?.exp;
  const status  = exp ? (exp > now ? `✔ VALID — expires ${new Date(exp*1000).toISOString()}` : `✘ EXPIRED — ${new Date(exp*1000).toISOString()}`) : "no exp claim";

  return `HEADER:\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}\n\nSIGNATURE: ${parts[2]}\n\nEXPIRY: ${status}`;
}

// ── Timestamps ────────────────────────────────────────────────────────────────
async function timestampTools() {
  console.log(dim("\n  1  Current timestamps"));
  console.log(dim("  2  Unix → ISO"));
  console.log(dim("  3  ISO → Unix"));
  console.log(dim("  4  Expiry calculator"));
  const c = await question(cyan("\n  Choose: "));

  if (c === "1") {
    const now = Date.now();
    return `ISO:   ${new Date(now).toISOString()}\nUnix:  ${Math.floor(now/1000)}\nUnix ms: ${now}`;
  }
  if (c === "2") {
    const u = parseInt(await question("  Unix timestamp (s): "), 10);
    return new Date(u * 1000).toISOString();
  }
  if (c === "3") {
    const iso = await question("  ISO string: ");
    return `${Math.floor(new Date(iso).getTime() / 1000)}`;
  }
  if (c === "4") {
    const s = parseInt(await question("  Seconds from now: "), 10);
    const ts = Math.floor(Date.now()/1000) + s;
    return `Unix: ${ts}\nISO:  ${new Date(ts*1000).toISOString()}`;
  }
  return "Invalid choice";
}

// ── AES-GCM ───────────────────────────────────────────────────────────────────
async function aesGcmEncrypt() {
  const plaintext = await question("  Plaintext: ");
  const aad       = await question("  AAD (optional, Enter to skip): ");
  const key       = crypto.randomBytes(32);
  const iv        = crypto.randomBytes(12);
  const cipher    = crypto.createCipheriv("aes-256-gcm", key, iv);
  if (aad) cipher.setAAD(Buffer.from(aad));
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ key: key.toString("base64"), iv: iv.toString("base64"), ciphertext: enc.toString("base64"), tag: tag.toString("base64"), aad: aad || null }, null, 2);
}

async function aesGcmDecrypt() {
  const blob    = await question("  Paste AES-GCM JSON: ");
  const d       = JSON.parse(blob);
  const key     = Buffer.from(d.key, "base64");
  const iv      = Buffer.from(d.iv, "base64");
  const ct      = Buffer.from(d.ciphertext, "base64");
  const tag     = Buffer.from(d.tag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  if (d.aad) decipher.setAAD(Buffer.from(d.aad));
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// ── RSA / Ed25519 / ECDH ──────────────────────────────────────────────────────
function generateRsaKeypair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding:  { type: "spki",  format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return `PRIVATE KEY:\n${privateKey}\nPUBLIC KEY:\n${publicKey}`;
}

function generateEd25519Keypair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding:  { type: "spki",  format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return `PRIVATE KEY:\n${privateKey}\nPUBLIC KEY:\n${publicKey}`;
}

async function generateEcdhKeypair() {
  const curves = ["P-256","P-384","P-521"];
  console.log(dim("\n  Curves: ") + curves.map((c,i)=>`${cyan(i+1+"")} ${c}`).join("  "));
  const idx = parseInt(await question(cyan("  Choose [1-3]: ")) || "1", 10) - 1;
  const curve = curves[Math.max(0, Math.min(2, idx))];
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: curve,
    publicKeyEncoding:  { type: "spki",  format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return `CURVE: ${curve}\n\nPRIVATE KEY (PEM):\n${privateKey}\nPUBLIC KEY (PEM):\n${publicKey}`;
}

// ── SSH keypair (Ed25519 wire format) ─────────────────────────────────────────
function generateSshEd25519Keypair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding:  { type: "spki",  format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return `OpenSSH Ed25519 keypair\n\nPUBLIC KEY (PEM):\n${publicKey}\nPRIVATE KEY (PEM):\n${privateKey}\n\nNote: To convert to OpenSSH wire format, save the private key to a file and run:\n  ssh-keygen -f <file> -y > <file>.pub`;
}

// ── HKDF ─────────────────────────────────────────────────────────────────────
async function hkdfDerive() {
  const ikm    = await question("  IKM (hex or leave blank for random 32 bytes): ");
  const salt   = await question("  Salt (hex or blank for none): ");
  const info   = await question("  Info string (optional): ");
  const lenStr = await question("  Output length bytes (default 32): ");
  const len    = parseInt(lenStr || "32", 10);

  const ikmBuf  = ikm   ? Buffer.from(ikm, "hex")  : crypto.randomBytes(32);
  const saltBuf = salt  ? Buffer.from(salt, "hex")  : undefined;
  const infoBuf = Buffer.from(info || "", "utf8");

  const derived = crypto.hkdfSync("sha256", ikmBuf, saltBuf || Buffer.alloc(32), infoBuf, len);
  return `IKM:     ${ikmBuf.toString("hex")}\nSalt:    ${saltBuf?.toString("hex") ?? "(none)"}\nInfo:    "${info}"\nDerived: ${Buffer.from(derived).toString("hex")}`;
}

// ── scrypt ────────────────────────────────────────────────────────────────────
async function scryptDerive() {
  const password = await question("  Password: ");
  const salt     = await question("  Salt (hex or blank for random): ");
  const saltBuf  = salt ? Buffer.from(salt, "hex") : crypto.randomBytes(16);
  const key      = crypto.scryptSync(password, saltBuf, 32, { N: 16384, r: 8, p: 1 });
  return `Salt:    ${saltBuf.toString("hex")}\nDerived: ${key.toString("hex")}\nParams:  N=16384 r=8 p=1`;
}

// ── PGP ───────────────────────────────────────────────────────────────────────
async function generatePgpKeypair() {
  const name       = await question("  PGP Name: ");
  const email      = await question("  PGP Email: ");
  const passphrase = await question("  Passphrase (blank = none): ");
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: "rsa", rsaBits: 4096,
    userIDs: [{ name, email }],
    passphrase: passphrase || undefined,
  });
  return `PUBLIC KEY:\n${publicKey}\n\nPRIVATE KEY:\n${privateKey}`;
}

// ── TOTP QR ───────────────────────────────────────────────────────────────────
async function generateTotpQr() {
  const issuer  = await question("  Issuer (e.g. DeediX Mail): ");
  const account = await question("  Account (e.g. user@example.com): ");
  let secret    = await question("  TOTP Secret (Base32, blank = random): ");
  if (!secret) secret = crypto.randomBytes(10).toString("base64").replace(/[^A-Z2-7]/gi,"").slice(0,16).toUpperCase();
  const uri     = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  const file    = path.join(__dirname, `totp-${account.replace(/@/,"_")}.png`);
  await qrcode.toFile(file, uri);
  return `URI:    ${uri}\nSaved:  ${file}`;
}

// ── Encrypted store ───────────────────────────────────────────────────────────
const loadStore = () => fs.existsSync(SECRET_STORE_FILE) ? JSON.parse(fs.readFileSync(SECRET_STORE_FILE,"utf8")) : {};
const saveStore = (s) => fs.writeFileSync(SECRET_STORE_FILE, JSON.stringify(s, null, 2), "utf8");

async function storeSecretEncrypted() {
  const master = await unlockStore();
  if (!master) return "Aborted — store locked.";
  const name  = await question("  Secret name: ");
  if (!name) return "Name cannot be empty.";
  const value  = await question("  Value: ");
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", master, iv);
  const enc    = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();
  const store  = loadStore();
  store[name]  = { iv: iv.toString("base64"), ciphertext: enc.toString("base64"), tag: tag.toString("base64") };
  saveStore(store);
  const count = Object.keys(store).filter(k => k !== "__meta__").length;
  return `Stored '${name}' — ${count} secret(s) in store.`;
}

async function retrieveSecretEncrypted() {
  const master = await unlockStore();
  if (!master) return "Aborted — store locked.";
  const store   = loadStore();
  const entries = Object.keys(store).filter(k => k !== "__meta__");
  if (!entries.length) return "Store is empty.";
  console.log(dim(`\n  Stored keys: ${entries.join(", ")}`));
  const name = await question("  Secret name: ");
  if (!store[name]) return `'${name}' not found.`;
  const e = store[name];
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", master, Buffer.from(e.iv, "base64"));
    d.setAuthTag(Buffer.from(e.tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(e.ciphertext, "base64")), d.final()]).toString("utf8");
  } catch { return "[error] Decryption failed — wrong password or corrupted entry"; }
}

// ── Constant-time compare ─────────────────────────────────────────────────────
async function constantTimeCompare() {
  const a = await question("  String A: ");
  const b = await question("  String B: ");
  if (a.length !== b.length) return `✘  Different lengths — trivially not equal`;
  const match = crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  return match ? "✔  EQUAL (timing-safe)" : "✘  NOT EQUAL (timing-safe)";
}

// ── Checksum ──────────────────────────────────────────────────────────────────
async function checksumFile() {
  const file = await question("  File path: ");
  if (!fs.existsSync(file)) return `[error] File not found: ${file}`;
  const data = fs.readFileSync(file);
  return [
    `File:    ${file}`,
    `MD5:     ${crypto.createHash("md5").update(data).digest("hex")}`,
    `SHA-1:   ${crypto.createHash("sha1").update(data).digest("hex")}`,
    `SHA-256: ${crypto.createHash("sha256").update(data).digest("hex")}`,
    `SHA-512: ${crypto.createHash("sha512").update(data).digest("hex")}`,
  ].join("\n");
}

// ── Menus ─────────────────────────────────────────────────────────────────────
function menuItem(num, label, desc) {
  return `  ${cyan(num.toString().padStart(2))}  ${white(label.padEnd(28))} ${dim(desc)}`;
}

function printMenu(title, items, back = "0") {
  console.log(`\n  ${yellow("┌─")} ${bold(title)}`);
  items.forEach(([n, l, d]) => console.log(menuItem(n, l, d)));
  console.log(`  ${cyan(back.padStart(2))}  ${dim("Back / Exit")}`);
  console.log();
}

function printMainMenu() {
  printBanner();
  console.log(`  ${yellow("┌─")} ${bold("MAIN MENU")}`);
  console.log(menuItem(1,  "Secret Generators",    "JWT, API key, webhook, pepper…"));
  console.log(menuItem(2,  "Password Hashing",     "bcrypt, PBKDF2, Argon2id"));
  console.log(menuItem(3,  "Encryption Keys",      "AES-256 keys & IVs"));
  console.log(menuItem(4,  "Hash Functions",       "SHA-256/512, SHA3, HMAC"));
  console.log(menuItem(5,  "UUID & Random",        "UUID v4, random bytes"));
  console.log(menuItem(6,  "Node.js Compat",       "randomBytes patterns"));
  console.log(menuItem(7,  "Advanced Crypto",      "AES-GCM, RSA, Ed25519, PGP, TOTP"));
  console.log(menuItem(8,  "Encoders / Decoders",  "Base64, Hex, URL encode/decode"));
  console.log(menuItem(9,  "JWT Inspector",        "Decode & verify JWT tokens"));
  console.log(menuItem(10, "Timestamp Tools",      "Unix/ISO conversion & expiry"));
  console.log(menuItem(11, "Key Derivation",       "HKDF, scrypt, ECDH keypair"));
  console.log(menuItem(12, "Secret Store",         "Encrypted local secret store"));
  console.log(menuItem(13, "Utilities",            "Constant-time compare, checksum"));
  console.log(`   ${cyan("0")}  ${dim("Exit")}\n`);
}

// ── Sub-menu handlers ─────────────────────────────────────────────────────────
async function handleSecretGenerators() {
  while (true) {
    printMenu("SECRET GENERATORS", [
      [1,"JWT Secret",         "HS256/HS512 ready"],
      [2,"API Key",            "36-byte base64url"],
      [3,"Webhook Secret",     "hex"],
      [4,"Password Pepper",    "base64url"],
      [5,"Custom Secret",      "choose byte length"],
      [6,"Random Password",    "printable chars"],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("JWT Secret",        generateJwtSecret());
    else if (c==="2") await outputResult("API Key",           generateApiKey());
    else if (c==="3") await outputResult("Webhook Secret",    generateWebhookSecret());
    else if (c==="4") await outputResult("Password Pepper",   generatePasswordPepper());
    else if (c==="5") await outputResult("Custom Secret",     await generateCustomSecret());
    else if (c==="6") await outputResult("Random Password",   await generateRandomPassword());
    else if (c==="0") break;
  }
}

async function handlePasswordHashing() {
  while (true) {
    printMenu("PASSWORD HASHING", [
      [1,"bcrypt Hash",        "bcrypt with configurable rounds"],
      [2,"bcrypt Verify",      "check password against hash"],
      [3,"PBKDF2 Hash",        "SHA-256, 310k iterations"],
      [4,"Argon2id Hash",      "memory-hard, recommended"],
      [5,"Argon2id Verify",    "check password against hash"],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("bcrypt Hash",         await bcryptHashPassword());
    else if (c==="2") await outputResult("bcrypt Verify",       await bcryptVerifyPassword());
    else if (c==="3") await outputResult("PBKDF2 Hash",         await pbkdf2HashPassword());
    else if (c==="4") await outputResult("Argon2id Hash",       await argon2HashPassword());
    else if (c==="5") await outputResult("Argon2id Verify",     await argon2VerifyPassword());
    else if (c==="0") break;
  }
}

async function handleEncryptionKeys() {
  while (true) {
    printMenu("ENCRYPTION KEYS", [
      [1,"AES-256 Key (base64url)", "32 bytes"],
      [2,"AES-256 Key (hex)",       "64 hex chars"],
      [3,"AES-256 Key (urlsafe)",   "base64url"],
      [4,"IV 16-byte (hex)",        "for CBC"],
      [5,"IV 12-byte (hex)",        "for GCM"],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("AES-256 Key (b64url)", generateEncryptionKeyBase64());
    else if (c==="2") await outputResult("AES-256 Key (hex)",    generateAesKeyHex());
    else if (c==="3") await outputResult("AES-256 Key (urlsafe)",generateAesKeyUrlSafe());
    else if (c==="4") await outputResult("IV 16-byte",           generateIv());
    else if (c==="5") await outputResult("IV 12-byte",           generateIv96());
    else if (c==="0") break;
  }
}

async function handleHashFunctions() {
  while (true) {
    printMenu("HASH FUNCTIONS", [
      [1,"SHA-256",    ""], [2,"SHA-512",    ""],
      [3,"SHA3-256",   ""], [4,"SHA3-512",   ""],
      [5,"HMAC-SHA256",""], [6,"HMAC-SHA512",""],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("SHA-256",    await sha256Hash());
    else if (c==="2") await outputResult("SHA-512",    await sha512Hash());
    else if (c==="3") await outputResult("SHA3-256",   await sha3_256Hash());
    else if (c==="4") await outputResult("SHA3-512",   await sha3_512Hash());
    else if (c==="5") await outputResult("HMAC-SHA256",await hmacSha256());
    else if (c==="6") await outputResult("HMAC-SHA512",await hmacSha512());
    else if (c==="0") break;
  }
}

async function handleUuidRandom() {
  while (true) {
    printMenu("UUID & RANDOM", [
      [1,"UUID v4",           ""], [2,"Random Bytes (hex)",    ""],
      [3,"Random Bytes (b64)",""], [4,"Random Bytes (urlsafe)",""],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("UUID v4",              generateUuidV4());
    else if (c==="2") await outputResult("Random Bytes (hex)",   await randomBytesHex());
    else if (c==="3") await outputResult("Random Bytes (b64)",   await randomBytesBase64());
    else if (c==="4") await outputResult("Random Bytes (urlsafe)",await randomBytesUrlSafe());
    else if (c==="0") break;
  }
}

async function handleNodeCompat() {
  while (true) {
    printMenu("NODE.JS COMPAT", [
      [1,"randomBytes(32).hex().slice(0,32)",""],
      [2,"randomBytes(16).hex()",            ""],
      [3,"randomBytes(32).base64()",         ""],
      [4,"crypto.randomUUID()",              ""],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("hex.slice(0,32)",  nodeStyleHexSlice32());
    else if (c==="2") await outputResult("16-byte hex",      nodeStyleRandomBytes16Hex());
    else if (c==="3") await outputResult("32-byte base64",   nodeStyleRandomBytes32B64());
    else if (c==="4") await outputResult("randomUUID",       nodeStyleRandomUuid());
    else if (c==="0") break;
  }
}

async function handleAdvancedCrypto() {
  while (true) {
    printMenu("ADVANCED CRYPTO", [
      [1,"AES-GCM Encrypt",      ""], [2,"AES-GCM Decrypt",     ""],
      [3,"RSA-4096 Keypair",     ""], [4,"Ed25519 Keypair",      ""],
      [5,"SSH Ed25519 Keypair",  ""], [6,"ECDH Keypair",         ""],
      [7,"PGP Keypair (RSA4096)",""], [8,"TOTP QR (otpauth://)", ""],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("AES-GCM Ciphertext",   await aesGcmEncrypt());
    else if (c==="2") await outputResult("AES-GCM Plaintext",    await aesGcmDecrypt());
    else if (c==="3") await outputResult("RSA-4096 Keypair",     generateRsaKeypair());
    else if (c==="4") await outputResult("Ed25519 Keypair",      generateEd25519Keypair());
    else if (c==="5") await outputResult("SSH Ed25519 Keypair",  generateSshEd25519Keypair());
    else if (c==="6") await outputResult("ECDH Keypair",         await generateEcdhKeypair());
    else if (c==="7") await outputResult("PGP Keypair",          await generatePgpKeypair());
    else if (c==="8") await outputResult("TOTP QR",              await generateTotpQr());
    else if (c==="0") break;
  }
}

async function handleEncoders() {
  while (true) {
    printMenu("ENCODERS / DECODERS", [
      [1,"Base64 Encode",    ""], [2,"Base64 Decode",    ""],
      [3,"Base64url Encode", ""], [4,"Hex Encode",       ""],
      [5,"Hex Decode",       ""], [6,"URL Encode",       ""],
      [7,"URL Decode",       ""],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("Base64",       await base64Encode());
    else if (c==="2") await outputResult("Decoded",      await base64Decode());
    else if (c==="3") await outputResult("Base64url",    await base64UrlEncode());
    else if (c==="4") await outputResult("Hex",          await hexEncode());
    else if (c==="5") await outputResult("Hex Decoded",  await hexDecode());
    else if (c==="6") await outputResult("URL Encoded",  await urlEncode());
    else if (c==="7") await outputResult("URL Decoded",  await urlDecode());
    else if (c==="0") break;
  }
}

async function handleKeyDerivation() {
  while (true) {
    printMenu("KEY DERIVATION", [
      [1,"HKDF (RFC 5869)","SHA-256"],
      [2,"scrypt (RFC 7914)","N=16384 r=8 p=1"],
      [3,"ECDH Keypair","P-256 / P-384 / P-521"],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("HKDF Derived Key",  await hkdfDerive());
    else if (c==="2") await outputResult("scrypt Derived Key", await scryptDerive());
    else if (c==="3") await outputResult("ECDH Keypair",       await generateEcdhKeypair());
    else if (c==="0") break;
  }
}

async function handleSecretStore() {
  while (true) {
    printMenu("SECRET STORE", [
      [1,"Store Secret","AES-GCM encrypted"],
      [2,"Retrieve Secret",""],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("Stored",    await storeSecretEncrypted());
    else if (c==="2") await outputResult("Retrieved", await retrieveSecretEncrypted());
    else if (c==="0") break;
  }
}

async function viewLog() {
  const key = await unlockLog();
  if (!key) return "Aborted — log locked.";
  if (!fs.existsSync(LOG_FILE)) return "Log file is empty.";
  const lines = fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean);
  if (!lines.length) return "Log is empty.";
  const out = [];
  lines.forEach((line, i) => {
    try {
      const obj = JSON.parse(line);
      const d   = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(obj.n, "base64"));
      d.setAuthTag(Buffer.from(obj.t, "base64"));
      const text = Buffer.concat([d.update(Buffer.from(obj.c, "base64")), d.final()]).toString("utf8");
      out.push(`  ${dim(String(i+1).padStart(3))}  ${text}`);
    } catch {
      out.push(`  ${dim(String(i+1).padStart(3))}  ${yellow("[unreadable — wrong password or pre-encryption entry]")}`);
    }
  });
  return out.join("\n");
}

async function handleUtilities() {
  while (true) {
    printMenu("UTILITIES", [
      [1,"Constant-Time Compare","timing-safe equality"],
      [2,"File Checksum","MD5 / SHA-1 / SHA-256 / SHA-512"],
      [3,"View Log","decrypt & display log entries"],
    ]);
    const c = await question(cyan("  Select: "));
    if      (c==="1") await outputResult("Compare Result",  await constantTimeCompare());
    else if (c==="2") await outputResult("Checksums",       await checksumFile());
    else if (c==="3") await outputResult("Log Entries",     await viewLog());
    else if (c==="0") break;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  while (true) {
    printMainMenu();
    const c = await question(cyan("  Select: "));
    if      (c==="1")  await handleSecretGenerators();
    else if (c==="2")  await handlePasswordHashing();
    else if (c==="3")  await handleEncryptionKeys();
    else if (c==="4")  await handleHashFunctions();
    else if (c==="5")  await handleUuidRandom();
    else if (c==="6")  await handleNodeCompat();
    else if (c==="7")  await handleAdvancedCrypto();
    else if (c==="8")  await handleEncoders();
    else if (c==="9")  await outputResult("JWT Inspection", await jwtInspect());
    else if (c==="10") await outputResult("Timestamps",     await timestampTools());
    else if (c==="11") await handleKeyDerivation();
    else if (c==="12") await handleSecretStore();
    else if (c==="13") await handleUtilities();
    else if (c==="0") {
      console.log(cyan("\n  Thank you for using Secret Suite CLI • DeediX Technologies\n"));
      break;
    }
  }
  rl.close();
}

main().catch((err) => { console.error(red(`\n  Error: ${err.message}`)); rl.close(); });
