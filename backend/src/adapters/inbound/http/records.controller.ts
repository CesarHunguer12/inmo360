import {
  Body, Controller, Delete, Get, Param, ParseEnumPipe, ParseUUIDPipe, Patch, Post, Put, Query, Req,
  Res, UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  CommissionRateDto, FavoriteDto, FollowUpDto, InquiryDto, InquiryStatusDto,
  CommissionStatusDto, FollowUpStatusDto, OperationDto, OpportunityStageDto, OwnerDto, UpdateOwnerDto,
  PreferenceDto, ReportQueryDto, VisitDto, VisitStatusDto
} from '../../../application/dtos/real-estate.dto';
import { RoleDto } from '../../../application/dtos/role.dto';
import { ManageRealEstateUseCases } from '../../../application/use-cases/manage-real-estate.use-case';
import { ManageUsersUseCase } from '../../../application/use-cases/manage-users.use-case';
import { RecommendPropertiesUseCase } from '../../../application/use-cases/recommend-properties.use-case';
import { PrioritizeOpportunitiesUseCase } from '../../../application/use-cases/prioritize-opportunities.use-case';
import { GetDetailedReportUseCase } from '../../../application/use-cases/get-detailed-report.use-case';
import { REPORT_KINDS, ReportKind } from '../../../domain/ports/reports-repository.port';
import { AuthenticatedRequest } from '../../../infrastructure/security/authenticated-request';
import { AuthGuard } from '../../../infrastructure/security/auth.guard';
import { RolesGuard } from '../../../infrastructure/security/roles.guard';
import { Roles } from '../../../infrastructure/security/roles.decorator';

const Authenticated = [AuthGuard, RolesGuard] as const;
const ReportKindValues = Object.fromEntries(REPORT_KINDS.map((kind) => [kind, kind]));

@ApiTags('Propietarios')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Controller('owners')
export class OwnersController {
  constructor(private readonly useCases: ManageRealEstateUseCases) {}

  @Get()
  @Roles('ADMINISTRADOR', 'AGENTE')
  list(@Req() request: AuthenticatedRequest) { return this.useCases.listOwners(request.user); }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'AGENTE')
  get(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.useCases.getOwner(request.user, id);
  }

  @Post()
  @Roles('ADMINISTRADOR', 'AGENTE')
  create(@Req() request: AuthenticatedRequest, @Body() dto: OwnerDto) {
    return this.useCases.createOwner(request.user, dto);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'AGENTE')
  update(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOwnerDto) {
    return this.useCases.updateOwner(request.user, id, dto);
  }
}

@ApiTags('Clientes y usuarios')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Controller()
export class ClientsController {
  constructor(
    private readonly useCases: ManageRealEstateUseCases,
    private readonly users: ManageUsersUseCase
  ) {}

  @Get('clients')
  @Roles('ADMINISTRADOR', 'AGENTE')
  list(@Req() request: AuthenticatedRequest) { return this.useCases.listClients(request.user); }

  @Get('clients/:id')
  @Roles('ADMINISTRADOR', 'AGENTE')
  get(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.useCases.getClient(request.user, id);
  }

  @Patch('users/:id/role')
  @Roles('ADMINISTRADOR')
  updateRole(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RoleDto) {
    return this.users.changeRole(request.user, id, dto.role);
  }
}

@ApiTags('Preferencias')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Roles('CLIENTE')
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly useCases: ManageRealEstateUseCases) {}

  @Get('me')
  get(@Req() request: AuthenticatedRequest) { return this.useCases.getPreferences(request.user); }

  @Put('me')
  save(@Req() request: AuthenticatedRequest, @Body() dto: PreferenceDto) {
    return this.useCases.savePreferences(request.user, dto);
  }
}

@ApiTags('Recomendaciones')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Roles('CLIENTE')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommend: RecommendPropertiesUseCase) {}

  @Get('me')
  get(@Req() request: AuthenticatedRequest) { return this.recommend.execute(request.user.id); }
}

@ApiTags('Favoritos')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Roles('CLIENTE')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly useCases: ManageRealEstateUseCases) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) { return this.useCases.listFavorites(request.user); }

  @Post()
  add(@Req() request: AuthenticatedRequest, @Body() dto: FavoriteDto) {
    return this.useCases.addFavorite(request.user, dto.propertyId);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.useCases.removeFavorite(request.user, id);
  }
}

@ApiTags('Consultas')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly useCases: ManageRealEstateUseCases) {}

  @Post()
  @Roles('CLIENTE')
  create(@Req() request: AuthenticatedRequest, @Body() dto: InquiryDto) {
    return this.useCases.createInquiry(request.user, dto.propertyId, dto.message);
  }

  @Get('agent')
  @Roles('ADMINISTRADOR', 'AGENTE')
  list(@Req() request: AuthenticatedRequest) { return this.useCases.listInquiries(request.user); }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'AGENTE')
  update(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: InquiryStatusDto) {
    return this.useCases.updateInquiry(request.user, id, dto.status);
  }
}

@ApiTags('Visitas')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Controller('visits')
export class VisitsController {
  constructor(private readonly useCases: ManageRealEstateUseCases) {}

  @Post()
  @Roles('CLIENTE')
  create(@Req() request: AuthenticatedRequest, @Body() dto: VisitDto) {
    return this.useCases.createVisit(request.user, dto.propertyId, new Date(dto.scheduledAt), dto.notes);
  }

  @Get()
  @Roles('ADMINISTRADOR', 'AGENTE', 'CLIENTE')
  list(@Req() request: AuthenticatedRequest) { return this.useCases.listVisits(request.user); }

