import { UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from '../../domain/ports/auth-repository.port';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { TokenIssuer } from '../../domain/ports/token-issuer.port';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  const users: jest.Mocked<AuthRepository> = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createClient: jest.fn()
  };
  const passwords: jest.Mocked<PasswordHasher> = {
    hash: jest.fn(),
    verify: jest.fn()
  };
  const tokens: jest.Mocked<TokenIssuer> = { issue: jest.fn() };
  const useCase = new LoginUseCase(users, passwords, tokens);

  beforeEach(() => jest.clearAllMocks());

  it('issues a token for a verified active user', async () => {
    users.findUserByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'client@example.test',
      fullName: 'Demo Client',
      passwordHash: 'stored-hash',
      role: 'CLIENTE',
      phone: null,
      isActive: true
    });
    passwords.verify.mockResolvedValue(true);
    tokens.issue.mockResolvedValue('signed-jwt');

    await expect(useCase.execute(' CLIENT@EXAMPLE.TEST ', 'password'))
      .resolves.toMatchObject({ accessToken: 'signed-jwt', tokenType: 'Bearer' });
    expect(users.findUserByEmail).toHaveBeenCalledWith('client@example.test');
    expect(tokens.issue).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-id' }));
  });

  it('does not disclose whether the user exists when credentials are invalid', async () => {
    users.findUserByEmail.mockResolvedValue(null);
    await expect(useCase.execute('missing@example.test', 'wrong-password'))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokens.issue).not.toHaveBeenCalled();
  });
});
