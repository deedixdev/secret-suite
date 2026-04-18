/**
 * secret/library/advanced-crypto.js
 * AES-GCM, RSA-4096, Ed25519, PGP keypairs, TOTP QR.
 * Server-only (API routes).
 */
import crypto from 'crypto';
import * as openpgp from 'openpgp';
import qrcode from 'qrcode';

// ── AES-GCM ───────────────────────────────────────────────────────────────────
export function aesGcmEncrypt(plaintext, aad = '') {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    key: key.toString('base64'),
    iv: iv.toString('base64'),
    ciphertext: enc.toString('base64'),
    tag: tag.toString('base64'),
    aad: aad || null,
  };
}

export function aesGcmDecrypt({ key, iv, ciphertext, tag, aad }) {
  const keyBuf  = Buffer.from(key, 'base64');
  const ivBuf   = Buffer.from(iv, 'base64');
  const ctBuf   = Buffer.from(ciphertext, 'base64');
  const tagBuf  = Buffer.from(tag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, ivBuf);
  decipher.setAuthTag(tagBuf);
  if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'));
  const dec = Buffer.concat([decipher.update(ctBuf), decipher.final()]);
  return dec.toString('utf8');
}

// ── RSA & Ed25519 ─────────────────────────────────────────────────────────────
export function generateRsaKeypair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey, publicKey };
}

export function generateEd25519Keypair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey, publicKey };
}

// ── PGP ───────────────────────────────────────────────────────────────────────
export async function generatePgpKeypair(name, email, passphrase = '') {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: 'rsa',
    rsaBits: 4096,
    userIDs: [{ name: String(name), email: String(email) }],
    passphrase: passphrase || undefined,
  });
  return { privateKey, publicKey };
}

// ── TOTP QR ───────────────────────────────────────────────────────────────────
export async function generateTotpQr(issuer, account, secret = '') {
  const totpSecret = secret
    ? String(secret)
    : crypto.randomBytes(10).toString('base64').replace(/[^A-Z2-7]/gi, '').toUpperCase().slice(0, 16);

  const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${totpSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  // Return data URL (PNG, base64) — no file write in web context
  const dataUrl = await qrcode.toDataURL(uri, { width: 256, margin: 2 });
  return { uri, secret: totpSecret, qrDataUrl: dataUrl };
}
