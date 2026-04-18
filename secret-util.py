#!/usr/bin/env python3
"""
secret-util.py — Secret Suite CLI (Python 3)
DeediX Technologies — https://deedixtech.com

Usage:
    python secret-util.py          interactive TUI
    python secret-util.py --help   show all commands

Requirements:
    pip install bcrypt argon2-cffi cryptography
"""

import os
import sys
import secrets
import base64
import uuid
import hmac as hmac_mod
import hashlib
import json
import struct
from datetime import datetime, timezone

import bcrypt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from argon2.low_level import hash_secret_raw, Type as Argon2Type
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.backends import default_backend

# ── Config ────────────────────────────────────────────────────────────────────
_SCRIPT_DIR       = os.path.dirname(os.path.abspath(__file__))
LOG_FILE          = os.path.join(_SCRIPT_DIR, "secret-util.log")
SECRET_STORE_FILE = os.path.join(_SCRIPT_DIR, "secret-store.json")
LOG_META_FILE     = os.path.join(_SCRIPT_DIR, "secret-log-meta.json")
ARGON2_PH         = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2, hash_len=32)
_session_store_key = None
_session_log_key   = None

# ── ANSI colours ──────────────────────────────────────────────────────────────
NO_COLOR = not sys.stdout.isatty()

def _c(code, text):
    return text if NO_COLOR else f"\033[{code}m{text}\033[0m"

def bold(t):    return _c("1",    t)
def dim(t):     return _c("2",    t)
def cyan(t):    return _c("36",   t)
def green(t):   return _c("32",   t)
def yellow(t):  return _c("33",   t)
def red(t):     return _c("31",   t)
def white(t):   return _c("97",   t)
def gray(t):    return _c("90",   t)

# ── Banner ────────────────────────────────────────────────────────────────────
BANNER = r"""
 ██████╗ ███████╗███████╗██████╗ ██╗██╗  ██╗
 ██╔══██╗██╔════╝██╔════╝██╔══██╗██║╚██╗██╔╝
 ██║  ██║█████╗  █████╗  ██║  ██║██║ ╚███╔╝ 
 ██║  ██║██╔══╝  ██╔══╝  ██║  ██║██║ ██╔██╗ 
 ██████╔╝███████╗███████╗██████╔╝██║██╔╝ ██╗
 ╚═════╝ ╚══════╝╚══════╝╚═════╝ ╚═╝╚═╝  ╚═╝
"""

def print_banner():
    os.system("cls" if os.name == "nt" else "clear")
    print(cyan(BANNER))
    print(gray("─────────────────────────────────────────────────"))
    print(bold(white(" Secret Suite CLI  • v2.0 • DeediX Technologies ")))
    print(gray("─────────────────────────────────────────────────\n"))

# ── Output ────────────────────────────────────────────────────────────────────
def write_log(label: str, value: str):
    key = _unlock_log()
    if not key:
        print(red("  Could not unlock log — entry not saved."))
        return
    ts        = datetime.now(timezone.utc).isoformat()
    plaintext = f"[{ts}] {label}: {value}".encode()
    nonce     = os.urandom(12)
    ct        = AESGCM(key).encrypt(nonce, plaintext, None)
    entry = json.dumps({"n": base64.b64encode(nonce).decode(), "c": base64.b64encode(ct).decode()})
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry + "\n")

def output_result(label: str, value: str):
    print(dim("\n  Output mode:"))
    print(f"  {cyan('1')}  Plain value")
    print(f"  {cyan('2')}  Labeled")
    print(f"  {cyan('3')}  Labeled + log to file")
    mode = input(cyan("\n  Mode [1/2/3]: ")).strip() or "1"
    if mode not in {"1", "2", "3"}:
        mode = "1"
    print()
    if mode == "1":
        print(green(value))
    elif mode == "2":
        print(yellow(f"  ┌── {label}"))
        for line in value.split("\n"):
            print(green(f"  {line}"))
        print(yellow("  └─────────────────────────"))
    else:
        print(yellow(f"  ┌── {label}  {dim('[logged]')}"))
        for line in value.split("\n"):
            print(green(f"  {line}"))
        print(yellow("  └─────────────────────────"))
        write_log(label, value)
        print(dim(f"  Logged → {LOG_FILE}"))
    input(dim("\n  Press Enter to continue…"))

