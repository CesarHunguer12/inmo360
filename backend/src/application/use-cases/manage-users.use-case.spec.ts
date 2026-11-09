import { ForbiddenException } from '@nestjs/common';
import { ManageUsersUseCase } from './manage-users.use-case';
import { PASSWORD_HASHER } from '../../domain/ports/password-hasher.port';
import { USER_ADMINISTRATION_REPOSITORY } from '../../domain/ports/user-administration-repository.port';

describe('ManageUsersUseCase', () => {
  const repository = {
    listUsers: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    setUserActive: jest.fn()
  };
  const hasher = { hash: jest.fn(), verify: jest.fn() };
  let useCase: ManageUsersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageUsersUseCase(
      { [USER_ADMINISTRATION_REPOSITORY]: repository }[USER_ADMINISTRATION_REPOSITORY],
      { [PASSWORD_HASHER]: hasher }[PASSWORD_HASHER]
    );
  });

  it('only allows administrators to list and edit user accounts', async () => {
    expect(() => useCase.list({ id: 'agent-id', role: 'AGENTE' })).toThrow(ForbiddenException);
    expect(() => useCase.setActive({ id: 'client-id', role: 'CLIENTE' }, 'user-id', false))
      .toThrow(ForbiddenException);
    expect(repository.listUsers).not.toHaveBeenCalled();
    expect(repository.setUserActive).not.toHaveBeenCalled();
  });

  it('normalizes email and hashes the initial password before persistence', async () => {
    hasher.hash.mockResolvedValue('bcrypt-hash');
    repository.createUser.mockResolvedValue({ id: 'new-id', email: 'new@example.test' });

    await expect(useCase.create(
      { id: 'admin-id', role: 'ADMINISTRADOR' },
      {
        email: ' NEW@EXAMPLE.TEST ',
        fullName: ' New Agent ',
        phone: ' 555 ',
        password: 'a-secure-password',
        role: 'AGENTE'
      }
    )).resolves.toEqual({ id: 'new-id', email: 'new@example.test' });

    expect(hasher.hash).toHaveBeenCalledWith('a-secure-password');
    expect(repository.createUser).toHaveBeenCalledWith({
      email: 'new@example.test',
      fullName: 'New Agent',
      phone: '555',
      passwordHash: 'bcrypt-hash',
      role: 'AGENTE'
    });
  });

  it('does not pass a password through the account update operation', async () => {
    repository.updateUser.mockResolvedValue({ id: 'user-id' });
    await useCase.update({ id: 'admin-id', role: 'ADMINISTRADOR' }, 'user-id', {
      fullName: 'Updated Name',
      phone: null
    });
    expect(repository.updateUser).toHaveBeenCalledWith('user-id', { fullName: 'Updated Name', phone: null });
  });
});
