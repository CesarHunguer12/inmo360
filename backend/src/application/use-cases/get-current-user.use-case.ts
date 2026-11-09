import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY, AuthRepository } from '../../domain/ports/auth-repository.port';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(@Inject(AUTH_REPOSITORY) private readonly users: AuthRepository) {}

  async execute(id: string) {
    const user = await this.users.findUserById(id);
    if (!user || !user.isActive) throw new UnauthorizedException();
    const { passwordHash: ignored, ...safeUser } = user;
    void ignored;
    return safeUser;
  }
}
