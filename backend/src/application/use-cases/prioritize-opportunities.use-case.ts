import { Inject, Injectable } from '@nestjs/common';
import { OpportunityStage } from '@prisma/client';
import {
  PRIORITY_REPOSITORY,
  PrioritizableOpportunity,
  PriorityRepository
} from '../../domain/ports/priority-repository.port';

export const PRIORITY_THRESHOLDS = { high: 70, medium: 40 } as const;
const STAGE_POINTS: Record<OpportunityStage, number> = {
  NUEVA: 10,
  CONTACTADA: 15,
  INTERESADA: 25,
  VISITA_PROGRAMADA: 25,
  VISITADA: 25,
  NEGOCIACION: 30,
  CONCRETADA: 0,
  PERDIDA: 0
};

export interface PrioritizedOpportunity extends PrioritizableOpportunity {
  score: number;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  reasons: string[];
}

export function scoreOpportunity(
  opportunity: PrioritizableOpportunity,
  now: Date
): PrioritizedOpportunity {
  const reasons: string[] = [];
  let score = STAGE_POINTS[opportunity.stage];
  if (score > 0) reasons.push(`Etapa ${opportunity.stage}: ${score} puntos`);

  const lastContact = opportunity.lastContactAt ?? opportunity.updatedAt;
  const daysSinceContact = Math.max(0, Math.floor((now.getTime() - lastContact.getTime()) / 86_400_000));
  const staleContactPoints = daysSinceContact >= 14 ? 30 : daysSinceContact >= 7 ? 20 : daysSinceContact >= 3 ? 10 : 0;
  if (staleContactPoints) {
    score += staleContactPoints;
    reasons.push(`${daysSinceContact} días desde el último contacto: ${staleContactPoints} puntos`);
  }

  const inquiryPoints = Math.min(opportunity.inquiryCount, 3) * 5;
  const visitPoints = Math.min(opportunity.pendingVisitCount, 2) * 10
    + Math.min(opportunity.completedVisitCount, 2) * 5;
  const followUpPoints = Math.min(opportunity.pendingFollowUpCount, 3) * 10;
  score += inquiryPoints + visitPoints + followUpPoints;
  if (inquiryPoints) reasons.push(`Consultas recibidas: ${inquiryPoints} puntos`);
  if (visitPoints) reasons.push(`Visitas pendientes o realizadas: ${visitPoints} puntos`);
  if (followUpPoints) reasons.push(`Seguimientos pendientes: ${followUpPoints} puntos`);

  score = Math.min(100, score);
  const priority = score >= PRIORITY_THRESHOLDS.high ? 'ALTA'
    : score >= PRIORITY_THRESHOLDS.medium ? 'MEDIA' : 'BAJA';
  if (!reasons.length) reasons.push('Sin señales recientes de actividad comercial.');
  return { ...opportunity, score, priority, reasons };
}

@Injectable()
export class PrioritizeOpportunitiesUseCase {
  constructor(@Inject(PRIORITY_REPOSITORY) private readonly repository: PriorityRepository) {}

  async execute(agentId?: string): Promise<PrioritizedOpportunity[]> {
    const now = new Date();
    const opportunities = await this.repository.listOpportunities(agentId);
    return opportunities
      .filter(({ stage }) => stage !== 'CONCRETADA' && stage !== 'PERDIDA')
      .map((item) => scoreOpportunity(item, now))
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  }
}
