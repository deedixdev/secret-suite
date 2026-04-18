# Secret Suite
### Cryptographic Toolkit by DeediX Technologies
**Web app + CLI (Node.js and Python 3)**

Secret Suite is a free, open-source cryptographic toolkit that runs entirely on your local machine. 27+ tools covering hashing, encryption, key generation, JWT inspection, and more. Nothing leaves your machine.

---

## Versions

| Version | Location | Description |
|---------|----------|-------------|
| Web app | `app/tools/secret-suite/` | Next.js UI, runs server-side |
| Node.js CLI | `secret-suite/secret-util.js` | Interactive terminal CLI |
| Python 3 CLI | `secret-suite//secret-util.py` | Interactive terminal CLI |

---

## Quick Start

### Web app
```bash
git clone https://github.com/deedixdev/secret-suite
cd secret-suite
npm install
npm run dev
# open http://localhost:3000/tools/secret-suite
```

### Node.js CLI
```bash
# requires Node.js >= 18
npm install bcryptjs argon2 qrcode openpgp
node secret-suite/secret-util.js
```

### Python 3 CLI
```bash
# requires Python >= 3.9
pip install -r secret-suite/requirements.txt
python secret-suite/secret-util.py
```

---

## Tools (12 in web, 13 in CLI)

| # | Tool | Description |
|---|------|-------------|
| 1 | Secret Generators | JWT secrets, API keys, webhooks, peppers |
| 2 | AES Encryption Keys | AES-256 keys and IVs in multiple encodings |
| 3 | UUID and Random Bytes | UUID v4, random hex, Base64, URL-safe bytes |
| 4 | Hash Functions | SHA-256/512, SHA3, HMAC |
| 5 | Password Hashing | bcrypt, PBKDF2, Argon2id, hash and verify |
| 6 | SSH ed25519 Keypair | OpenSSH keypair in wire format |
| 7 | Encoders / Decoders | Base64, Base64url, Hex encode and decode |
| 8 | JWT Inspector | Decode JWT header, payload, expiry status |
| 9 | Timestamp Tools | ISO/Unix converter, live clock, expiry calc |
| 10 | URL Encoder | encodeURIComponent / decodeURIComponent |
| 11 | HKDF / scrypt / ECDH | Key derivation functions and ECDH keypairs |
| 12 | QR Code Generator | Any URL or text to QR PNG with EC level |
| 13 | Secret Store (CLI only) | AES-256-GCM encrypted local vault |

---

## Output Modes (CLI)

| Mode | Description |
|------|-------------|
| Plain | Raw value only |
| Labeled | Key: value format |
| Labeled + log | Key: value, also written to `secret-util.log` |

---

## Dependencies

### Node.js CLI
```
bcryptjs
argon2
qrcode
openpgp
```
Plus built-in Node.js `crypto` module (no install needed).

### Python 3 CLI
```
bcrypt>=4.0.0
argon2-cffi>=23.1.0
cryptography>=42.0.0
```
See `secret-suite/requirements.txt`.

---

## Security Notes

- All operations run locally, no network calls to external APIs
- Never commit generated secrets to version control
- Store keys in environment variables or a secrets manager
- The local secret store is AES-256-GCM encrypted but is not a replacement for a production KMS


