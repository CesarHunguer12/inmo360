export type UserRole = 'ADMINISTRADOR' | 'AGENTE' | 'CLIENTE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface Session {
  accessToken: string;
  tokenType: 'Bearer';
  user: User;
}

export const roleLabel: Record<UserRole, string> = {
  ADMINISTRADOR: 'Administrador',
  AGENTE: 'Agente',
  CLIENTE: 'Cliente',
};
