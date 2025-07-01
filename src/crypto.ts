/**
 * Crypto utilities for secure storage of sensitive data
 * Uses Web Crypto API which is allowed in Manifest V3
 */

export class CryptoService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  /**
   * Generate a key based on extension ID and user data
   * This provides a simple key derivation method
   */
  private static async generateKey(): Promise<CryptoKey> {
    const extensionId = chrome.runtime.id;
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(extensionId + 'leetcode-secure-storage'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Use a simple salt derived from extension ID
    const salt = new TextEncoder().encode(extensionId.slice(0, 16).padEnd(16, '0'));

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a string using AES-GCM
   */
  static async encrypt(plaintext: string): Promise<string> {
    try {
      const key = await this.generateKey();
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const encodedText = new TextEncoder().encode(plaintext);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encodedText
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode.apply(null, Array.from(combined)));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string using AES-GCM
   */
  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.generateKey();
      
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const encrypted = combined.slice(this.IV_LENGTH);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if encryption is available
   */
  static isAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
  }
}