import { Injectable, NotFoundException } from '@nestjs/common';
import { PropertyStatus } from '@prisma/client';
import { PropertyRepository } from '../../../../domain/ports/property-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaPropertyRepository implements PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(filters: { status?: PropertyStatus; modality?: string; type?: string; zone?: string; agentId?: string; publicOnly?: boolean }) {
    return this.prisma.property.findMany({
      where: {
        status: filters.publicOnly ? PropertyStatus.DISPONIBLE : filters.status,
        isDeleted: false,
        ...(filters.modality ? { modality: filters.modality as never } : {}),
        ...(filters.type ? { type: filters.type as never } : {}),
        ...(filters.zone ? { zone: { contains: filters.zone, mode: 'insensitive' } } : {}),
        ...(filters.agentId ? { agentId: filters.agentId } : {})
      },
      include: { images: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPublicById(propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, status: PropertyStatus.DISPONIBLE, isDeleted: false },
      include: {
        images: { orderBy: { position: 'asc' } },
        agent: { select: { id: true, fullName: true } }
      }
    });
    if (!property) {
      throw new NotFoundException('Propiedad disponible no encontrada.');
    }
    return property;
  }
}
