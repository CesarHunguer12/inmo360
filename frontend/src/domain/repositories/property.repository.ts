import type { Property, PropertyFilters } from '../entities/property';

export interface PropertyRepository {
  list(filters?: PropertyFilters, managed?: boolean): Promise<Property[]>;
  get(id: string): Promise<Property>;
  create(input: PropertyWrite): Promise<Property>;
  update(id: string, input: Partial<PropertyWrite>): Promise<Property>;
}

export interface PropertyWrite {
  code: string;
  title: string;
  description: string;
  modality: string;
  type: string;
  price: number;
  zone: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  hasGarage: boolean;
  features: string[];
  ownerId: string;
  agentId?: string;
  images?: Array<{ url: string; caption?: string; position: number }>;
}
