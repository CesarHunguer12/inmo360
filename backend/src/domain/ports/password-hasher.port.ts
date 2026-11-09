export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  hash(plainText: string): Promise<string>;
  verify(plainText: string, passwordHash: string): Promise<boolean>;
}
