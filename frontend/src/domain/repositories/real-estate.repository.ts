import type { DashboardData, Recommendation } from '../entities/dashboard';
import type { Property } from '../entities/property';
import type { User } from '../entities/user';

export interface Owner {
  id: string;
  fullName: string;
  email?: string | null;
  phone: string;
  notes?: string | null;
  _count?: { properties: number };
  properties?: Property[];
}

export interface Favorite {
  id: string;
  propertyId: string;
  property: Property;
}

export interface ClientPreference {
  minBudget?: number | null;
  maxBudget?: number | null;
  zones: string[];
  modalities: string[];
  types: string[];
  minBedrooms?: number | null;
  minBathrooms?: number | null;
  minAreaM2?: number | null;
  requiresGarage?: boolean | null;
  features: string[];
}

export interface RealEstateRepository {
  dashboard(role: User['role']): Promise<DashboardData>;
  users(): Promise<User[]>;
  clients(): Promise<User[]>;
  owners(): Promise<Owner[]>;
  getOwner(id: string): Promise<Owner>;
  createOwner(input: Omit<Owner, 'id' | '_count' | 'properties'>): Promise<Owner>;
  updateOwner(id: string, input: Partial<Omit<Owner, 'id' | '_count' | 'properties'>>): Promise<Owner>;
  recommendations(): Promise<Recommendation[]>;
  preferences(): Promise<ClientPreference | null>;
  savePreferences(input: ClientPreference): Promise<ClientPreference>;
  favorites(): Promise<Favorite[]>;
  addFavorite(propertyId: string): Promise<Favorite>;
  removeFavorite(id: string): Promise<void>;
  inquiries(): Promise<Array<Record<string, unknown>>>;
  visits(): Promise<Array<Record<string, unknown>>>;
  opportunities(): Promise<Array<Record<string, unknown>>>;
  createInquiry(propertyId: string, message: string): Promise<unknown>;
  createVisit(propertyId: string, scheduledAt: string, notes?: string): Promise<unknown>;
}
