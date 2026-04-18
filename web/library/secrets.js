/**
 * secret/library/secrets.js
 * Secret generation functions — pure Node.js crypto, no external deps.
 * All functions are synchronous unless noted; safe to call from API routes.
 */
import crypto from 'crypto';

export function generateJwtSecret() {
  return crypto.randomBytes(48).toString('base64url');
}

export function generateApiKey() {
  return crypto.randomBytes(36).toString('base64url');
}

export function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('hex');
}

export function generatePasswordPepper() {
  return crypto.randomBytes(24).toString('base64url');
}

export function generateCustomSecret(bytes = 32) {
  const length = Math.min(Math.max(parseInt(bytes, 10) || 32, 1), 512);
  return crypto.randomBytes(length).toString('base64url');
}

export function generateRandomPassword(length = 16) {
  const len = Math.min(Math.max(parseInt(length, 10) || 16, 4), 128);
  const alphabet =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.<>/?';
  let pwd = '';
  for (let i = 0; i < len; i++) {
    pwd += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return pwd;
}
