/**
 * POST /api/secret/generate
 * Body: { type: string, params?: object }
 * Returns: { result: string | object }
 *
 * Generates secrets, keys, hashes, and UUIDs.
 * Intentionally kept simple — no auth (local dev tool).
 */
import { NextResponse } from 'next/server';
import {
  generateJwtSecret,
  generateApiKey,
  generateWebhookSecret,
  generatePasswordPepper,
  generateCustomSecret,
  generateRandomPassword,
} from '@/library/secrets';
import {
  generateEncryptionKeyBase64,
  generateAesKeyHex,
  generateAesKeyUrlSafe,
  generateIv12,
  generateIv16,
  sha256,
  sha512,
  sha3_256,
  sha3_512,
  hmacSha256,
  hmacSha512,
  generateUuidV4,
  randomBytesHex,
  randomBytesBase64,
  randomBytesUrlSafe,
  nodeHexSlice32,
  nodeHex16,
  nodeBase64_32,
  nodeUuid,
} from '@/library/keys';
import { bcryptHash, pbkdf2Hash, argon2Hash, argon2Verify, bcryptVerify } from '@/library/hashing';
import {
  aesGcmEncrypt,
  aesGcmDecrypt,
  generateRsaKeypair,
  generateEd25519Keypair,
  generatePgpKeypair,
  generateTotpQr,
} from '@/library/advanced-crypto';
import { generateSshEd25519Keypair, constantTimeCompare } from '@/library/utils';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, params = {} } = body;

  try {
    let result;

    switch (type) {
      // ── Secret Generators ────────────────────────────────────────────────
      case 'jwt-secret':    result = generateJwtSecret(); break;
      case 'api-key':       result = generateApiKey(); break;
      case 'webhook-secret':result = generateWebhookSecret(); break;
      case 'password-pepper':result = generatePasswordPepper(); break;
      case 'custom-secret': result = generateCustomSecret(params.bytes); break;
      case 'random-password':result = generateRandomPassword(params.length); break;

      // ── Encryption Keys ──────────────────────────────────────────────────
      case 'enc-key-b64':   result = generateEncryptionKeyBase64(); break;
      case 'aes-key-hex':   result = generateAesKeyHex(); break;
      case 'aes-key-urlsafe':result = generateAesKeyUrlSafe(); break;
      case 'iv-12':         result = generateIv12(); break;
      case 'iv-16':         result = generateIv16(); break;

      // ── Hash Functions ────────────────────────────────────────────────────
      case 'sha256':        result = sha256(params.data || ''); break;
      case 'sha512':        result = sha512(params.data || ''); break;
      case 'sha3-256':      result = sha3_256(params.data || ''); break;
      case 'sha3-512':      result = sha3_512(params.data || ''); break;
      case 'hmac-sha256':   result = hmacSha256(params.key || '', params.data || ''); break;
      case 'hmac-sha512':   result = hmacSha512(params.key || '', params.data || ''); break;

      // ── UUID & Random ─────────────────────────────────────────────────────
      case 'uuid-v4':       result = generateUuidV4(); break;
      case 'random-hex':    result = randomBytesHex(params.bytes); break;
      case 'random-b64':    result = randomBytesBase64(params.bytes); break;
      case 'random-urlsafe':result = randomBytesUrlSafe(params.bytes); break;

      // ── Node Compat ───────────────────────────────────────────────────────
      case 'node-hex-slice32':result = nodeHexSlice32(); break;
      case 'node-hex16':      result = nodeHex16(); break;
      case 'node-b64-32':     result = nodeBase64_32(); break;
      case 'node-uuid':       result = nodeUuid(); break;

      // ── Password Hashing ──────────────────────────────────────────────────
      case 'bcrypt-hash': {
        const r = await bcryptHash(params.password, params.rounds);
        result = r;
        break;
      }
      case 'bcrypt-verify': {
        const ok = bcryptVerify(params.password, params.hash);
        result = ok ? '✓ VALID — password matches hash' : '✗ INVALID — password does NOT match hash';
        break;
      }
      case 'pbkdf2-hash': {
        result = pbkdf2Hash(params.password, params.iterations);
        break;
      }
      case 'argon2-hash': {
        result = await argon2Hash(params.password);
        break;
      }
      case 'argon2-verify': {
        const ok = await argon2Verify(params.hash, params.password);
        result = ok ? '✓ VALID — password matches hash' : '✗ INVALID — password does NOT match hash';
        break;
      }

      // ── Advanced Crypto ───────────────────────────────────────────────────
      case 'aes-gcm-encrypt': {
        result = aesGcmEncrypt(params.plaintext || '', params.aad || '');
        break;
      }
      case 'aes-gcm-decrypt': {
        result = aesGcmDecrypt(params);
        break;
      }
      case 'rsa-keypair': {
        result = generateRsaKeypair();
        break;
      }
      case 'ed25519-keypair': {
        result = generateEd25519Keypair();
        break;
      }
      case 'pgp-keypair': {
        result = await generatePgpKeypair(params.name, params.email, params.passphrase);
        break;
      }
      case 'totp-qr': {
        result = await generateTotpQr(params.issuer, params.account, params.secret);
        break;
      }

      // ── SSH & Utils ───────────────────────────────────────────────────────
      case 'ssh-ed25519-keypair': {
        result = generateSshEd25519Keypair(params.comment || '');
        break;
      }
      case 'const-time-compare': {
        const equal = constantTimeCompare(params.a || '', params.b || '');
        result = equal ? '✓ MATCH — values are equal (timing-safe)' : '✗ NO MATCH — values differ (timing-safe)';
        break;
      }

      // ── Checksum ──────────────────────────────────────────────────────────
      case 'checksum': {
        const { input: csInput, algorithm: csAlgo } = params;
        const allowed = ['md5', 'sha1', 'sha256', 'sha512'];
        if (!allowed.includes(csAlgo)) throw new Error(`Unsupported algorithm: ${csAlgo}`);
        const crypto = await import('node:crypto');
        result = crypto.createHash(csAlgo).update(csInput || '').digest('hex');
        break;
      }

      // ── QR Code (general) ─────────────────────────────────────────────────
      case 'qr-generate': {
        const { text: qrText, errorCorrectionLevel: qrEcl = 'M' } = params;
        if (!qrText) throw new Error('text is required');
        const QRCode = (await import('qrcode')).default;
        result = await QRCode.toDataURL(qrText, { errorCorrectionLevel: qrEcl, margin: 2, width: 256 });
        break;
      }

      // ── PEM Inspector ─────────────────────────────────────────────────────
      case 'pem-inspect': {
        const { pem } = params;
        if (!pem) throw new Error('pem is required');
        const { X509Certificate } = await import('node:crypto');
        const cert = new X509Certificate(pem);
        const keyDetails = cert.publicKey.asymmetricKeyDetails || {};
        result = {
          subject:       cert.subject,
          issuer:        cert.issuer,
          validFrom:     cert.validFrom,
          validTo:       cert.validTo,
          serialNumber:  cert.serialNumber,
          fingerprint:   cert.fingerprint,
          fingerprint256:cert.fingerprint256,
          keyType:       cert.publicKey.asymmetricKeyType,
          keySize:       keyDetails.modulusLength || keyDetails.namedCurve || null,
          subjectAltName:cert.subjectAltName || null,
          isCA:          cert.ca,
        };
        break;
      }

      // ── HKDF Derivation ───────────────────────────────────────────────────
      case 'hkdf-derive': {
        const { ikm, salt: hkdfSalt, info: hkdfInfo, length: hkdfLen = 32, digest: hkdfDigest = 'sha256' } = params;
        if (!ikm) throw new Error('ikm is required');
        const cryptoNode = await import('node:crypto');
        const ikmBuf  = Buffer.from(ikm);
        const saltBuf = hkdfSalt ? Buffer.from(hkdfSalt) : Buffer.alloc(0);
        const infoBuf = hkdfInfo ? Buffer.from(hkdfInfo) : Buffer.alloc(0);
        const derived = cryptoNode.hkdfSync(hkdfDigest, ikmBuf, saltBuf, infoBuf, Number(hkdfLen) || 32);
        result = {
          hex:    Buffer.from(derived).toString('hex'),
          base64: Buffer.from(derived).toString('base64'),
        };
        break;
      }

      // ── scrypt Derivation ─────────────────────────────────────────────────
      case 'scrypt-derive': {
        const { password: scPw, salt: scSalt = 'salt', keylen: scKeylen = 32, N: scN = 16384, r: scR = 8, p: scP = 1 } = params;
        if (!scPw) throw new Error('password is required');
        const cryptoSc = await import('node:crypto');
        const derivedSc = cryptoSc.scryptSync(scPw, scSalt, Number(scKeylen) || 32, {
          N: Number(scN) || 16384,
          r: Number(scR) || 8,
          p: Number(scP) || 1,
        });
        result = {
          hex:    derivedSc.toString('hex'),
          base64: derivedSc.toString('base64'),
        };
        break;
      }

      // ── ECDH Keypair ──────────────────────────────────────────────────────
      case 'ecdh-keypair': {
        const { curve: ecCurve = 'prime256v1' } = params;
        const allowed = ['prime256v1', 'secp384r1', 'secp521r1'];
        if (!allowed.includes(ecCurve)) throw new Error(`Unsupported curve: ${ecCurve}`);
        const cryptoEc = await import('node:crypto');
        const { privateKey: ecPriv, publicKey: ecPub } = cryptoEc.generateKeyPairSync('ec', {
          namedCurve: ecCurve,
          publicKeyEncoding:  { type: 'spki',  format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        const jwkPublic  = cryptoEc.createPublicKey(ecPub).export({ format: 'jwk' });
        const jwkPrivate = cryptoEc.createPrivateKey(ecPriv).export({ format: 'jwk' });
        result = {
          publicKey:  ecPub,
          privateKey: ecPriv,
          jwkPublic:  JSON.stringify(jwkPublic,  null, 2),
          jwkPrivate: JSON.stringify(jwkPrivate, null, 2),
        };
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
