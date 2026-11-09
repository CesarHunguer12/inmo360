import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/ports/password-hasher.port';
import {
  USER_ADMINISTRATION_REPOSITORY,
  UserAdministrationRepository
} from '../../domain/ports/user-administration-repository.port';

interface AdministratorActor {
  id: string;
  role: UserRole;
}

@Injectable()
export class ManageUsersUseCase {
  constructor(
    @Inject(USER_ADMINISTRATION_REPOSITORY)
    private readonly users: UserAdministrationRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwords: PasswordHasher
  ) {}

  private assertAdministrator(actor: AdministratorActor) {
    if (actor.role !== 'ADMINISTRADOR') throw new ForbiddenException();
  }

  list(actor: AdministratorActor) {
    this.assertAdministrator(actor);
    return this.users.listUsers();
  }

  get(actor: AdministratorActor, userId: string) {
    this.assertAdministrator(actor);
    return this.users.getUser(userId);
  }

  async create(actor: AdministratorActor, input: {
    email: string;
    fullName: string;
    phone?: string;
    password: string;
    role: UserRole;
  }) {
    this.assertAdministrator(actor);
    const email = input.email.trim().toLowerCase();
    return this.users.createUser({
      email,
      fullName: input.fullName.trim(),
      phone: input.phone?.trim() || undefined,
      passwordHash: await this.passwords.hash(input.password),
      role: input.role
    });
  }

  update(actor: AdministratorActor, userId: string, input: {
    email?: string;
    fullName?: string;
    phone?: string | null;
    role?: UserRole;
  }) {
    this.assertAdministrator(actor);
    if (!Object.keys(input).length) throw new BadRequestException('Debe proporcionar al menos un campo para actualizar.');
    return this.users.updateUser(userId, {
      ...input,
      ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {})
    });
  }

  setActive(actor: AdministratorActor, userId: string, isActive: boolean) {
    this.assertAdministrator(actor);
    return this.users.setUserActive(userId, isActive);
  }

  changeRole(actor: AdministratorActor, userId: string, role: UserRole) {
    this.assertAdministrator(actor);
    return this.users.updateUser(userId, { role });
  }
}
