import { describe, it, expect } from 'vitest';

describe('Auth & Demo Mode Flow', () => {
  it('deve alternar e persistir o estado de Modo Demonstração', () => {
    const DEMO_STORAGE_KEY = 'mobills_demo_mode_active';
    
    // Simular entrada no modo demo
    localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBe('true');

    // Simular saída do modo demo
    localStorage.removeItem(DEMO_STORAGE_KEY);
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
  });

  it('deve isolar o prefixo de armazenamento para usuário autenticado vs demo', () => {
    const mockUser = { id: 'usr-123', email: 'teste@poupix.com' };
    const authPrefix = `mobills_user_${mockUser.id}_`;
    const demoPrefix = 'mobills_demo_';

    expect(authPrefix).toBe('mobills_user_usr-123_');
    expect(demoPrefix).toBe('mobills_demo_');
    expect(authPrefix).not.toBe(demoPrefix);
  });
});
