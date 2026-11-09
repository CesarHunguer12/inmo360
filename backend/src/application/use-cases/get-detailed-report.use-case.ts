import { Inject, Injectable } from '@nestjs/common';
import { Actor } from '../../domain/ports/real-estate-repository.port';
import {
  REPORTS_REPOSITORY,
  ReportKind,
  ReportsRepository
} from '../../domain/ports/reports-repository.port';

@Injectable()
export class GetDetailedReportUseCase {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reports: ReportsRepository
  ) {}

  get(actor: Actor, kind: ReportKind, from?: Date, to?: Date) {
    return this.reports.get(actor, kind, from, to);
  }

  exportCsv(actor: Actor, kind: ReportKind, from?: Date, to?: Date) {
    return this.reports.exportCsv(actor, kind, from, to);
  }
}