# ── Menu helpers ──────────────────────────────────────────────────────────────
def menu_item(num, label, desc=""):
    return f"  {cyan(str(num).rjust(2))}  {white(label.ljust(28))} {dim(desc)}"

def print_menu(title, items):
    print(f"\n  {yellow('┌─')} {bold(title)}")
    for num, label, desc in items:
        print(menu_item(num, label, desc))
    print(f"   {cyan('0')}  {dim('Back / Exit')}\n")

def print_main_menu():
    print_banner()
    print(f"  {yellow('┌─')} {bold('MAIN MENU')}")
    entries = [
        (1,  "Secret Generators",    "JWT, API key, webhook, pepper…"),
        (2,  "Password Hashing",     "bcrypt, PBKDF2, Argon2id"),
        (3,  "Encryption Keys",      "AES-256 keys & IVs"),
        (4,  "Hash Functions",       "SHA-256/512, SHA3, HMAC"),
        (5,  "UUID & Random",        "UUID v4, random bytes"),
        (6,  "Node.js Compat",       "randomBytes patterns"),
        (7,  "Advanced Crypto",      "AES-GCM, RSA, Ed25519, ECDH, TOTP"),
        (8,  "Encoders / Decoders",  "Base64, Hex, URL encode/decode"),
        (9,  "JWT Inspector",        "Decode & verify JWT tokens"),
        (10, "Timestamp Tools",      "Unix/ISO conversion & expiry"),
        (11, "Key Derivation",       "HKDF, scrypt, ECDH keypair"),
        (12, "Secret Store",         "Encrypted local secret store"),
        (13, "Utilities",            "Constant-time compare, checksum"),
    ]
    for num, label, desc in entries:
        print(menu_item(num, label, desc))
    print(f"   {cyan('0')}  {dim('Exit')}\n")

# ── Secret Generators ─────────────────────────────────────────────────────────
def generate_jwt_secret():       return secrets.token_urlsafe(64)
def generate_api_key():          return secrets.token_urlsafe(48)
def generate_webhook_secret():   return secrets.token_hex(32)
def generate_password_pepper():  return secrets.token_urlsafe(32)

def generate_custom_secret():
    n = input("  Bytes (default 32): ").strip()
    return secrets.token_urlsafe(int(n) if n.isdigit() else 32)

def generate_random_password():
    n = input("  Length (default 20): ").strip()
    n = int(n) if n.isdigit() else 20
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.<>/?"
    return "".join(secrets.choice(alphabet) for _ in range(n))

# ── Encryption Keys ───────────────────────────────────────────────────────────
def generate_enc_key_b64():    return base64.urlsafe_b64encode(os.urandom(32)).decode()
def generate_aes_key_hex():    return os.urandom(32).hex()
def generate_aes_key_urlsafe():return base64.urlsafe_b64encode(os.urandom(32)).decode()
def generate_iv_16():          return os.urandom(16).hex()
def generate_iv_12():          return os.urandom(12).hex()

# ── Password Hashing ──────────────────────────────────────────────────────────
def bcrypt_hash_password():
    pwd    = input("  Password: ").encode()
    rounds = input("  Rounds (default 12): ").strip()
    rounds = int(rounds) if rounds.isdigit() else 12
    hashed = bcrypt.hashpw(pwd, bcrypt.gensalt(rounds=rounds)).decode()
    return f"hash={hashed}\nrounds={rounds}"

def bcrypt_verify_password():
    hsh = input("  bcrypt hash: ").strip().encode()
    pwd = input("  Password: ").encode()
    ok  = bcrypt.checkpw(pwd, hsh)
    return "✔  VALID — password matches" if ok else "✘  INVALID — password does NOT match"

def pbkdf2_hash_password():
    pwd  = input("  Password: ").encode()
    salt = secrets.token_bytes(16)
    it   = input("  Iterations (default 310000): ").strip()
    it   = int(it) if it.isdigit() else 310000
    dk   = hashlib.pbkdf2_hmac("sha256", pwd, salt, it)
    return f"salt={salt.hex()}\niterations={it}\nhash={dk.hex()}"

