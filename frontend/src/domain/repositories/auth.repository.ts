import type { Session, User } from '../entities/user';

export interface AuthRepository {
  login(email: string, password: string): Promise<Session>;
  register(input: { email: string; fullName: string; password: string; phone?: string }): Promise<User>;
  currentUser(): Promise<User>;
  logout(): Promise<void>;
}
