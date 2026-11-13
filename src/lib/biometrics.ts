/**
 * Utilitários para Criptografia de PIN e Biometria Nativa (WebAuthn / Passkeys)
 */

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
 * Registra uma credencial biométrica local usando WebAuthn
 */
export async function registerBiometrics(userName: string = 'Usuário Poupix'): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new Uint8Array(16);
    window.crypto.getRandomValues(userIdBytes);

    const credential = await navigator.credentials.create({
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
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      },
    });

    if (credential) {
      localStorage.setItem('poupix_biometrics_registered', 'true');
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Biometrics] Falha ao registrar biometria:', err);
    return false;
  }
}

/**
 * Solicita a autenticação biométrica do usuário (Digital / Face ID / Windows Hello)
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return Boolean(assertion);
  } catch (err) {
    console.warn('[Biometrics] Falha na autenticação biométrica:', err);
    return false;
  }
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
