/**
 * Client-Side AES-256-GCM Zero-Trust Encryption Utilities
 * Uses the Web Crypto API (window.crypto.subtle)
 */

export class CryptoUtils {
  /**
   * Generate an ephemeral 256-bit AES-GCM symmetric key
   */
  public static async generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive a 256-bit AES-GCM key from a meeting passphrase using PBKDF2
   */
  public static async deriveKeyFromPassphrase(passphrase: string, salt: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Export CryptoKey as Base64 string (useful for URL hash fragment #key=... which is never sent to servers)
   */
  public static async exportKey(key: CryptoKey): Promise<string> {
    const raw = await window.crypto.subtle.exportKey('raw', key);
    const bytes = new Uint8Array(raw);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Import Base64 string back into a CryptoKey
   */
  public static async importKey(base64Key: string): Promise<CryptoKey> {
    const binary = atob(base64Key);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return window.crypto.subtle.importKey(
      'raw',
      bytes,
      {
        name: 'AES-GCM',
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt an ArrayBuffer with AES-256-GCM.
   * Generates a unique 12-byte IV for every encryption call.
   */
  public static async encryptBuffer(
    key: CryptoKey,
    data: ArrayBuffer
  ): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    return { iv, ciphertext };
  }

  /**
   * Decrypt an ArrayBuffer with AES-256-GCM.
   * Verifies the 16-byte GCM authentication tag. If modified, throws error.
   */
  public static async decryptBuffer(
    key: CryptoKey,
    iv: Uint8Array,
    ciphertext: ArrayBuffer
  ): Promise<ArrayBuffer> {
    return window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      ciphertext
    );
  }
}
