import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PreferenceSnapshot,
  RecommendationCandidate,
  RecommendationRepository,
  RECOMMENDATION_REPOSITORY
} from '../../domain/ports/recommendation-repository.port';

export const RECOMMENDATION_WEIGHTS = {
  budget: 25,
  zone: 20,
  modality: 15,
  type: 10,
  bedrooms: 8,
  bathrooms: 5,
  area: 7,
  garage: 4,
  features: 6
} as const;

export interface ScoredRecommendation extends RecommendationCandidate {
  score: number;
  matchedCriteria: string[];
  unmatchedCriteria: string[];
}

export function scoreProperty(
  preference: PreferenceSnapshot,
  property: RecommendationCandidate
): ScoredRecommendation {
  const evaluations: Array<{ key: keyof typeof RECOMMENDATION_WEIGHTS; label: string; ratio: number | null }> = [
    {
      key: 'budget',
      label: 'Presupuesto',
      ratio: preference.minBudget === null && preference.maxBudget === null
        ? null
        : (preference.minBudget === null || property.price >= preference.minBudget) &&
          (preference.maxBudget === null || property.price <= preference.maxBudget) ? 1 : 0
    },
    {
      key: 'zone',
      label: 'Zona',
      ratio: preference.zones.length === 0 ? null
        : preference.zones.some((zone) => property.zone.toLocaleLowerCase().includes(zone.toLocaleLowerCase())) ? 1 : 0
    },
    {
      key: 'modality',
      label: 'Modalidad',
      ratio: preference.modalities.length === 0 ? null : preference.modalities.includes(property.modality) ? 1 : 0
    },
    {
      key: 'type',
      label: 'Tipo de inmueble',
      ratio: preference.types.length === 0 ? null : preference.types.includes(property.type) ? 1 : 0
    },
    {
      key: 'bedrooms',
      label: 'Dormitorios',
      ratio: preference.minBedrooms === null ? null : property.bedrooms >= preference.minBedrooms ? 1 : 0
    },
    {
      key: 'bathrooms',
      label: 'Baños',
      ratio: preference.minBathrooms === null ? null : property.bathrooms >= preference.minBathrooms ? 1 : 0
    },
    {
      key: 'area',
      label: 'Superficie',
      ratio: preference.minAreaM2 === null ? null : property.areaM2 >= preference.minAreaM2 ? 1 : 0
    },
    {
      key: 'garage',
      label: 'Garaje',
      ratio: preference.requiresGarage === null ? null : property.hasGarage === preference.requiresGarage ? 1 : 0
    },
    {
      key: 'features',
      label: 'Características',
      ratio: preference.features.length === 0
        ? null
        : preference.features.filter((feature) => property.features.some(
            (candidate) => candidate.toLocaleLowerCase() === feature.toLocaleLowerCase()
          )).length / preference.features.length
    }
  ];

  const applicable = evaluations.filter((item) => item.ratio !== null);
  const possibleWeight = applicable.reduce((sum, item) => sum + RECOMMENDATION_WEIGHTS[item.key], 0);
  const earnedWeight = applicable.reduce(
    (sum, item) => sum + RECOMMENDATION_WEIGHTS[item.key] * (item.ratio ?? 0),
    0
  );
  const score = possibleWeight === 0 ? 0 : Math.round((earnedWeight / possibleWeight) * 100);
  const matchedCriteria = evaluations
    .filter((item) => item.ratio !== null && item.ratio === 1)
    .map((item) => item.label);
  const unmatchedCriteria = evaluations
    .filter((item) => item.ratio !== null && item.ratio < 1)
    .map((item) => item.label);

  return { ...property, score, matchedCriteria, unmatchedCriteria };
}

@Injectable()
export class RecommendPropertiesUseCase {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly repository: RecommendationRepository
  ) {}

  async execute(clientId: string): Promise<ScoredRecommendation[]> {
    const preference = await this.repository.getPreferences(clientId);
    if (!preference) throw new NotFoundException('El cliente aún no configuró sus preferencias.');
    const properties = await this.repository.listAvailableProperties();
    return properties
      .map((property) => scoreProperty(preference, property))
      .sort((left, right) => right.score - left.score || left.code.localeCompare(right.code));
  }
}
