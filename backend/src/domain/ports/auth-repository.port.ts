import { UserEntity, UserRole } from '../entities/user.entity';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export interface AuthRepository {
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserById(id: string): Promise<UserEntity | null>;
  createClient(input: {
    email: string;
    fullName: string;
    passwordHash: string;
    phone?: string;
    role: UserRole;
  }): Promise<UserEntity>;
}
