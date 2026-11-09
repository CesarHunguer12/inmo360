import { UserRole } from '../entities/user.entity';

export const USER_ADMINISTRATION_REPOSITORY = Symbol('USER_ADMINISTRATION_REPOSITORY');

export interface UserAdministrationRepository {
  listUsers(): Promise<unknown[]>;
  getUser(userId: string): Promise<unknown>;
  createUser(input: {
    email: string;
    fullName: string;
    phone?: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<unknown>;
  updateUser(userId: string, input: {
    email?: string;
    fullName?: string;
    phone?: string | null;
    role?: UserRole;
  }): Promise<unknown>;
  setUserActive(userId: string, isActive: boolean): Promise<unknown>;
}
