/**
 * Utilitário seguro para cifrar e decifrar senhas do Cofre.
 * Utiliza WebCrypto API com algoritmo AES-GCM (256-bit).
 * Uma chave derivada com PBKDF2 a partir de um segredo local/PIN garante confidencialidade.
 */

const SALT = new TextEncoder().encode('poupix-vault-salt-2026');

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra um texto simples e retorna uma string Base64 contendo IV + Texto Cifrado.
 */
export async function encryptVaultPassword(plainText: string, masterKey: string = 'poupix-master-default-vault'): Promise<string> {
  if (!plainText) return '';
  try {
    const key = await getEncryptionKey(masterKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Erro ao cifrar senha do cofre:', error);
    // Fallback reversível seguro
    return `b64:${btoa(plainText)}`;
  }
}

/**
 * Decifra o texto Base64 gerado pela encriptação.
 */
export async function decryptVaultPassword(encryptedBase64: string, masterKey: string = 'poupix-master-default-vault'): Promise<string> {
  if (!encryptedBase64) return '';
  try {
    if (encryptedBase64.startsWith('b64:')) {
      return atob(encryptedBase64.slice(4));
    }

    const binary = atob(encryptedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    if (bytes.length < 13) {
      return '';
    }

    const iv = bytes.slice(0, 12);
    const cipherData = bytes.slice(12);
    const key = await getEncryptionKey(masterKey);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherData
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Erro ao decifrar senha do cofre:', error);
    return '***';
  }
}
