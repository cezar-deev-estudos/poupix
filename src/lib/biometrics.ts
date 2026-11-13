/**
 * Utilitários para Criptografia de PIN e Biometria Nativa (WebAuthn / Passkeys)
 */

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Gera um Hash SHA-256 seguro a partir de um PIN numérico
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`poupix_salt_${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se o dispositivo suporta autenticação biométrica (Face ID, Touch ID, Windows Hello, etc.)
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return Boolean(isAvailable);
  } catch (err) {
    console.warn('[Biometrics] Erro ao checar disponibilidade:', err);
    return false;
  }
}

/**
 * Checa se uma chave biométrica já foi registrada neste dispositivo
 */
export function hasBiometricsRegisteredLocally(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('poupix_biometrics_raw_id'));
}

/**
 * Registra uma credencial biométrica local usando WebAuthn
 */
export async function registerBiometrics(userName: string = 'Usuário Poupix'): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new Uint8Array(16);
    window.crypto.getRandomValues(userIdBytes);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Poupix PRO',
          id: window.location.hostname,
        },
        user: {
          id: userIdBytes,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const rawIdBase64 = bufferToBase64(credential.rawId);
      localStorage.setItem('poupix_biometrics_raw_id', rawIdBase64);
      localStorage.setItem('poupix_biometrics_registered', 'true');
      return true;
    }
    return false;
  } catch (err: any) {
    console.warn('[Biometrics] Falha ao registrar biometria:', err?.name, err?.message);
    return false;
  }
}

/**
 * Solicita a autenticação biométrica do usuário (Digital / Face ID / Windows Hello)
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;

  const rawIdBase64 = localStorage.getItem('poupix_biometrics_raw_id');
  // Se não há credencial gravada neste navegador, não dispara o prompt que exibe "Nenhuma chave disponível"
  if (!rawIdBase64) {
    return false;
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [
      {
        id: base64ToBuffer(rawIdBase64),
        type: 'public-key',
        transports: ['internal'],
      },
    ];

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials,
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return Boolean(assertion);
  } catch (err: any) {
    // Se o usuário cancelou o prompt ou fechou, falha silenciosamente para permitir PIN
    if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
      return false;
    }
    console.warn('[Biometrics] Falha na autenticação biométrica:', err?.name, err?.message);
    return false;
  }
}

/**
 * Remove credenciais biométricas salvas localmente
 */
export function clearLocalBiometrics() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('poupix_biometrics_raw_id');
  localStorage.removeItem('poupix_biometrics_registered');
}

/**
 * Aciona vibração tátil nativa no celular para feedback de erro ou sucesso
 */
export function triggerHaptic(type: 'success' | 'error' | 'light' = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    if (type === 'error') {
      navigator.vibrate([40, 60, 40]);
    } else if (type === 'success') {
      navigator.vibrate(30);
    } else {
      navigator.vibrate(15);
    }
  } catch {}
}
