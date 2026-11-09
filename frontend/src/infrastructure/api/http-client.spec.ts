import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './http-client';

function apiError(status: number, message?: string | string[]) {
  return Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { status, data: message ? { message } : undefined },
  });
}

describe('getErrorMessage', () => {
  it('distinguishes a network failure from an HTTP response', () => {
    const networkError = Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      code: 'ERR_NETWORK',
    });
    expect(getErrorMessage(networkError)).toContain('http://localhost:3001');
  });

  it('returns an authentication message for invalid credentials', () => {
    expect(getErrorMessage(apiError(401, 'Correo o contraseña incorrectos.'))).toBe('Correo o contraseña incorrectos.');
  });

  it('reports a duplicate email conflict from the API', () => {
    expect(getErrorMessage(apiError(409, 'Ya existe una cuenta con ese correo electrónico.')))
      .toContain('Ya existe una cuenta');
  });

  it('joins backend validation errors', () => {
    expect(getErrorMessage(apiError(400, ['Nombre inválido', 'Correo inválido'])))
      .toBe('Nombre inválido. Correo inválido');
  });

  it('identifies server-side failures', () => {
    expect(getErrorMessage(apiError(500, 'Error interno'))).toContain('error (500)');
  });
});
