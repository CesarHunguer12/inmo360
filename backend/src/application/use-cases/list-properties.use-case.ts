import { Inject, Injectable } from '@nestjs/common';
import { PropertyStatus } from '@prisma/client';
import { PROPERTY_REPOSITORY, PropertyRepository } from '../../domain/ports/property-repository.port';

@Injectable()
export class ListPropertiesUseCase {
  constructor(@Inject(PROPERTY_REPOSITORY) private readonly properties: PropertyRepository) {}

  execute(filters: { status?: PropertyStatus; modality?: string; type?: string; zone?: string; agentId?: string; publicOnly?: boolean }) {
    return this.properties.list(filters);
  }

  getPublicById(propertyId: string) {
    return this.properties.getPublicById(propertyId);
  }
}