def argon2_hash_password():
    pwd = input("  Password: ")
    return ARGON2_PH.hash(pwd)

def argon2_verify_password():
    hsh = input("  Argon2id hash: ").strip()
    pwd = input("  Password: ")
    try:
        ARGON2_PH.verify(hsh, pwd)
        return "✔  VALID — password matches"
    except VerifyMismatchError:
        return "✘  INVALID — password does NOT match"
    except Exception:
        return "✘  INVALID — bad hash format"

# ── Hash Functions ────────────────────────────────────────────────────────────
def _hash(algo):
    data = input("  Input: ").encode()
    return hashlib.new(algo, data).hexdigest()

def _hmac(algo):
    key  = input("  HMAC key: ").encode()
    data = input("  Data: ").encode()
    return hmac_mod.new(key, data, algo).hexdigest()

def sha256_hash():    return _hash("sha256")
def sha512_hash():    return _hash("sha512")
def sha3_256_hash():  return _hash("sha3_256")
def sha3_512_hash():  return _hash("sha3_512")
def hmac_sha256():    return _hmac(hashlib.sha256)
def hmac_sha512():    return _hmac(hashlib.sha512)

# ── UUID & Random ─────────────────────────────────────────────────────────────
def generate_uuid_v4():        return str(uuid.uuid4())
def random_bytes_hex():
    n = input("  Bytes (default 16): ").strip()
    return secrets.token_bytes(int(n) if n.isdigit() else 16).hex()
def random_bytes_base64():
    n = input("  Bytes (default 16): ").strip()
    return base64.b64encode(secrets.token_bytes(int(n) if n.isdigit() else 16)).decode()
def random_bytes_urlsafe():
    n = input("  Bytes (default 16): ").strip()
    return base64.urlsafe_b64encode(secrets.token_bytes(int(n) if n.isdigit() else 16)).decode()

# ── Node compat ───────────────────────────────────────────────────────────────
def node_hex_slice32():   return secrets.token_bytes(32).hex()[:32]
def node_bytes16_hex():   return secrets.token_bytes(16).hex()
def node_bytes32_b64():   return base64.b64encode(secrets.token_bytes(32)).decode()
def node_random_uuid():   return str(uuid.uuid4())

# ── Encoders / Decoders ───────────────────────────────────────────────────────
def b64_encode():
    return base64.b64encode(input("  Input (UTF-8): ").encode()).decode()

def b64_decode():
    try:    return base64.b64decode(input("  Base64 input: ").strip()).decode("utf-8")
    except: return "[error] Invalid Base64"

def b64url_encode():
    return base64.urlsafe_b64encode(input("  Input (UTF-8): ").encode()).decode()

def hex_encode():
    return input("  Input (UTF-8): ").encode().hex()

def hex_decode():
    try:    return bytes.fromhex(input("  Hex input: ").strip()).decode("utf-8")
    except: return "[error] Invalid hex"

def url_encode():
    from urllib.parse import quote
    return quote(input("  Input: "), safe="")

def url_decode():
    from urllib.parse import unquote
    try:    return unquote(input("  URL-encoded input: ").strip())
    except: return "[error] Invalid URL encoding"

# ── JWT Inspector ─────────────────────────────────────────────────────────────
def jwt_inspect():
    token = input("  JWT token: ").strip()
    parts = token.split(".")
    if len(parts) != 3:
        return "[error] Not a valid JWT (expected 3 parts)"

    def decode_part(s):
        padding = "=" * (-len(s) % 4)
        try:    return json.loads(base64.urlsafe_b64decode(s + padding))
        except: return "[invalid]"

    header  = decode_part(parts[0])
    payload = decode_part(parts[1])
    now     = int(datetime.now(timezone.utc).timestamp())
    exp     = payload.get("exp") if isinstance(payload, dict) else None
    if exp:
        exp_dt = datetime.fromtimestamp(exp, tz=timezone.utc).isoformat()
        status = f"✔ VALID — expires {exp_dt}" if exp > now else f"✘ EXPIRED — {exp_dt}"
    else:
        status = "no exp claim"

    return (
        f"HEADER:\n{json.dumps(header, indent=2)}\n\n"
        f"PAYLOAD:\n{json.dumps(payload, indent=2)}\n\n"
        f"SIGNATURE: {parts[2]}\n\nEXPIRY: {status}"
    )

