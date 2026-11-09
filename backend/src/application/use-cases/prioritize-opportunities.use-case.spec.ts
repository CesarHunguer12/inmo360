import { PrioritizableOpportunity } from '../../domain/ports/priority-repository.port';
import { scoreOpportunity } from './prioritize-opportunities.use-case';

const now = new Date('2026-01-20T12:00:00.000Z');
const opportunity: PrioritizableOpportunity = {
  id: 'opportunity-1',
  stage: 'NEGOCIACION',
  lastContactAt: new Date('2026-01-01T12:00:00.000Z'),
  updatedAt: new Date('2026-01-01T12:00:00.000Z'),
  inquiryCount: 2,
  pendingVisitCount: 1,
  completedVisitCount: 1,
  pendingFollowUpCount: 2
};

describe('scoreOpportunity', () => {
  it('returns an explainable high priority and caps the score at 100', () => {
    const result = scoreOpportunity(opportunity, now);
    expect(result.score).toBe(100);
    expect(result.priority).toBe('ALTA');
    expect(result.reasons.length).toBeGreaterThan(1);
    expect(result.reasons.some((reason) => reason.includes('último contacto'))).toBe(true);
  });

  it('keeps low-activity opportunities low and handles missing contact dates', () => {
    const result = scoreOpportunity({
      ...opportunity,
      stage: 'NUEVA',
      lastContactAt: null,
      updatedAt: now,
      inquiryCount: 0,
      pendingVisitCount: 0,
      completedVisitCount: 0,
      pendingFollowUpCount: 0
    }, now);
    expect(result.score).toBe(10);
    expect(result.priority).toBe('BAJA');
  });
});
