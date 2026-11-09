import { Actor } from './real-estate-repository.port';

export const PROPERTY_IMAGE_REPOSITORY = Symbol('PROPERTY_IMAGE_REPOSITORY');

export interface PropertyImageInput {
  url?: string;
  caption?: string | null;
  position?: number;
}

export interface PropertyImageRepository {
  list(actor: Actor, propertyId: string): Promise<unknown[]>;
  add(actor: Actor, propertyId: string, input: Required<Pick<PropertyImageInput, 'url' | 'position'>> & PropertyImageInput): Promise<unknown>;
  update(actor: Actor, propertyId: string, imageId: string, input: PropertyImageInput): Promise<unknown>;
  remove(actor: Actor, propertyId: string, imageId: string): Promise<void>;
}
