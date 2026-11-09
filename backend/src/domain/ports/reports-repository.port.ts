import { Actor } from './real-estate-repository.port';

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');
export const REPORT_KINDS = ['properties', 'inquiries', 'visits', 'opportunities', 'operations', 'commissions', 'agents'] as const;
export type ReportKind = typeof REPORT_KINDS[number];

export interface ReportsRepository {
  get(actor: Actor, kind: ReportKind, from?: Date, to?: Date): Promise<unknown>;
  exportCsv(actor: Actor, kind: ReportKind, from?: Date, to?: Date): Promise<string>;
}
