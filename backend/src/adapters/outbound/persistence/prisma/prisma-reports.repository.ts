import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Actor } from '../../../../domain/ports/real-estate-repository.port';
import { ReportKind, ReportsRepository } from '../../../../domain/ports/reports-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaReportsRepository implements ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private assertAccess(actor: Actor) {
    if (actor.role !== 'ADMINISTRADOR' && actor.role !== 'AGENTE') throw new ForbiddenException();
  }

  private range(from?: Date, to?: Date) {
    if (from && to && from > to) throw new BadRequestException('La fecha inicial debe ser anterior o igual a la fecha final.');
    return from || to ? { gte: from, lte: to } : undefined;
  }

  private scope(actor: Actor) {
    return actor.role === 'AGENTE' ? { agentId: actor.id } : {};
  }

  async get(actor: Actor, kind: ReportKind, from?: Date, to?: Date): Promise<unknown> {
    this.assertAccess(actor);
    const range = this.range(from, to);
    const scoped = this.scope(actor);
    switch (kind) {
      case 'properties':
        return this.prisma.property.groupBy({
          by: ['modality', 'status'],
          where: { ...scoped, isDeleted: false, ...(range ? { createdAt: range } : {}) },
          _count: { _all: true },
          orderBy: [{ modality: 'asc' }, { status: 'asc' }]
        });
      case 'inquiries':
        return this.prisma.inquiry.findMany({
          where: { ...scoped, ...(range ? { createdAt: range } : {}) },
          select: {
            id: true, status: true, message: true, createdAt: true,
            client: { select: { id: true, fullName: true } },
            property: { select: { id: true, code: true, title: true } },
            agent: { select: { id: true, fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
      case 'visits':
        return this.prisma.visit.findMany({
          where: { ...scoped, ...(range ? { scheduledAt: range } : {}) },
          select: {
            id: true, status: true, scheduledAt: true, createdAt: true,
            client: { select: { id: true, fullName: true } },
            property: { select: { id: true, code: true, title: true } },
            agent: { select: { id: true, fullName: true } }
          },
          orderBy: { scheduledAt: 'desc' }
        });
      case 'opportunities':
        return this.prisma.opportunity.findMany({
          where: { ...scoped, ...(range ? { createdAt: range } : {}) },
          select: {
            id: true, stage: true, lastContactAt: true, createdAt: true,
            client: { select: { id: true, fullName: true } },
            property: { select: { id: true, code: true, title: true } },
            agent: { select: { id: true, fullName: true } }
          },
          orderBy: { updatedAt: 'desc' }
        });
      case 'operations':
        return this.prisma.operation.findMany({
          where: { ...scoped, ...(range ? { operatedAt: range } : {}) },
          select: {
            id: true, status: true, amount: true, operatedAt: true,
            property: { select: { id: true, code: true, title: true } },
            client: { select: { id: true, fullName: true } },
            agent: { select: { id: true, fullName: true } },
            commission: { select: { amount: true, ratePercent: true, status: true } }
          },
          orderBy: { operatedAt: 'desc' }
        });
      case 'commissions':
        return this.prisma.commission.findMany({
          where: { ...scoped, ...(range ? { createdAt: range } : {}) },
          select: {
            id: true, amount: true, ratePercent: true, status: true, createdAt: true, paidAt: true,
            agent: { select: { id: true, fullName: true } },
            operation: { select: { id: true, amount: true, operatedAt: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
      case 'agents':
        return this.agentActivity(actor, range);
    }
  }

  private async agentActivity(actor: Actor, range?: Prisma.DateTimeFilter) {
    const users = await this.prisma.user.findMany({
      where: actor.role === 'AGENTE'
        ? { id: actor.id, role: 'AGENTE' }
        : { role: 'AGENTE', isActive: true },
      select: { id: true, fullName: true }
    });
    const allowed = users.map(({ id }) => id);
    if (!allowed.length) return [];
    const [inquiries, visits, opportunities, operations, commissions] = await Promise.all([
      this.prisma.inquiry.groupBy({
        by: ['agentId'], where: { agentId: { in: allowed }, ...(range ? { createdAt: range } : {}) }, _count: { _all: true }
      }),
      this.prisma.visit.groupBy({
        by: ['agentId'], where: { agentId: { in: allowed }, ...(range ? { scheduledAt: range } : {}) }, _count: { _all: true }
      }),
      this.prisma.opportunity.groupBy({
        by: ['agentId'], where: { agentId: { in: allowed }, ...(range ? { createdAt: range } : {}) }, _count: { _all: true }
      }),
      this.prisma.operation.groupBy({
        by: ['agentId'], where: { agentId: { in: allowed }, ...(range ? { operatedAt: range } : {}) },
        _count: { _all: true }, _sum: { amount: true }
      }),
      this.prisma.commission.groupBy({
        by: ['agentId'], where: { agentId: { in: allowed }, ...(range ? { createdAt: range } : {}) },
        _count: { _all: true }, _sum: { amount: true }
      })
    ]);
    return users.map((agent) => ({
      ...agent,
      inquiries: inquiries.find((row) => row.agentId === agent.id)?._count._all ?? 0,
      visits: visits.find((row) => row.agentId === agent.id)?._count._all ?? 0,
      opportunities: opportunities.find((row) => row.agentId === agent.id)?._count._all ?? 0,
      operations: operations.find((row) => row.agentId === agent.id)?._count._all ?? 0,
      operationAmount: operations.find((row) => row.agentId === agent.id)?._sum.amount?.toString() ?? '0',
      commissions: commissions.find((row) => row.agentId === agent.id)?._count._all ?? 0,
      commissionAmount: commissions.find((row) => row.agentId === agent.id)?._sum.amount?.toString() ?? '0'
    }));
  }

  async exportCsv(actor: Actor, kind: ReportKind, from?: Date, to?: Date) {
    const data = await this.get(actor, kind, from, to);
    const records = Array.isArray(data) ? data as Array<Record<string, unknown>> : [];
    const columns: Record<ReportKind, string[]> = {
      properties: ['modality', 'status', '_count'],
      inquiries: ['id', 'status', 'message', 'createdAt', 'client', 'property', 'agent'],
      visits: ['id', 'status', 'scheduledAt', 'createdAt', 'client', 'property', 'agent'],
      opportunities: ['id', 'stage', 'lastContactAt', 'createdAt', 'client', 'property', 'agent'],
      operations: ['id', 'status', 'amount', 'operatedAt', 'property', 'client', 'agent', 'commission'],
      commissions: ['id', 'amount', 'ratePercent', 'status', 'createdAt', 'paidAt', 'agent', 'operation'],
      agents: ['id', 'fullName', 'inquiries', 'visits', 'opportunities', 'operations', 'operationAmount', 'commissions', 'commissionAmount']
    };
    const escape = (value: unknown) => {
      let text = value instanceof Date ? value.toISOString() : typeof value === 'object' && value !== null
        ? JSON.stringify(value, (_key, nested: unknown) => nested instanceof Date ? nested.toISOString() : nested)
        : String(value ?? '');
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    return [
      columns[kind].join(','),
      ...records.map((record) => columns[kind].map((column) => escape(record[column])).join(','))
    ].join('\r\n');
  }
}
