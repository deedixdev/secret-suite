/**
 * secret/library/hashing.js
 * Password hashing — bcrypt, PBKDF2, Argon2id.
 * All functions are async; used in API routes (server only).
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import argon2 from 'argon2';

// ── Bcrypt ────────────────────────────────────────────────────────────────────
export async function bcryptHash(password, rounds = 12) {
  const r = Math.min(Math.max(parseInt(rounds, 10) || 12, 4), 16);
  const salt = bcrypt.genSaltSync(r);
  const hash = bcrypt.hashSync(String(password), salt);
  return { hash, rounds: r };
}
export function bcryptVerify(password, hash) {
  return bcrypt.compareSync(String(password), String(hash));
}

// ── PBKDF2 ────────────────────────────────────────────────────────────────────
export function pbkdf2Hash(password, iterations = 310000) {
  const iters = Math.min(Math.max(parseInt(iterations, 10) || 310000, 1000), 600000);
  const salt = crypto.randomBytes(16);
  const dk = crypto.pbkdf2Sync(String(password), salt, iters, 32, 'sha256');
  return {
    salt: salt.toString('hex'),
    iterations: iters,
    hash: dk.toString('hex'),
  };
}

// ── Argon2id ──────────────────────────────────────────────────────────────────
export async function argon2Hash(password) {
  const hash = await argon2.hash(String(password), {
    type: argon2.argon2id,
    timeCost: 3,
    memoryCost: 64 * 1024,
    parallelism: 2,
    hashLength: 32,
  });
  return hash;
}
export async function argon2Verify(hash, password) {
  try {
    return await argon2.verify(String(hash), String(password));
  } catch {
    return false;
  }
}
