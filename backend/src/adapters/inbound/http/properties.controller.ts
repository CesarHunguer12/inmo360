import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ManageRealEstateUseCases } from '../../../application/use-cases/manage-real-estate.use-case';
import {
  PropertyDto, PropertyImageDto, PropertyQueryDto, PropertyStatusDto, UpdatePropertyDto,
  UpdatePropertyImageDto
} from '../../../application/dtos/real-estate.dto';
import { ListPropertiesUseCase } from '../../../application/use-cases/list-properties.use-case';
import { ManagePropertyImagesUseCase } from '../../../application/use-cases/manage-property-images.use-case';
import { AuthenticatedRequest } from '../../../infrastructure/security/authenticated-request';
import { AuthGuard } from '../../../infrastructure/security/auth.guard';
import { RolesGuard } from '../../../infrastructure/security/roles.guard';
import { Roles } from '../../../infrastructure/security/roles.decorator';

@ApiTags('Propiedades')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly listProperties: ListPropertiesUseCase,
    private readonly manage: ManageRealEstateUseCases
  ) {}

  @Get()
  list(@Query() query: PropertyQueryDto) {
    return this.listProperties.execute({
      modality: query.modality,
      type: query.type,
      zone: query.zone,
      publicOnly: true
    });
  }

  @Get('managed')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'AGENTE')
  @ApiBearerAuth()
  listManaged(@Req() request: AuthenticatedRequest) {
    return this.listProperties.execute({
      agentId: request.user.role === 'AGENTE' ? request.user.id : undefined
    });
  }

  @Get(':id')
  getPublicById(@Param('id', ParseUUIDPipe) id: string) {
    return this.listProperties.getPublicById(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'AGENTE')
  @ApiBearerAuth()
  create(@Req() request: AuthenticatedRequest, @Body() dto: PropertyDto) {
    return this.manage.createProperty(request.user, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'AGENTE')
  @ApiBearerAuth()
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto
  ) {
    return this.manage.updateProperty(request.user, id, dto);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'AGENTE')
  @ApiBearerAuth()
  changeStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PropertyStatusDto
  ) {
    return this.manage.changePropertyStatus(request.user, id, dto.status);
  }
}

@ApiTags('Fotografías de propiedades')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMINISTRADOR', 'AGENTE')
@Controller('properties/:propertyId/images')
export class PropertyImagesController {
  constructor(private readonly images: ManagePropertyImagesUseCase) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Param('propertyId', ParseUUIDPipe) propertyId: string
  ) {
    return this.images.list(request.user, propertyId);
  }

  @Post()
  add(
    @Req() request: AuthenticatedRequest,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: PropertyImageDto
  ) {
    return this.images.add(request.user, propertyId, dto);
  }

  @Patch(':imageId')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdatePropertyImageDto
  ) {
    return this.images.update(request.user, propertyId, imageId, dto);
  }

  @Delete(':imageId')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string
  ) {
    return this.images.remove(request.user, propertyId, imageId);
  }
}
