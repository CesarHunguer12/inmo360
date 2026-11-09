import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from './authenticated-request';
import { RolesGuard } from './roles.guard';

function contextFor(request: Partial<AuthenticatedRequest>) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request })
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('rejects a user whose database role does not meet the route requirement', () => {
    const reflector = { getAllAndOverride: () => ['ADMINISTRADOR'] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = contextFor({ user: { id: 'agent', email: 'agent@example.test', fullName: 'Agent', role: 'AGENTE' } });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows an administrator for an administrator-only route', () => {
    const reflector = { getAllAndOverride: () => ['ADMINISTRADOR'] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const context = contextFor({ user: { id: 'admin', email: 'admin@example.test', fullName: 'Admin', role: 'ADMINISTRADOR' } });
    expect(guard.canActivate(context)).toBe(true);
  });
});
