import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../../domain/ports/auth-repository.port';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  it('uses the current role in PostgreSQL rather than a stale role in the JWT', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({
      sub: 'user-id',
      email: 'user@example.test',
      role: 'ADMINISTRADOR'
    }) } as unknown as JwtService;
    const users: jest.Mocked<AuthRepository> = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn().mockResolvedValue({
        id: 'user-id',
        email: 'user@example.test',
        fullName: 'Current Agent',
        passwordHash: 'secret-hash',
        role: 'AGENTE',
        phone: null,
        isActive: true
      }),
      createClient: jest.fn()
    };
    const request = { headers: { authorization: 'Bearer signed-token' } } as {
      headers: { authorization: string };
      user?: unknown;
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request })
    } as unknown as ExecutionContext;

    await expect(new AuthGuard(jwt, users).canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({ id: 'user-id', role: 'AGENTE' });
  });

  it('rejects disabled accounts', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'disabled-user' }) } as unknown as JwtService;
    const users: jest.Mocked<AuthRepository> = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn().mockResolvedValue(null),
      createClient: jest.fn()
    };
    const request = { headers: { authorization: 'Bearer signed-token' } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
    await expect(new AuthGuard(jwt, users).canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
