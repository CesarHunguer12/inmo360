import { PropertyModality, PropertyType } from '@prisma/client';

export const RECOMMENDATION_REPOSITORY = Symbol('RECOMMENDATION_REPOSITORY');

export interface PreferenceSnapshot {
  minBudget: number | null;
  maxBudget: number | null;
  zones: string[];
  modalities: PropertyModality[];
  types: PropertyType[];
  minBedrooms: number | null;
  minBathrooms: number | null;
  minAreaM2: number | null;
  requiresGarage: boolean | null;
  features: string[];
}

export interface RecommendationCandidate {
  id: string;
  code: string;
  title: string;
  modality: PropertyModality;
  type: PropertyType;
  price: number;
  zone: string;
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  hasGarage: boolean;
  features: string[];
}

export interface RecommendationRepository {
  getPreferences(clientId: string): Promise<PreferenceSnapshot | null>;
  listAvailableProperties(): Promise<RecommendationCandidate[]>;
}
