import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthRepository } from '../../../../domain/ports/auth-repository.port';
import { UserEntity, UserRole } from '../../../../domain/entities/user.entity';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { email } }) as Promise<UserEntity | null>;
  }

  findUserById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } }) as Promise<UserEntity | null>;
  }

  createClient(input: { email: string; fullName: string; passwordHash: string; phone?: string; role: UserRole }): Promise<UserEntity> {
    return this.prisma.user.create({
      data: { ...input, phone: input.phone ?? null }
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una cuenta con ese correo electrónico.');
      }
      throw error;
    }) as Promise<UserEntity>;
  }
}
