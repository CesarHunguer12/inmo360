import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { AUTH_REPOSITORY, AuthRepository } from '../../domain/ports/auth-repository.port';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/ports/password-hasher.port';
import { TOKEN_ISSUER, TokenIssuer } from '../../domain/ports/token-issuer.port';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly users: AuthRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(TOKEN_ISSUER) private readonly tokens: TokenIssuer
  ) {}

  async execute(emailInput: string, password: string) {
    const user = await this.users.findUserByEmail(emailInput.trim().toLowerCase());
    if (!user || !user.isActive || !(await this.passwords.verify(password, user.passwordHash))) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos.');
    }

    const accessToken = await this.tokens.issue(user);
    return {
      accessToken,
      tokenType: 'Bearer',
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
    };
  }
}