  @Get('agent')
  @Roles('ADMINISTRADOR', 'AGENTE')
  listForAgent(@Req() request: AuthenticatedRequest) { return this.useCases.listVisits(request.user); }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'AGENTE')
  update(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: VisitStatusDto) {
    return this.useCases.updateVisit(request.user, id, dto.status, dto.scheduledAt ? new Date(dto.scheduledAt) : undefined);
  }
}

@ApiTags('Oportunidades')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly useCases: ManageRealEstateUseCases,
    private readonly prioritize: PrioritizeOpportunitiesUseCase
  ) {}

  @Get('prioritized')
  @Roles('ADMINISTRADOR', 'AGENTE')
  listPrioritized(@Req() request: AuthenticatedRequest) {
    return this.prioritize.execute(request.user.role === 'AGENTE' ? request.user.id : undefined);
  }

  @Get()
  @Roles('ADMINISTRADOR', 'AGENTE', 'CLIENTE')
  list(@Req() request: AuthenticatedRequest) { return this.useCases.listOpportunities(request.user); }

  @Patch(':id/stage')
  @Roles('ADMINISTRADOR', 'AGENTE')
  updateStage(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: OpportunityStageDto) {
    return this.useCases.updateOpportunityStage(request.user, id, dto.stage);
  }
}

@ApiTags('Seguimientos')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Roles('ADMINISTRADOR', 'AGENTE')
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly useCases: ManageRealEstateUseCases) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: FollowUpDto) {
    return this.useCases.createFollowUp(request.user, dto.opportunityId, dto.description, new Date(dto.dueAt));
  }

  @Patch(':id')
  updateStatus(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: FollowUpStatusDto) {
    return this.useCases.updateFollowUpStatus(request.user, id, dto.status);
  }
}

@ApiTags('Operaciones')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Roles('ADMINISTRADOR', 'AGENTE')
@Controller('operations')
export class OperationsController {
  constructor(private readonly useCases: ManageRealEstateUseCases) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: OperationDto) {
    return this.useCases.createOperation(request.user, dto.opportunityId, dto.amount);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) { return this.useCases.listOperations(request.user); }
}

@ApiTags('Comisiones')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Roles('ADMINISTRADOR', 'AGENTE')
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly useCases: ManageRealEstateUseCases) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) { return this.useCases.listCommissions(request.user); }

  @Post('configuration')
  @Roles('ADMINISTRADOR')
  setRate(@Req() request: AuthenticatedRequest, @Body() dto: CommissionRateDto) {
    return this.useCases.setCommissionRate(request.user, dto.ratePercent);
  }

  @Patch(':id')
  updateStatus(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CommissionStatusDto) {
    return this.useCases.updateCommissionStatus(request.user, id, dto.status);
  }
}

@ApiTags('Dashboard y reportes')
@ApiBearerAuth()
@UseGuards(...Authenticated)
@Controller()
export class ReportsController {
  constructor(
    private readonly useCases: ManageRealEstateUseCases,
    private readonly detailedReports: GetDetailedReportUseCase
  ) {}

  @Get('dashboard/admin')
  @Roles('ADMINISTRADOR')
  adminDashboard(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.useCases.getDashboard(request.user, query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('dashboard/agent')
  @Roles('AGENTE')
  agentDashboard(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.useCases.getDashboard(request.user, query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/summary')
  @Roles('ADMINISTRADOR', 'AGENTE')
  summary(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.useCases.getReport(request.user, query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/properties')
  @Roles('ADMINISTRADOR', 'AGENTE')
  properties(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.detailedReports.get(request.user, 'properties', query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/inquiries')
  @Roles('ADMINISTRADOR', 'AGENTE')
  inquiries(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.detailedReports.get(request.user, 'inquiries', query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/visits')
  @Roles('ADMINISTRADOR', 'AGENTE')
  visits(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.detailedReports.get(request.user, 'visits', query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/opportunities')
  @Roles('ADMINISTRADOR', 'AGENTE')
  opportunities(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.detailedReports.get(request.user, 'opportunities', query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/operations')
  @Roles('ADMINISTRADOR', 'AGENTE')
  operations(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.detailedReports.get(request.user, 'operations', query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/commissions')
  @Roles('ADMINISTRADOR', 'AGENTE')
  commissions(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.detailedReports.get(request.user, 'commissions', query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/agents')
  @Roles('ADMINISTRADOR', 'AGENTE')
  agents(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto) {
    return this.detailedReports.get(request.user, 'agents', query.from ? new Date(query.from) : undefined, query.to ? new Date(query.to) : undefined);
  }

  @Get('reports/:report/export.csv')
  @Roles('ADMINISTRADOR', 'AGENTE')
  async exportDetailedCsv(
    @Req() request: AuthenticatedRequest,
    @Param('report', new ParseEnumPipe(ReportKindValues)) report: ReportKind,
    @Query() query: ReportQueryDto,
    @Res() response: Response
  ) {
    const csv = await this.detailedReports.exportCsv(
      request.user, report,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined
    );
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="inmo360-${report}-report.csv"`);
    response.send(`\uFEFF${csv}`);
  }

  @Get('reports/export.csv')
  @Roles('ADMINISTRADOR', 'AGENTE')
  async exportCsv(@Req() request: AuthenticatedRequest, @Query() query: ReportQueryDto, @Res() response: Response) {
    const csv = await this.useCases.exportOperationsCsv(
      request.user,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined
    );
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="inmo360-report.csv"');
    response.send(`\uFEFF${csv}`);
  }
}
