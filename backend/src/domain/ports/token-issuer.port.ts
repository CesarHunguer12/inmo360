import { UserRole } from '../entities/user.entity';

export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

export interface TokenIssuer {
  issue(user: { id: string; email: string; role: UserRole }): Promise<string>;
}
