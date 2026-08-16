import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from config import settings

def get_aes_key(secret_str: str) -> bytes:
    # Hash the secret string to get a consistent 32-byte key (256-bit)
    return hashlib.sha256(secret_str.encode("utf-8")).digest()

def encrypt_api_key(plaintext: str) -> str:
    if not plaintext:
        return ""
    key = get_aes_key(settings.encryption_key)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # GCM standard nonce is 12 bytes
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    # Combine nonce + ciphertext and encode in base64
    combined = nonce + ct
    return base64.b64encode(combined).decode("utf-8")

def decrypt_api_key(ciphertext_b64: str) -> str:
    if not ciphertext_b64:
        return ""
    key = get_aes_key(settings.encryption_key)
    aesgcm = AESGCM(key)
    try:
        combined = base64.b64decode(ciphertext_b64.encode("utf-8"))
        if len(combined) < 12:
            return ""
        nonce = combined[:12]
        ct = combined[12:]
        pt_bytes = aesgcm.decrypt(nonce, ct, None)
        return pt_bytes.decode("utf-8")
    except Exception as e:
        print(f"Decryption failed: {e}")
        return ""
