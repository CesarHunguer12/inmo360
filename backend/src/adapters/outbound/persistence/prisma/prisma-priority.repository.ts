import { Injectable } from '@nestjs/common';
import { PriorityRepository } from '../../../../domain/ports/priority-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaPriorityRepository implements PriorityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listOpportunities(agentId?: string) {
    const records = await this.prisma.opportunity.findMany({
      where: agentId ? { agentId } : undefined,
      include: {
        inquiries: { select: { id: true } },
        visits: { select: { id: true, status: true } },
        followUps: { select: { id: true, status: true } }
      }
    });
    return records.map((record) => ({
      id: record.id,
      stage: record.stage,
      lastContactAt: record.lastContactAt,
      updatedAt: record.updatedAt,
      inquiryCount: record.inquiries.length,
      pendingVisitCount: record.visits.filter((visit) => visit.status === 'PENDIENTE' || visit.status === 'CONFIRMADA' || visit.status === 'REPROGRAMADA').length,
      completedVisitCount: record.visits.filter((visit) => visit.status === 'REALIZADA').length,
      pendingFollowUpCount: record.followUps.filter((followUp) => followUp.status === 'PENDIENTE').length
    }));
  }
}
