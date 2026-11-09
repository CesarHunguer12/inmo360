import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {
  CommissionStatus,
  InquiryStatus,
  OpportunityStage,
  Prisma,
  PropertyModality,
  PropertyStatus,
  PropertyType,
  UserRole as PrismaUserRole,
  VisitStatus
} from '@prisma/client';
import { Actor, OwnerInput, PreferenceInput, PropertyInput, RealEstateRepository } from '../../../../domain/ports/real-estate-repository.port';
import { UserRole } from '../../../../domain/entities/user.entity';
import { PrismaService } from './prisma.service';
import { Money } from '../../../../domain/value-objects/money';

@Injectable()
export class PrismaRealEstateRepository implements RealEstateRepository {
  constructor(private readonly prisma: PrismaService) {}

  private requireRole(actor: Actor, ...roles: UserRole[]) {
    if (!roles.includes(actor.role)) throw new ForbiddenException();
  }

  private agentScope(actor: Actor) {
    return actor.role === 'AGENTE' ? { agentId: actor.id } : {};
  }

  private async assertPropertyAccess(actor: Actor, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, isDeleted: false },
      select: { id: true, agentId: true }
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada.');
    if (actor.role === 'AGENTE' && property.agentId !== actor.id) throw new ForbiddenException();
    return property;
  }

  private async assertOpportunityAccess(actor: Actor, opportunityId: string) {
    const opportunity = await this.prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) throw new NotFoundException('Oportunidad no encontrada.');
    if (actor.role === 'AGENTE' && opportunity.agentId !== actor.id) throw new ForbiddenException();
    if (actor.role === 'CLIENTE' && opportunity.clientId !== actor.id) throw new ForbiddenException();
    return opportunity;
  }

  async listOwners(actor: Actor) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    return this.prisma.owner.findMany({
      where: actor.role === 'AGENTE' ? { properties: { some: { agentId: actor.id, isDeleted: false } } } : {},
      include: {
        _count: {
          select: {
            properties: actor.role === 'AGENTE'
              ? { where: { agentId: actor.id, isDeleted: false } }
              : true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });
  }

  async getOwner(actor: Actor, ownerId: string) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const owner = await this.prisma.owner.findFirst({
      where: {
        id: ownerId,
        ...(actor.role === 'AGENTE' ? { properties: { some: { agentId: actor.id, isDeleted: false } } } : {})
      },
      include: {
        properties: {
          where: {
            isDeleted: false,
            ...(actor.role === 'AGENTE' ? { agentId: actor.id } : {})
          },
          select: { id: true, code: true, title: true, modality: true, status: true, price: true, zone: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!owner) throw new NotFoundException('Propietario no encontrado o no asignado al agente.');
    return owner;
  }

  async createOwner(actor: Actor, input: OwnerInput) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    return this.prisma.owner.create({ data: input });
  }

  async updateOwner(actor: Actor, ownerId: string, input: Partial<OwnerInput>) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const owner = await this.prisma.owner.findFirst({
      where: {
        id: ownerId,
        ...(actor.role === 'AGENTE' ? { properties: { some: { agentId: actor.id, isDeleted: false } } } : {})
      },
      select: { id: true }
    });
    if (!owner) throw new NotFoundException('Propietario no encontrado o no asignado al agente.');
    if (actor.role === 'AGENTE') {
      const otherAssignments = await this.prisma.property.count({
        where: { ownerId, isDeleted: false, agentId: { not: actor.id } }
      });
      if (otherAssignments) {
        throw new ForbiddenException('No se puede editar un propietario compartido con propiedades de otros agentes.');
      }
    }
    return this.prisma.owner.update({ where: { id: ownerId }, data: input });
  }

  async listClients(actor: Actor) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    return this.prisma.user.findMany({
      where: {
        role: PrismaUserRole.CLIENTE,
        ...(actor.role === 'AGENTE' ? {
          OR: [
            { opportunities: { some: { agentId: actor.id } } },
            { visitsAsClient: { some: { agentId: actor.id } } },
            { assignedInquiries: { some: { agentId: actor.id } } }
          ]
        } : {})
      },
      select: { id: true, email: true, fullName: true, phone: true, isActive: true, createdAt: true },
      orderBy: { fullName: 'asc' }
    });
  }

  async getClient(actor: Actor, clientId: string) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const client = await this.prisma.user.findFirst({
      where: {
        id: clientId,
        role: PrismaUserRole.CLIENTE,
        ...(actor.role === 'AGENTE' ? {
          OR: [
            { opportunities: { some: { agentId: actor.id } } },
            { visitsAsClient: { some: { agentId: actor.id } } },
            { assignedInquiries: { some: { agentId: actor.id } } }
          ]
        } : {})
      },
      select: { id: true, email: true, fullName: true, phone: true, isActive: true, createdAt: true }
    });
    if (!client) throw new NotFoundException('Cliente no encontrado o no asignado al agente.');
    return client;
  }

  async createProperty(actor: Actor, input: PropertyInput) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const ownerExists = await this.prisma.owner.findUnique({ where: { id: input.ownerId }, select: { id: true } });
    if (!ownerExists) throw new NotFoundException('Propietario no encontrado.');
    const agentId = actor.role === 'AGENTE' ? actor.id : input.agentId;
    if (!agentId) throw new ConflictException('Debe asignarse un agente responsable.');
    const agent = await this.prisma.user.findFirst({
      where: { id: agentId, role: PrismaUserRole.AGENTE, isActive: true },
      select: { id: true }
    });
    if (!agent) throw new NotFoundException('Agente responsable no encontrado.');
    const { images, ...propertyFields } = input;
    return this.prisma.property.create({
      data: {
        ...propertyFields,
        modality: input.modality as PropertyModality,
        type: input.type as PropertyType,
        price: new Prisma.Decimal(input.price),
        areaM2: new Prisma.Decimal(input.areaM2),
        agentId,
        ...(images?.length ? { images: { create: images } } : {})
      }
    });
  }

  async updateProperty(actor: Actor, propertyId: string, input: Partial<PropertyInput>) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    await this.assertPropertyAccess(actor, propertyId);
    const { modality, type, price, areaM2, ownerId, agentId: requestedAgent, images, ...rest } = input;
    const data: Prisma.PropertyUpdateInput = {
      ...rest,
      ...(modality ? { modality: modality as PropertyModality } : {}),
      ...(type ? { type: type as PropertyType } : {}),
      ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
      ...(areaM2 !== undefined ? { areaM2: new Prisma.Decimal(areaM2) } : {})
    };
    if (ownerId) {
      const owner = await this.prisma.owner.findUnique({ where: { id: ownerId }, select: { id: true } });
      if (!owner) throw new NotFoundException('Propietario no encontrado.');
      data.owner = { connect: { id: ownerId } };
    }
    if (actor.role === 'ADMINISTRADOR' && requestedAgent) {
      const agent = await this.prisma.user.findFirst({ where: { id: requestedAgent, role: 'AGENTE', isActive: true } });
      if (!agent) throw new NotFoundException('Agente responsable no encontrado.');
      data.agent = { connect: { id: requestedAgent } };
    }
    if (images?.length) data.images = { create: images };
    return this.prisma.property.update({ where: { id: propertyId }, data });
  }

  async changePropertyStatus(actor: Actor, propertyId: string, status: string) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    await this.assertPropertyAccess(actor, propertyId);
    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        status: status as PropertyStatus,
        ...(status === 'INACTIVA' ? { isDeleted: true } : {})
      }
    });
  }

  async getPreferences(actor: Actor) {
    this.requireRole(actor, 'CLIENTE');
    return this.prisma.clientPreference.findUnique({ where: { clientId: actor.id } });
  }

  async savePreferences(actor: Actor, input: PreferenceInput) {
    this.requireRole(actor, 'CLIENTE');
    if (input.minBudget !== undefined && input.maxBudget !== undefined && input.minBudget > input.maxBudget) {
      throw new ConflictException('El presupuesto mínimo no puede superar al máximo.');
    }
    const data = {
      minBudget: input.minBudget === undefined ? null : new Prisma.Decimal(input.minBudget),
      maxBudget: input.maxBudget === undefined ? null : new Prisma.Decimal(input.maxBudget),
      zones: input.zones,
      modalities: input.modalities as PropertyModality[],
      types: input.types as PropertyType[],
      minBedrooms: input.minBedrooms ?? null,
      minBathrooms: input.minBathrooms ?? null,
      minAreaM2: input.minAreaM2 === undefined ? null : new Prisma.Decimal(input.minAreaM2),
      requiresGarage: input.requiresGarage ?? null,
      features: input.features
    };
    return this.prisma.clientPreference.upsert({
      where: { clientId: actor.id },
      create: { clientId: actor.id, ...data },
      update: data
    });
  }

  async listFavorites(actor: Actor) {
    this.requireRole(actor, 'CLIENTE');
    return this.prisma.favorite.findMany({
      where: { clientId: actor.id, property: { isDeleted: false } },
      include: { property: { include: { images: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addFavorite(actor: Actor, propertyId: string) {
    this.requireRole(actor, 'CLIENTE');
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, status: PropertyStatus.DISPONIBLE, isDeleted: false }
    });
    if (!property) throw new NotFoundException('Propiedad disponible no encontrada.');
    return this.prisma.favorite.upsert({
      where: { clientId_propertyId: { clientId: actor.id, propertyId } },
      create: { clientId: actor.id, propertyId },
      update: {}
    });
  }

  async removeFavorite(actor: Actor, favoriteId: string) {
    this.requireRole(actor, 'CLIENTE');
    const result = await this.prisma.favorite.deleteMany({ where: { id: favoriteId, clientId: actor.id } });
    if (!result.count) throw new NotFoundException('Favorito no encontrado.');
  }

  async createInquiry(actor: Actor, propertyId: string, message: string) {
    this.requireRole(actor, 'CLIENTE');
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, status: PropertyStatus.DISPONIBLE, isDeleted: false },
      select: { id: true, agentId: true }
    });
    if (!property) throw new NotFoundException('Propiedad disponible no encontrada.');
    return this.prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findFirst({
        where: { clientId: actor.id, propertyId, agentId: property.agentId, stage: { notIn: ['CONCRETADA', 'PERDIDA'] } }
      });
      const activeOpportunity = opportunity ?? await tx.opportunity.create({
        data: { clientId: actor.id, propertyId, agentId: property.agentId }
      });
      return tx.inquiry.create({
        data: {
          clientId: actor.id,
          propertyId,
          agentId: property.agentId,
          opportunityId: activeOpportunity.id,
          message
        }
      });
    });
  }

  async listInquiries(actor: Actor) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    return this.prisma.inquiry.findMany({
      where: this.agentScope(actor),
      include: { client: { select: { id: true, fullName: true, email: true } }, property: { select: { id: true, code: true, title: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateInquiry(actor: Actor, inquiryId: string, status: string) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.inquiry.updateMany({
        where: { id: inquiryId, ...this.agentScope(actor) },
        data: { status: status as InquiryStatus }
      });
      if (!result.count) throw new NotFoundException('Consulta no encontrada o no asignada.');
      const inquiry = await tx.inquiry.findUniqueOrThrow({ where: { id: inquiryId } });
      if (inquiry.opportunityId) {
        await tx.opportunity.update({
          where: { id: inquiry.opportunityId },
          data: { lastContactAt: new Date() }
        });
      }
      return inquiry;
    });
  }

  async createVisit(actor: Actor, propertyId: string, scheduledAt: Date, notes?: string) {
    this.requireRole(actor, 'CLIENTE');
    if (scheduledAt <= new Date()) throw new ConflictException('La visita debe programarse en una fecha futura.');
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, status: PropertyStatus.DISPONIBLE, isDeleted: false },
      select: { id: true, agentId: true }
    });
    if (!property) throw new NotFoundException('Propiedad disponible no encontrada.');
    return this.prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.findFirst({
        where: { clientId: actor.id, propertyId, agentId: property.agentId, stage: { notIn: ['CONCRETADA', 'PERDIDA'] } }
      });
      const activeOpportunity = opportunity ?? await tx.opportunity.create({
        data: { clientId: actor.id, propertyId, agentId: property.agentId }
      });
      const visit = await tx.visit.create({
        data: {
          clientId: actor.id,
          propertyId,
          agentId: property.agentId,
          opportunityId: activeOpportunity.id,
          scheduledAt,
          notes
        }
      });
      await tx.opportunity.update({
        where: { id: activeOpportunity.id },
        data: {
          lastContactAt: new Date(),
          ...(activeOpportunity.stage === OpportunityStage.NUEVA ||
            activeOpportunity.stage === OpportunityStage.CONTACTADA ||
            activeOpportunity.stage === OpportunityStage.INTERESADA
            ? { stage: OpportunityStage.VISITA_PROGRAMADA }
            : {})
        }
      });
      return visit;
    });
  }

  async listVisits(actor: Actor) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE', 'CLIENTE');
    return this.prisma.visit.findMany({
      where: actor.role === 'AGENTE' ? { agentId: actor.id } : actor.role === 'CLIENTE' ? { clientId: actor.id } : {},
      include: { client: { select: { id: true, fullName: true } }, property: { select: { id: true, code: true, title: true } } },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  async updateVisit(actor: Actor, visitId: string, status: string, scheduledAt?: Date) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    if (status === 'REPROGRAMADA' && !scheduledAt) {
      throw new ConflictException('Se requiere una nueva fecha para reprogramar la visita.');
    }
    if (scheduledAt && scheduledAt <= new Date()) throw new ConflictException('La reprogramación debe ser futura.');
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.visit.updateMany({
        where: { id: visitId, ...this.agentScope(actor) },
        data: { status: status as VisitStatus, ...(scheduledAt ? { scheduledAt } : {}) }
      });
      if (!result.count) throw new NotFoundException('Visita no encontrada o no asignada.');
      const visit = await tx.visit.findUniqueOrThrow({ where: { id: visitId } });
      if (visit.opportunityId && status === 'REALIZADA') {
        await tx.opportunity.updateMany({
          where: { id: visit.opportunityId, stage: OpportunityStage.VISITA_PROGRAMADA },
          data: { stage: OpportunityStage.VISITADA, lastContactAt: new Date() }
        });
      }
      return visit;
    });
  }

  async listOpportunities(actor: Actor) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE', 'CLIENTE');
    return this.prisma.opportunity.findMany({
      where: actor.role === 'AGENTE' ? { agentId: actor.id } : actor.role === 'CLIENTE' ? { clientId: actor.id } : {},
      include: {
        client: { select: { id: true, fullName: true } },
        property: { select: { id: true, code: true, title: true } },
        followUps: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateOpportunityStage(actor: Actor, opportunityId: string, stage: string) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    await this.assertOpportunityAccess(actor, opportunityId);
    return this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: { stage: stage as OpportunityStage, lastContactAt: new Date() }
    });
  }

  async createFollowUp(actor: Actor, opportunityId: string, description: string, dueAt: Date) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    await this.assertOpportunityAccess(actor, opportunityId);
    if (dueAt < new Date()) throw new ConflictException('La fecha de seguimiento no puede estar en el pasado.');
    return this.prisma.followUp.create({
      data: { opportunityId, responsibleId: actor.id, description, dueAt }
    });
  }

  async updateFollowUpStatus(actor: Actor, followUpId: string, status: string) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const result = await this.prisma.followUp.updateMany({
      where: {
        id: followUpId,
        ...(actor.role === 'AGENTE' ? { responsibleId: actor.id } : {})
      },
      data: {
        status: status as import('@prisma/client').FollowUpStatus,
        completedAt: status === 'COMPLETADO' ? new Date() : null
      }
    });
    if (!result.count) throw new NotFoundException('Seguimiento no encontrado o no asignado.');
    return this.prisma.followUp.findUniqueOrThrow({ where: { id: followUpId } });
  }

  async createOperation(actor: Actor, opportunityId: string, amount: number) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const opportunity = await this.assertOpportunityAccess(actor, opportunityId);
    if (opportunity.stage !== OpportunityStage.NEGOCIACION) {
      throw new ConflictException('La oportunidad debe estar en negociación para registrar una operación.');
    }
    const configuration = await this.prisma.commissionConfiguration.findUnique({ where: { id: 'INMO360' } });
    if (!configuration) throw new ConflictException('Administración debe configurar el porcentaje de comisión primero.');
    const commissionAmount = Money.commission(
      amount.toFixed(2),
      configuration.ratePercent.toFixed(2)
    ).toDecimalString();
    return this.prisma.$transaction(async (tx) => {
      const propertyStatus = await tx.property.updateMany({
        where: { id: opportunity.propertyId, status: PropertyStatus.DISPONIBLE, isDeleted: false },
        data: { status: PropertyStatus.NO_DISPONIBLE }
      });
      if (!propertyStatus.count) throw new ConflictException('La propiedad ya no está disponible para una operación.');
      const operation = await tx.operation.create({
        data: {
          opportunityId,
          propertyId: opportunity.propertyId,
          clientId: opportunity.clientId,
          agentId: opportunity.agentId,
          amount: new Prisma.Decimal(amount)
        }
      });
      await tx.commission.create({
        data: {
          operationId: operation.id,
          agentId: opportunity.agentId,
          ratePercent: configuration.ratePercent,
          amount: new Prisma.Decimal(commissionAmount)
        }
      });
      await tx.opportunity.update({ where: { id: opportunityId }, data: { stage: OpportunityStage.CONCRETADA } });
      return operation;
    });
  }

  async listOperations(actor: Actor) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    return this.prisma.operation.findMany({
      where: this.agentScope(actor),
      include: {
        property: { select: { id: true, code: true, title: true } },
        client: { select: { id: true, fullName: true } },
        agent: { select: { id: true, fullName: true } },
        commission: true
      },
      orderBy: { operatedAt: 'desc' }
    });
  }

  async listCommissions(actor: Actor) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    return this.prisma.commission.findMany({
      where: this.agentScope(actor),
      include: { operation: { select: { id: true, amount: true, operatedAt: true } }, agent: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async setCommissionRate(actor: Actor, ratePercent: number) {
    this.requireRole(actor, 'ADMINISTRADOR');
    return this.prisma.commissionConfiguration.upsert({
      where: { id: 'INMO360' },
      create: { id: 'INMO360', ratePercent: new Prisma.Decimal(ratePercent), configuredById: actor.id },
      update: { ratePercent: new Prisma.Decimal(ratePercent), configuredById: actor.id }
    });
  }

  async updateCommissionStatus(actor: Actor, commissionId: string, status: string) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const result = await this.prisma.commission.updateMany({
      where: { id: commissionId, ...this.agentScope(actor) },
      data: {
        status: status as CommissionStatus,
        paidAt: status === CommissionStatus.PAGADA ? new Date() : null
      }
    });
    if (!result.count) throw new NotFoundException('Comisión no encontrada o no asignada.');
    return this.prisma.commission.findUniqueOrThrow({ where: { id: commissionId } });
  }

  private dateRange(from?: Date, to?: Date) {
    if (from && to && from > to) throw new ConflictException('La fecha inicial debe ser anterior a la fecha final.');
    return from || to ? { gte: from, lte: to } : undefined;
  }

  async getDashboard(actor: Actor, from?: Date, to?: Date) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const scoped = this.agentScope(actor);
    const range = this.dateRange(from, to);
    const [
      propertiesByStatusAndModality,
      inquiries,
      visits,
      opportunitiesByStage,
      operations,
      commissions,
      inquiryActivity,
      visitActivity,
      opportunityActivity,
      operationActivity
    ] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['status', 'modality'],
        where: { ...scoped, isDeleted: false, ...(range ? { createdAt: range } : {}) },
        _count: { _all: true }
      }),
      this.prisma.inquiry.count({ where: { ...scoped, ...(range ? { createdAt: range } : {}) } }),
      this.prisma.visit.groupBy({
        by: ['status'],
        where: { ...scoped, ...(range ? { scheduledAt: range } : {}) },
        _count: { _all: true }
      }),
      this.prisma.opportunity.groupBy({
        by: ['stage'],
        where: { ...scoped, ...(range ? { createdAt: range } : {}) },
        _count: { _all: true }
      }),
      this.prisma.operation.aggregate({
        where: { ...scoped, status: 'REGISTRADA', ...(range ? { operatedAt: range } : {}) },
        _count: { _all: true },
        _sum: { amount: true }
      }),
      this.prisma.commission.groupBy({
        by: ['status'],
        where: { ...scoped, ...(range ? { createdAt: range } : {}) },
        _count: { _all: true },
        _sum: { amount: true }
      }),
      this.prisma.inquiry.groupBy({
        by: ['agentId'],
        where: { ...scoped, ...(range ? { createdAt: range } : {}) },
        _count: { _all: true }
      }),
      this.prisma.visit.groupBy({
        by: ['agentId'],
        where: { ...scoped, ...(range ? { scheduledAt: range } : {}) },
        _count: { _all: true }
      }),
      this.prisma.opportunity.groupBy({
        by: ['agentId'],
        where: { ...scoped, ...(range ? { createdAt: range } : {}) },
        _count: { _all: true }
      }),
      this.prisma.operation.groupBy({
        by: ['agentId'],
        where: { ...scoped, status: 'REGISTRADA', ...(range ? { operatedAt: range } : {}) },
        _count: { _all: true },
        _sum: { amount: true }
      })
    ]);
    const agents = await this.prisma.user.findMany({
      where: actor.role === 'AGENTE'
        ? { id: actor.id, role: PrismaUserRole.AGENTE }
        : { role: PrismaUserRole.AGENTE, isActive: true },
      select: { id: true, fullName: true }
    });
    const agentIds = agents.map((agent) => agent.id);
    const agentNames = new Map(agents.map((agent) => [agent.id, agent.fullName]));
    const activityByAgent = agentIds.map((agentId) => ({
      agentId,
      agentName: agentNames.get(agentId) ?? '',
      inquiries: inquiryActivity.find((item) => item.agentId === agentId)?._count._all ?? 0,
      visits: visitActivity.find((item) => item.agentId === agentId)?._count._all ?? 0,
      opportunities: opportunityActivity.find((item) => item.agentId === agentId)?._count._all ?? 0,
      operations: operationActivity.find((item) => item.agentId === agentId)?._count._all ?? 0,
      operationAmount: operationActivity.find((item) => item.agentId === agentId)?._sum.amount?.toString() ?? '0'
    }));
    return {
      propertiesByStatusAndModality,
      inquiries,
      visits,
      opportunitiesByStage,
      operations,
      commissions,
      activityByAgent
    };
  }

  getReport(actor: Actor, from?: Date, to?: Date) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    return this.getDashboard(actor, from, to);
  }

  async exportOperationsCsv(actor: Actor, from?: Date, to?: Date) {
    this.requireRole(actor, 'ADMINISTRADOR', 'AGENTE');
    const records = await this.prisma.operation.findMany({
      where: {
        ...this.agentScope(actor),
        status: 'REGISTRADA',
        ...(from || to ? { operatedAt: this.dateRange(from, to) } : {})
      },
      include: {
        property: { select: { code: true, title: true } },
        client: { select: { fullName: true } },
        agent: { select: { fullName: true } },
        commission: true
      },
      orderBy: { operatedAt: 'desc' }
    });
    const escape = (value: string | number | Date | null | undefined) => {
      let text = value instanceof Date ? value.toISOString() : String(value ?? '');
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const rows = records.map((record) => [
      record.id, record.operatedAt, record.property.code, record.property.title,
      record.client.fullName, record.agent.fullName, record.amount.toString(),
      record.commission?.ratePercent.toString(), record.commission?.amount.toString(),
      record.commission?.status
    ].map(escape).join(','));
    return ['id,fecha,codigo_propiedad,propiedad,cliente,agente,monto,porcentaje_comision,comision,estado_comision', ...rows].join('\r\n');
  }
}