# ── Timestamps ────────────────────────────────────────────────────────────────
def timestamp_tools():
    print(dim("\n  1  Current timestamps"))
    print(dim("  2  Unix → ISO"))
    print(dim("  3  ISO → Unix"))
    print(dim("  4  Expiry calculator"))
    choice = input(cyan("\n  Choose: ")).strip()
    now = datetime.now(timezone.utc)
    if choice == "1":
        ts = int(now.timestamp())
        return f"ISO:     {now.isoformat()}\nUnix:    {ts}\nUnix ms: {int(now.timestamp()*1000)}"
    if choice == "2":
        u = int(input("  Unix timestamp (s): ").strip())
        return datetime.fromtimestamp(u, tz=timezone.utc).isoformat()
    if choice == "3":
        iso = input("  ISO string: ").strip()
        return str(int(datetime.fromisoformat(iso).timestamp()))
    if choice == "4":
        s = int(input("  Seconds from now: ").strip())
        future = datetime.fromtimestamp(int(now.timestamp()) + s, tz=timezone.utc)
        return f"Unix: {int(future.timestamp())}\nISO:  {future.isoformat()}"
    return "Invalid choice"

# ── AES-GCM ───────────────────────────────────────────────────────────────────
def aes_gcm_encrypt():
    key       = os.urandom(32)
    nonce     = os.urandom(12)
    plaintext = input("  Plaintext: ").encode()
    aad_input = input("  AAD (optional, Enter to skip): ")
    aad       = aad_input.encode() if aad_input else None
    ct        = AESGCM(key).encrypt(nonce, plaintext, aad)
    return json.dumps({
        "key":        base64.b64encode(key).decode(),
        "nonce":      base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ct).decode(),
        "aad":        base64.b64encode(aad).decode() if aad else None,
    }, indent=2)

def aes_gcm_decrypt():
    blob  = input("  Paste AES-GCM JSON: ").strip()
    d     = json.loads(blob)
    key   = base64.b64decode(d["key"])
    nonce = base64.b64decode(d["nonce"])
    ct    = base64.b64decode(d["ciphertext"])
    aad   = base64.b64decode(d["aad"]) if d.get("aad") else None
    return AESGCM(key).decrypt(nonce, ct, aad).decode()

# ── RSA / Ed25519 / ECDH ──────────────────────────────────────────────────────
def generate_rsa_keypair():
    key = rsa.generate_private_key(public_exponent=65537, key_size=4096, backend=default_backend())
    priv = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode()
    pub  = key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
    return f"PRIVATE KEY:\n{priv}\nPUBLIC KEY:\n{pub}"

def generate_ed25519_keypair():
    key  = ed25519.Ed25519PrivateKey.generate()
    priv = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode()
    pub  = key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
    return f"PRIVATE KEY:\n{priv}\nPUBLIC KEY:\n{pub}"

def generate_ecdh_keypair():
    curves = {"1": ec.SECP256R1(), "2": ec.SECP384R1(), "3": ec.SECP521R1()}
    names  = {"1": "P-256", "2": "P-384", "3": "P-521"}
    print(dim("  Curves: ") + "  ".join(f"{cyan(k)} {v}" for k, v in names.items()))
    choice = input(cyan("  Choose [1-3]: ")).strip() or "1"
    curve  = curves.get(choice, ec.SECP256R1())
    name   = names.get(choice, "P-256")
    key    = ec.generate_private_key(curve, default_backend())
    priv   = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode()
    pub    = key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
    return f"CURVE: {name}\n\nPRIVATE KEY (PEM):\n{priv}\nPUBLIC KEY (PEM):\n{pub}"

