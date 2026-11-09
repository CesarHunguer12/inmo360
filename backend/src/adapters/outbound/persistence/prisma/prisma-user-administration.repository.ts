import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { UserAdministrationRepository } from '../../../../domain/ports/user-administration-repository.port';
import { PrismaService } from './prisma.service';

const safeUserFields = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;

@Injectable()
export class PrismaUserAdministrationRepository implements UserAdministrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  listUsers() {
    return this.prisma.user.findMany({
      select: safeUserFields,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }]
    });
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: safeUserFields });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async createUser(input: {
    email: string;
    fullName: string;
    phone?: string;
    passwordHash: string;
    role: UserRole;
  }) {
    try {
      return await this.prisma.user.create({
        data: input,
        select: safeUserFields
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una cuenta con ese correo electrónico.');
      }
      throw error;
    }
  }

  async updateUser(userId: string, input: {
    email?: string;
    fullName?: string;
    phone?: string | null;
    role?: UserRole;
  }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, isActive: true }
        });
        if (!existing) throw new NotFoundException('Usuario no encontrado.');
        if (existing.isActive && existing.role === UserRole.ADMINISTRADOR &&
          input.role !== undefined && input.role !== UserRole.ADMINISTRADOR) {
          const activeAdministrators = await tx.user.count({
            where: { role: UserRole.ADMINISTRADOR, isActive: true }
          });
          if (activeAdministrators <= 1) {
            throw new ConflictException('No se puede cambiar el rol del único administrador activo.');
          }
        }
        return tx.user.update({ where: { id: userId }, data: input, select: safeUserFields });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una cuenta con ese correo electrónico.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('La cuenta cambió durante la operación; vuelve a intentarlo.');
      }
      throw error;
    }
  }

  async setUserActive(userId: string, isActive: boolean) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isActive: true } });
        if (!user) throw new NotFoundException('Usuario no encontrado.');
        if (!isActive && user.isActive && user.role === UserRole.ADMINISTRADOR) {
          const activeAdministrators = await tx.user.count({
            where: { role: UserRole.ADMINISTRADOR, isActive: true }
          });
          if (activeAdministrators <= 1) {
            throw new ConflictException('No se puede desactivar al único administrador activo.');
          }
        }
        return tx.user.update({ where: { id: userId }, data: { isActive }, select: safeUserFields });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('La cuenta cambió durante la operación; vuelve a intentarlo.');
      }
      throw error;
    }
  }
}
