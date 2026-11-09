import type { Property } from './property';

export interface CountGroup {
  status?: string;
  modality?: string;
  stage?: string;
  _count: { _all: number };
  _sum?: { amount?: string | number | null };
}

export interface AgentActivity {
  agentId: string;
  agentName: string;
  inquiries: number;
  visits: number;
  opportunities: number;
  operations: number;
  operationAmount: string;
}

export interface DashboardData {
  propertiesByStatusAndModality: CountGroup[];
  inquiries: number;
  visits: CountGroup[];
  opportunitiesByStage: CountGroup[];
  operations: { _count: { _all: number }; _sum: { amount: string | number | null } };
  commissions: CountGroup[];
  activityByAgent: AgentActivity[];
}

export interface Recommendation extends Property {
  score: number;
  matchedCriteria: string[];
  unmatchedCriteria: string[];
}
