import {
  PreferenceSnapshot,
  RecommendationCandidate
} from '../../domain/ports/recommendation-repository.port';
import { scoreProperty } from './recommend-properties.use-case';

const preference: PreferenceSnapshot = {
  minBudget: 100_000,
  maxBudget: 200_000,
  zones: ['Sopocachi'],
  modalities: ['VENTA'],
  types: ['DEPARTAMENTO'],
  minBedrooms: 2,
  minBathrooms: 1,
  minAreaM2: 70,
  requiresGarage: true,
  features: ['balcón', 'ascensor']
};

const property: RecommendationCandidate = {
  id: 'property-1',
  code: 'DEMO-01',
  title: 'Departamento demostrativo',
  modality: 'VENTA',
  type: 'DEPARTAMENTO',
  price: 150_000,
  zone: 'Sopocachi, La Paz',
  bedrooms: 2,
  bathrooms: 2,
  areaM2: 80,
  hasGarage: true,
  features: ['balcón']
};

describe('scoreProperty', () => {
  it('returns a bounded score with matching and partially unmatched criteria', () => {
    const result = scoreProperty(preference, property);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.matchedCriteria).toContain('Zona');
    expect(result.unmatchedCriteria).toContain('Características');
  });

  it('does not divide by zero when no preferences are configured', () => {
    const empty: PreferenceSnapshot = {
      minBudget: null,
      maxBudget: null,
      zones: [],
      modalities: [],
      types: [],
      minBedrooms: null,
      minBathrooms: null,
      minAreaM2: null,
      requiresGarage: null,
      features: []
    };
    expect(scoreProperty(empty, property)).toMatchObject({
      score: 0,
      matchedCriteria: [],
      unmatchedCriteria: []
    });
  });

  it('does not award budget points outside configured bounds', () => {
    const result = scoreProperty({ ...preference, minBudget: 180_000 }, property);
    expect(result.unmatchedCriteria).toContain('Presupuesto');
  });
});
