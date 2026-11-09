import { PropertyStatus } from '@prisma/client';

export const PROPERTY_REPOSITORY = Symbol('PROPERTY_REPOSITORY');

export interface PropertyRepository {
  list(filters: {
    status?: PropertyStatus;
    modality?: string;
    type?: string;
    zone?: string;
    agentId?: string;
    publicOnly?: boolean;
  }): Promise<unknown[]>;
  getPublicById(propertyId: string): Promise<unknown>;
}
