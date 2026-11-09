import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenIssuer } from '../../domain/ports/token-issuer.port';

@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  issue(user: { id: string; email: string; role: 'ADMINISTRADOR' | 'AGENTE' | 'CLIENTE' }) {
    return this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
  }
}
