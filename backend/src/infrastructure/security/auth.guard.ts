import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticatedUser, UserRole } from '../../domain/entities/user.entity';
import { AUTH_REPOSITORY, AuthRepository } from '../../domain/ports/auth-repository.port';
import { Inject } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_REPOSITORY) private readonly users: AuthRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
    if (!payload.sub) throw new UnauthorizedException('Token inválido o expirado.');
    const user = await this.users.findUserById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException('La cuenta no está activa.');
    request.user = { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
    return true;
  }
}
