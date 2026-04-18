/**
 * secret/library/keys.js
 * Encryption key and IV generators + hash functions.
 */
import crypto from 'crypto';

// ── Encryption Keys ──────────────────────────────────────────────────────────
export function generateEncryptionKeyBase64() {
  return crypto.randomBytes(32).toString('base64url');
}
export function generateAesKeyHex() {
  return crypto.randomBytes(32).toString('hex');
}
export function generateAesKeyUrlSafe() {
  return crypto.randomBytes(32).toString('base64url');
}
export function generateIv12() {
  return crypto.randomBytes(12).toString('hex');
}
export function generateIv16() {
  return crypto.randomBytes(16).toString('hex');
}

// ── Hashes ────────────────────────────────────────────────────────────────────
export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
export function sha512(data) {
  return crypto.createHash('sha512').update(data).digest('hex');
}
export function sha3_256(data) {
  return crypto.createHash('sha3-256').update(data).digest('hex');
}
export function sha3_512(data) {
  return crypto.createHash('sha3-512').update(data).digest('hex');
}
export function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}
export function hmacSha512(key, data) {
  return crypto.createHmac('sha512', key).update(data).digest('hex');
}

// ── UUID & Random ─────────────────────────────────────────────────────────────
export function generateUuidV4() {
  return crypto.randomUUID();
}
export function randomBytesHex(bytes = 16) {
  return crypto.randomBytes(Math.min(parseInt(bytes, 10) || 16, 256)).toString('hex');
}
export function randomBytesBase64(bytes = 16) {
  return crypto.randomBytes(Math.min(parseInt(bytes, 10) || 16, 256)).toString('base64');
}
export function randomBytesUrlSafe(bytes = 16) {
  return crypto.randomBytes(Math.min(parseInt(bytes, 10) || 16, 256)).toString('base64url');
}

// ── Node-compat shortcuts ─────────────────────────────────────────────────────
export function nodeHexSlice32() {
  return crypto.randomBytes(32).toString('hex').slice(0, 32);
}
export function nodeHex16() {
  return crypto.randomBytes(16).toString('hex');
}
export function nodeBase64_32() {
  return crypto.randomBytes(32).toString('base64');
}
export function nodeUuid() {
  return crypto.randomUUID();
}