# ── HKDF ─────────────────────────────────────────────────────────────────────
def hkdf_derive():
    ikm_hex  = input("  IKM (hex, blank = random 32 bytes): ").strip()
    salt_hex = input("  Salt (hex, blank = none): ").strip()
    info_str = input("  Info string (optional): ").strip()
    len_str  = input("  Output bytes (default 32): ").strip()
    length   = int(len_str) if len_str.isdigit() else 32

    ikm  = bytes.fromhex(ikm_hex)  if ikm_hex  else os.urandom(32)
    salt = bytes.fromhex(salt_hex) if salt_hex else None

    derived = HKDF(
        algorithm=hashes.SHA256(), length=length,
        salt=salt, info=info_str.encode() or b"",
        backend=default_backend()
    ).derive(ikm)

    return (
        f"IKM:     {ikm.hex()}\n"
        f"Salt:    {salt.hex() if salt else '(none)'}\n"
        f"Info:    \"{info_str}\"\n"
        f"Derived: {derived.hex()}"
    )

# ── scrypt ────────────────────────────────────────────────────────────────────
def scrypt_derive():
    pwd      = input("  Password: ").encode()
    salt_hex = input("  Salt (hex, blank = random): ").strip()
    salt     = bytes.fromhex(salt_hex) if salt_hex else os.urandom(16)
    derived  = Scrypt(salt=salt, length=32, n=16384, r=8, p=1, backend=default_backend()).derive(pwd)
    return f"Salt:    {salt.hex()}\nDerived: {derived.hex()}\nParams:  N=16384 r=8 p=1"

