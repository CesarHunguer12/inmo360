import { describe, expect, it } from 'vitest';
import { roleLabel } from './user';

describe('roleLabel', () => {
  it('maps API roles to Spanish labels', () => {
    expect(roleLabel.ADMINISTRADOR).toBe('Administrador');
    expect(roleLabel.AGENTE).toBe('Agente');
    expect(roleLabel.CLIENTE).toBe('Cliente');
  });
});
