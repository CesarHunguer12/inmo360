import { UserRole } from '../entities/user.entity';

export const REAL_ESTATE_REPOSITORY = Symbol('REAL_ESTATE_REPOSITORY');

export interface Actor {
  id: string;
  role: UserRole;
}

export interface OwnerInput {
  fullName: string;
  email?: string;
  phone: string;
  notes?: string | null;
}

export interface PropertyInput {
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
  images?: Array<{ url: string; caption?: string; position: number }>;
  ownerId: string;
  agentId?: string;
}

export interface PreferenceInput {
  minBudget?: number;
  maxBudget?: number;
  zones: string[];
  modalities: string[];
  types: string[];
  minBedrooms?: number;
  minBathrooms?: number;
  minAreaM2?: number;
  requiresGarage?: boolean;
  features: string[];
}

export interface RealEstateRepository {
  listOwners(actor: Actor): Promise<unknown>;
  getOwner(actor: Actor, ownerId: string): Promise<unknown>;
  createOwner(actor: Actor, input: OwnerInput): Promise<unknown>;
  updateOwner(actor: Actor, ownerId: string, input: Partial<OwnerInput>): Promise<unknown>;
  listClients(actor: Actor): Promise<unknown>;
  getClient(actor: Actor, clientId: string): Promise<unknown>;
  createProperty(actor: Actor, input: PropertyInput): Promise<unknown>;
  updateProperty(actor: Actor, propertyId: string, input: Partial<PropertyInput>): Promise<unknown>;
  changePropertyStatus(actor: Actor, propertyId: string, status: string): Promise<unknown>;
  getPreferences(actor: Actor): Promise<unknown>;
  savePreferences(actor: Actor, input: PreferenceInput): Promise<unknown>;
  listFavorites(actor: Actor): Promise<unknown>;
  addFavorite(actor: Actor, propertyId: string): Promise<unknown>;
  removeFavorite(actor: Actor, favoriteId: string): Promise<void>;
  createInquiry(actor: Actor, propertyId: string, message: string): Promise<unknown>;
  listInquiries(actor: Actor): Promise<unknown>;
  updateInquiry(actor: Actor, inquiryId: string, status: string): Promise<unknown>;
  createVisit(actor: Actor, propertyId: string, scheduledAt: Date, notes?: string): Promise<unknown>;
  listVisits(actor: Actor): Promise<unknown>;
  updateVisit(actor: Actor, visitId: string, status: string, scheduledAt?: Date): Promise<unknown>;
  listOpportunities(actor: Actor): Promise<unknown>;
  updateOpportunityStage(actor: Actor, opportunityId: string, stage: string): Promise<unknown>;
  createFollowUp(actor: Actor, opportunityId: string, description: string, dueAt: Date): Promise<unknown>;
  updateFollowUpStatus(actor: Actor, followUpId: string, status: string): Promise<unknown>;
  createOperation(actor: Actor, opportunityId: string, amount: number): Promise<unknown>;
  listOperations(actor: Actor): Promise<unknown>;
  listCommissions(actor: Actor): Promise<unknown>;
  setCommissionRate(actor: Actor, ratePercent: number): Promise<unknown>;
  updateCommissionStatus(actor: Actor, commissionId: string, status: string): Promise<unknown>;
  getDashboard(actor: Actor, from?: Date, to?: Date): Promise<unknown>;
  getReport(actor: Actor, from?: Date, to?: Date): Promise<unknown>;
  exportOperationsCsv(actor: Actor, from?: Date, to?: Date): Promise<string>;
}
