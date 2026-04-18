/**
 * secret/library/utils.js
 * SSH ed25519 keypair in proper OpenSSH wire format + timing-safe compare.
 */
import crypto from 'crypto';

// ── Helpers ──────────────────────────────────────────────────────────────────
function uint32BE(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n);
  return b;
}
function sshEncode(buf) {
  return Buffer.concat([uint32BE(buf.length), buf]);
}

// ── SSH ed25519 Keypair ───────────────────────────────────────────────────────
export function generateSshEd25519Keypair(comment = '') {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');

  // ed25519 SPKI DER = 12-byte header + 32-byte raw public key
  const spkiDer = publicKey.export({ type: 'spki', format: 'der' });
  const rawPubKey = spkiDer.slice(12);

  // ed25519 PKCS8 DER = 16-byte header + 32-byte raw private key
  const pkcs8Der = privateKey.export({ type: 'pkcs8', format: 'der' });
  const rawPrivKey = pkcs8Der.slice(-32);

  // ── SSH wire-format public key ────────────────────────────────────────────
  const keyType = Buffer.from('ssh-ed25519');
  const sshPubKeyBuf = Buffer.concat([sshEncode(keyType), sshEncode(rawPubKey)]);
  const commentStr = comment || '';
  const sshPublicKey = `ssh-ed25519 ${sshPubKeyBuf.toString('base64')}${commentStr ? ' ' + commentStr : ''}`;

  // ── OpenSSH private key format ────────────────────────────────────────────
  const checkInt = crypto.randomBytes(4);
  const commentBuf = Buffer.from(commentStr);
  // ed25519 SSH private key blob = 64 bytes (raw_priv || raw_pub)
  const sshPrivKeyData = Buffer.concat([rawPrivKey, rawPubKey]);

  let privateBlob = Buffer.concat([
    checkInt,                 // check_int (repeated for integrity)
    checkInt,
    sshEncode(keyType),       // key type string
    sshEncode(rawPubKey),     // public key
    sshEncode(sshPrivKeyData),// private key (64 bytes)
    sshEncode(commentBuf),    // comment
  ]);

  // Pad to cipher block size (8 for "none" cipher)
  const rem = privateBlob.length % 8;
  if (rem !== 0) {
    const pad = Buffer.from(Array.from({ length: 8 - rem }, (_, i) => i + 1));
    privateBlob = Buffer.concat([privateBlob, pad]);
  }

  const opensshBin = Buffer.concat([
    Buffer.from('openssh-key-v1\0'),  // magic
    sshEncode(Buffer.from('none')),   // cipher name
    sshEncode(Buffer.from('none')),   // kdf name
    sshEncode(Buffer.alloc(0)),       // kdf options
    uint32BE(1),                      // number of keys
    sshEncode(sshPubKeyBuf),          // public key
    sshEncode(privateBlob),           // private key blob
  ]);

  const b64 = opensshBin.toString('base64').match(/.{1,70}/g).join('\n');
  const sshPrivateKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${b64}\n-----END OPENSSH PRIVATE KEY-----`;

  return { publicKey: sshPublicKey, privateKey: sshPrivateKey };
}

// ── Constant-time compare ─────────────────────────────────────────────────────
export function constantTimeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still call timingSafeEqual on equal-length buffers to avoid short-circuit
    crypto.timingSafeEqual(Buffer.alloc(1), Buffer.alloc(1));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
