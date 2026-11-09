import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { AUTH_REPOSITORY, AuthRepository } from '../../domain/ports/auth-repository.port';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/ports/password-hasher.port';

@Injectable()
export class RegisterClientUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly users: AuthRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher
  ) {}

  async execute(input: { email: string; fullName: string; password: string; phone?: string }) {
    const email = input.email.trim().toLowerCase();
    if (await this.users.findUserByEmail(email)) {
      throw new ConflictException('Ya existe una cuenta con ese correo electrónico.');
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.users.createClient({
      email,
      fullName: input.fullName.trim(),
      passwordHash,
      phone: input.phone,
      role: 'CLIENTE'
    });
    const { passwordHash: ignored, ...safeUser } = user;
    void ignored;
    return safeUser;
  }
}
