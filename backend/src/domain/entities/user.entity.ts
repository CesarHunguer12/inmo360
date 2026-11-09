export type UserRole = 'ADMINISTRADOR' | 'AGENTE' | 'CLIENTE';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface UserEntity extends AuthenticatedUser {
  passwordHash: string;
  phone: string | null;
  isActive: boolean;
}
