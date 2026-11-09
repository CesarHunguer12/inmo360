import { ConflictException } from '@nestjs/common';
import { AuthRepository } from '../../domain/ports/auth-repository.port';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { RegisterClientUseCase } from './register-client.use-case';

describe('RegisterClientUseCase', () => {
  const users: jest.Mocked<AuthRepository> = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createClient: jest.fn()
  };
  const passwords: jest.Mocked<PasswordHasher> = {
    hash: jest.fn().mockResolvedValue('secure-hash'),
    verify: jest.fn()
  };
  let useCase: RegisterClientUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RegisterClientUseCase(users, passwords);
  });

  it('normalizes email and always registers the client role with a password hash', async () => {
    users.findUserByEmail.mockResolvedValue(null);
    users.createClient.mockImplementation(async (input) => ({
      id: 'client-id',
      email: input.email,
      fullName: input.fullName,
      passwordHash: input.passwordHash,
      phone: input.phone ?? null,
      role: input.role,
      isActive: true
    }));

    const result = await useCase.execute({
      email: ' CLIENT@EXAMPLE.COM ',
      fullName: ' Example Client ',
      password: 'a-secure-development-password'
    });

    expect(users.createClient).toHaveBeenCalledWith(expect.objectContaining({
      email: 'client@example.com',
      fullName: 'Example Client',
      role: 'CLIENTE'
    }));
    expect(users.createClient.mock.calls[0][0].passwordHash).toBe('secure-hash');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email addresses without creating a user', async () => {
    users.findUserByEmail.mockResolvedValue({
      id: 'existing',
      email: 'client@example.com',
      fullName: 'Existing Client',
      passwordHash: 'not-returned',
      phone: null,
      role: 'CLIENTE',
      isActive: true
    });
    await expect(useCase.execute({
      email: 'client@example.com',
      fullName: 'Client',
      password: 'a-secure-development-password'
    })).rejects.toBeInstanceOf(ConflictException);
    expect(users.createClient).not.toHaveBeenCalled();
  });
});