# ── Secret Store ──────────────────────────────────────────────────────────────
def load_store():
    if not os.path.exists(SECRET_STORE_FILE):
        return {}
    with open(SECRET_STORE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_store(store):
    with open(SECRET_STORE_FILE, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2)

# ── Key derivation & session unlocks ─────────────────────────────────────────
_STORE_SENTINEL = b"DEEDIX_STORE_V1"
_LOG_SENTINEL   = b"DEEDIX_LOG_V1"

def _derive_key(password: str, salt: bytes) -> bytes:
    return hash_secret_raw(
        secret=password.encode(),
        salt=salt,
        time_cost=3,
        memory_cost=65536,
        parallelism=2,
        hash_len=32,
        type=Argon2Type.ID,
    )

def _unlock_store() -> bytes:
    global _session_store_key
    if _session_store_key:
        return _session_store_key
    store = load_store()
    meta  = store.get("__meta__")
    if not meta:
        print(dim("\n  First-time Secret Store setup. Choose a master password."))
        print(dim("  This password encrypts ALL secrets — do not lose it.\n"))
        pwd = input(cyan("  Set master password: "))
        if not pwd:
            print(red("  Password cannot be empty."))
            return None
        confirm = input(cyan("  Confirm password: "))
        if pwd != confirm:
            print(red("  Passwords don't match."))
            return None
        salt  = os.urandom(16)
        key   = _derive_key(pwd, salt)
        nonce = os.urandom(12)
        ct    = AESGCM(key).encrypt(nonce, _STORE_SENTINEL, None)
        store["__meta__"] = {
            "salt":   base64.b64encode(salt).decode(),
            "nonce":  base64.b64encode(nonce).decode(),
            "verify": base64.b64encode(ct).decode(),
        }
        save_store(store)
        _session_store_key = key
        print(green("  Store created and locked with master password.\n"))
        return key
    else:
        salt  = base64.b64decode(meta["salt"])
        nonce = base64.b64decode(meta["nonce"])
        ct    = base64.b64decode(meta["verify"])
        pwd   = input(cyan("  Store master password: "))
        key   = _derive_key(pwd, salt)
        try:
            AESGCM(key).decrypt(nonce, ct, None)
        except Exception:
            print(red("  Wrong password."))
            return None
        _session_store_key = key
        return key

def _unlock_log() -> bytes:
    global _session_log_key
    if _session_log_key:
        return _session_log_key
    if os.path.exists(LOG_META_FILE):
        with open(LOG_META_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
        salt  = base64.b64decode(meta["salt"])
        nonce = base64.b64decode(meta["nonce"])
        ct    = base64.b64decode(meta["verify"])
        pwd   = input(cyan("  Log password: "))
        key   = _derive_key(pwd, salt)
        try:
            AESGCM(key).decrypt(nonce, ct, None)
        except Exception:
            print(red("  Wrong log password."))
            return None
        _session_log_key = key
        return key
    else:
        print(dim("\n  First-time log setup. Set a log password."))
        print(dim("  Entries are AES-GCM encrypted — unreadable without this password.\n"))
        pwd = input(cyan("  New log password: "))
        if not pwd:
            print(red("  Password cannot be empty."))
            return None
        confirm = input(cyan("  Confirm password: "))
        if pwd != confirm:
            print(red("  Passwords don't match."))
            return None
        salt  = os.urandom(16)
        key   = _derive_key(pwd, salt)
        nonce = os.urandom(12)
        ct    = AESGCM(key).encrypt(nonce, _LOG_SENTINEL, None)
        meta  = {
            "salt":   base64.b64encode(salt).decode(),
            "nonce":  base64.b64encode(nonce).decode(),
            "verify": base64.b64encode(ct).decode(),
        }
        with open(LOG_META_FILE, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
        _session_log_key = key
        print(green("  Log locked with password.\n"))
        return key

def store_secret_encrypted():
    master = _unlock_store()
    if not master:
        return "Aborted — store locked."
    name  = input("  Secret name: ").strip()
    if not name:
        return "Name cannot be empty."
    value = input("  Value: ").encode()
    nonce = os.urandom(12)
    ct    = AESGCM(master).encrypt(nonce, value, None)
    store = load_store()
    store[name] = {
        "nonce":      base64.b64encode(nonce).decode(),
        "ciphertext": base64.b64encode(ct).decode(),
    }
    save_store(store)
    count = len([k for k in store if k != "__meta__"])
    return f"Stored '{name}' — {count} secret(s) in store."

def retrieve_secret_encrypted():
    master = _unlock_store()
    if not master:
        return "Aborted — store locked."
    store = load_store()
    entries = [k for k in store if k != "__meta__"]
    if not entries:
        return "Store is empty."
    print(dim(f"\n  Stored keys: {', '.join(entries)}"))
    name = input("  Secret name: ").strip()
    if name not in store:
        return f"'{name}' not found."
    e     = store[name]
    nonce = base64.b64decode(e["nonce"])
    ct    = base64.b64decode(e["ciphertext"])
    try:
        return AESGCM(master).decrypt(nonce, ct, None).decode()
    except Exception:
        return "[error] Decryption failed — wrong password or corrupted entry"

# ── Constant-time compare ─────────────────────────────────────────────────────
def constant_time_compare():
    a = input("  String A: ").encode()
    b = input("  String B: ").encode()
    if len(a) != len(b):
        return "✘  Different lengths — trivially not equal"
    ok = hmac_mod.compare_digest(a, b)
    return "✔  EQUAL (timing-safe)" if ok else "✘  NOT EQUAL (timing-safe)"

# ── Checksum ──────────────────────────────────────────────────────────────────
def checksum_file():
    path = input("  File path: ").strip()
    if not os.path.exists(path):
        return f"[error] File not found: {path}"
    data = open(path, "rb").read()
    return "\n".join([
        f"File:    {path}",
        f"MD5:     {hashlib.md5(data).hexdigest()}",
        f"SHA-1:   {hashlib.sha1(data).hexdigest()}",
        f"SHA-256: {hashlib.sha256(data).hexdigest()}",
        f"SHA-512: {hashlib.sha512(data).hexdigest()}",
    ])

# ── Sub-menu handlers ─────────────────────────────────────────────────────────
def handle_secret_generators():
    while True:
        print_menu("SECRET GENERATORS", [
            (1, "JWT Secret",       "HS256/HS512 ready"),
            (2, "API Key",          "48-byte urlsafe"),
            (3, "Webhook Secret",   "hex"),
            (4, "Password Pepper",  "urlsafe"),
            (5, "Custom Secret",    "choose byte length"),
            (6, "Random Password",  "printable chars"),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("JWT Secret",       generate_jwt_secret())
        elif c == "2": output_result("API Key",          generate_api_key())
        elif c == "3": output_result("Webhook Secret",   generate_webhook_secret())
        elif c == "4": output_result("Password Pepper",  generate_password_pepper())
        elif c == "5": output_result("Custom Secret",    generate_custom_secret())
        elif c == "6": output_result("Random Password",  generate_random_password())
        elif c == "0": break

def handle_password_hashing():
    while True:
        print_menu("PASSWORD HASHING", [
            (1, "bcrypt Hash",       "configurable rounds"),
            (2, "bcrypt Verify",     ""),
            (3, "PBKDF2 Hash",       "SHA-256, 310k iterations"),
            (4, "Argon2id Hash",     "memory-hard, recommended"),
            (5, "Argon2id Verify",   ""),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("bcrypt Hash",     bcrypt_hash_password())
        elif c == "2": output_result("bcrypt Verify",   bcrypt_verify_password())
        elif c == "3": output_result("PBKDF2 Hash",     pbkdf2_hash_password())
        elif c == "4": output_result("Argon2id Hash",   argon2_hash_password())
        elif c == "5": output_result("Argon2id Verify", argon2_verify_password())
        elif c == "0": break

def handle_encryption_keys():
    while True:
        print_menu("ENCRYPTION KEYS", [
            (1, "AES-256 Key (base64url)", "32 bytes"),
            (2, "AES-256 Key (hex)",       "64 hex chars"),
            (3, "AES-256 Key (urlsafe)",   "base64url"),
            (4, "IV 16-byte (hex)",        "for CBC"),
            (5, "IV 12-byte (hex)",        "for GCM"),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("AES-256 Key (b64url)",  generate_enc_key_b64())
        elif c == "2": output_result("AES-256 Key (hex)",     generate_aes_key_hex())
        elif c == "3": output_result("AES-256 Key (urlsafe)", generate_aes_key_urlsafe())
        elif c == "4": output_result("IV 16-byte",            generate_iv_16())
        elif c == "5": output_result("IV 12-byte",            generate_iv_12())
        elif c == "0": break

def handle_hash_functions():
    while True:
        print_menu("HASH FUNCTIONS", [
            (1,"SHA-256",""), (2,"SHA-512",""),
            (3,"SHA3-256",""), (4,"SHA3-512",""),
            (5,"HMAC-SHA256",""), (6,"HMAC-SHA512",""),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("SHA-256",    sha256_hash())
        elif c == "2": output_result("SHA-512",    sha512_hash())
        elif c == "3": output_result("SHA3-256",   sha3_256_hash())
        elif c == "4": output_result("SHA3-512",   sha3_512_hash())
        elif c == "5": output_result("HMAC-SHA256",hmac_sha256())
        elif c == "6": output_result("HMAC-SHA512",hmac_sha512())
        elif c == "0": break

def handle_uuid_random():
    while True:
        print_menu("UUID & RANDOM", [
            (1,"UUID v4",""),            (2,"Random Bytes (hex)",""),
            (3,"Random Bytes (b64)",""), (4,"Random Bytes (urlsafe)",""),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("UUID v4",               generate_uuid_v4())
        elif c == "2": output_result("Random Bytes (hex)",    random_bytes_hex())
        elif c == "3": output_result("Random Bytes (b64)",    random_bytes_base64())
        elif c == "4": output_result("Random Bytes (urlsafe)",random_bytes_urlsafe())
        elif c == "0": break

def handle_node_compat():
    while True:
        print_menu("NODE.JS COMPAT", [
            (1,"randomBytes(32).hex()[:32]",""),
            (2,"randomBytes(16).hex()",     ""),
            (3,"randomBytes(32).b64()",     ""),
            (4,"randomUUID()",              ""),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("hex[:32]",      node_hex_slice32())
        elif c == "2": output_result("16-byte hex",   node_bytes16_hex())
        elif c == "3": output_result("32-byte b64",   node_bytes32_b64())
        elif c == "4": output_result("randomUUID",    node_random_uuid())
        elif c == "0": break

def handle_advanced_crypto():
    while True:
        print_menu("ADVANCED CRYPTO", [
            (1,"AES-GCM Encrypt",""), (2,"AES-GCM Decrypt",""),
            (3,"RSA-4096 Keypair",""), (4,"Ed25519 Keypair",""),
            (5,"ECDH Keypair",   ""),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("AES-GCM Ciphertext",  aes_gcm_encrypt())
        elif c == "2": output_result("AES-GCM Plaintext",   aes_gcm_decrypt())
        elif c == "3": output_result("RSA-4096 Keypair",    generate_rsa_keypair())
        elif c == "4": output_result("Ed25519 Keypair",     generate_ed25519_keypair())
        elif c == "5": output_result("ECDH Keypair",        generate_ecdh_keypair())
        elif c == "0": break

def handle_encoders():
    while True:
        print_menu("ENCODERS / DECODERS", [
            (1,"Base64 Encode",""), (2,"Base64 Decode",""),
            (3,"Base64url Encode",""), (4,"Hex Encode",""),
            (5,"Hex Decode",""), (6,"URL Encode",""),
            (7,"URL Decode",""),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("Base64",       b64_encode())
        elif c == "2": output_result("Decoded",      b64_decode())
        elif c == "3": output_result("Base64url",    b64url_encode())
        elif c == "4": output_result("Hex",          hex_encode())
        elif c == "5": output_result("Hex Decoded",  hex_decode())
        elif c == "6": output_result("URL Encoded",  url_encode())
        elif c == "7": output_result("URL Decoded",  url_decode())
        elif c == "0": break

def handle_key_derivation():
    while True:
        print_menu("KEY DERIVATION", [
            (1,"HKDF (RFC 5869)","SHA-256"),
            (2,"scrypt (RFC 7914)","N=16384 r=8 p=1"),
            (3,"ECDH Keypair","P-256 / P-384 / P-521"),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("HKDF Derived Key",   hkdf_derive())
        elif c == "2": output_result("scrypt Derived Key",  scrypt_derive())
        elif c == "3": output_result("ECDH Keypair",        generate_ecdh_keypair())
        elif c == "0": break

def handle_secret_store():
    while True:
        print_menu("SECRET STORE", [
            (1,"Store Secret","AES-GCM encrypted"),
            (2,"Retrieve Secret",""),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("Stored",    store_secret_encrypted())
        elif c == "2": output_result("Retrieved", retrieve_secret_encrypted())
        elif c == "0": break

def view_log():
    key = _unlock_log()
    if not key:
        return "Aborted — log locked."
    if not os.path.exists(LOG_FILE):
        return "Log file is empty."
    entries = []
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj   = json.loads(line)
                nonce = base64.b64decode(obj["n"])
                ct    = base64.b64decode(obj["c"])
                text  = AESGCM(key).decrypt(nonce, ct, None).decode()
                entries.append(f"  {dim(str(i).rjust(3))}  {text}")
            except Exception:
                entries.append(f"  {dim(str(i).rjust(3))}  {yellow('[unreadable — wrong password or pre-encryption entry]')}")
    return "\n".join(entries) if entries else "Log is empty."

def handle_utilities():
    while True:
        print_menu("UTILITIES", [
            (1,"Constant-Time Compare","timing-safe equality"),
            (2,"File Checksum","MD5 / SHA-1 / SHA-256 / SHA-512"),
            (3,"View Log","decrypt & display log entries"),
        ])
        c = input(cyan("  Select: ")).strip()
        if   c == "1": output_result("Compare Result", constant_time_compare())
        elif c == "2": output_result("Checksums",      checksum_file())
        elif c == "3": output_result("Log Entries",    view_log())
        elif c == "0": break

# ── Main ──────────────────────────────────────────────────────────────────────
DISPATCH = {
    "1":  handle_secret_generators,
    "2":  handle_password_hashing,
    "3":  handle_encryption_keys,
    "4":  handle_hash_functions,
    "5":  handle_uuid_random,
    "6":  handle_node_compat,
    "7":  handle_advanced_crypto,
    "8":  handle_encoders,
    "9":  lambda: output_result("JWT Inspection", jwt_inspect()),
    "10": lambda: output_result("Timestamps",     timestamp_tools()),
    "11": handle_key_derivation,
    "12": handle_secret_store,
    "13": handle_utilities,
}

def main():
    while True:
        print_main_menu()
        choice = input(cyan("  Select: ")).strip()
        if choice == "0":
            print(cyan("\n  Thank you for using Secret Suite CLI • DeediX Technologies\n"))
            break
        handler = DISPATCH.get(choice)
        if handler:
            try:
                handler()
            except KeyboardInterrupt:
                print()
        else:
            print(red("  Invalid option."))

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(cyan("\n\n  Goodbye • Thank you for using Secret Suite CLI • DeediX Technologies\n"))
