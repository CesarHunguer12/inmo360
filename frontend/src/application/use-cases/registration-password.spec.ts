import { describe, expect, it } from 'vitest';
import { registrationPasswordError } from './registration-password';

describe('registrationPasswordError', () => {
  it('rejects passwords shorter than the public 12-character minimum', () => {
    expect(registrationPasswordError('short')).toContain('12 caracteres');
  });

  it('accepts a password within the backend byte-length range', () => {
    expect(registrationPasswordError('a'.repeat(12))).toBeNull();
    expect(registrationPasswordError('a'.repeat(72))).toBeNull();
  });

  it('rejects passwords longer than the backend byte-length maximum', () => {
    expect(registrationPasswordError('a'.repeat(73))).toBe('La contraseña es demasiado larga. Prueba con una más corta.');
    expect(registrationPasswordError('á'.repeat(37))).toBe('La contraseña es demasiado larga. Prueba con una más corta.');
  });
});
