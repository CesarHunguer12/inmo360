import { OpportunityStage } from '@prisma/client';

export const PRIORITY_REPOSITORY = Symbol('PRIORITY_REPOSITORY');

export interface PrioritizableOpportunity {
  id: string;
  stage: OpportunityStage;
  lastContactAt: Date | null;
  updatedAt: Date;
  inquiryCount: number;
  pendingVisitCount: number;
  completedVisitCount: number;
  pendingFollowUpCount: number;
}

export interface PriorityRepository {
  listOpportunities(agentId?: string): Promise<PrioritizableOpportunity[]>;
}
