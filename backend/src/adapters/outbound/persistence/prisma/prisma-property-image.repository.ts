import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Actor } from '../../../../domain/ports/real-estate-repository.port';
import {
  PropertyImageInput,
  PropertyImageRepository
} from '../../../../domain/ports/property-image-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaPropertyImageRepository implements PropertyImageRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(actor: Actor, propertyId: string) {
    if (actor.role !== 'ADMINISTRADOR' && actor.role !== 'AGENTE') throw new ForbiddenException();
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, isDeleted: false },
      select: { id: true, agentId: true }
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada.');
    if (actor.role === 'AGENTE' && property.agentId !== actor.id) throw new ForbiddenException();
  }

  async list(actor: Actor, propertyId: string) {
    await this.assertAccess(actor, propertyId);
    return this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }]
    });
  }

  async add(actor: Actor, propertyId: string, input: { url: string; position: number; caption?: string | null }) {
    await this.assertAccess(actor, propertyId);
    try {
      return await this.prisma.propertyImage.create({
        data: { propertyId, url: input.url, position: input.position, caption: input.caption }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una fotografía con esa posición para la propiedad.');
      }
      throw error;
    }
  }

  async update(actor: Actor, propertyId: string, imageId: string, input: PropertyImageInput) {
    await this.assertAccess(actor, propertyId);
    const image = await this.prisma.propertyImage.findFirst({ where: { id: imageId, propertyId }, select: { id: true } });
    if (!image) throw new NotFoundException('Fotografía no encontrada para esa propiedad.');
    try {
      return await this.prisma.propertyImage.update({ where: { id: imageId }, data: input });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una fotografía con esa posición para la propiedad.');
      }
      throw error;
    }
  }

  async remove(actor: Actor, propertyId: string, imageId: string) {
    await this.assertAccess(actor, propertyId);
    const result = await this.prisma.propertyImage.deleteMany({ where: { id: imageId, propertyId } });
    if (!result.count) throw new NotFoundException('Fotografía no encontrada para esa propiedad.');
  }
}
