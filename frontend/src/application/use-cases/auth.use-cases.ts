import type { AuthRepository } from '../../domain/repositories/auth.repository';

export class Login {
  constructor(private readonly auth: AuthRepository) {}
  execute(email: string, password: string) {
    return this.auth.login(email.trim(), password);
  }
}

export class RegisterClient {
  constructor(private readonly auth: AuthRepository) {}
  execute(input: { email: string; fullName: string; password: string; phone?: string }) {
    return this.auth.register({
      ...input,
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName.trim(),
      ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
    });
  }
}

export class GetCurrentUser {
  constructor(private readonly auth: AuthRepository) {}
  execute() {
    return this.auth.currentUser();
  }
}
