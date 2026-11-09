import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserStatusDto } from '../../../application/dtos/user-administration.dto';
import { ManageUsersUseCase } from '../../../application/use-cases/manage-users.use-case';
import { AuthenticatedRequest } from '../../../infrastructure/security/authenticated-request';
import { AuthGuard } from '../../../infrastructure/security/auth.guard';
import { Roles } from '../../../infrastructure/security/roles.decorator';
import { RolesGuard } from '../../../infrastructure/security/roles.guard';

@ApiTags('Usuarios y agentes')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
@Controller('users')
export class UsersController {
  constructor(private readonly users: ManageUsersUseCase) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.users.list(request.user);
  }

  @Get(':id')
  get(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.get(request.user, id);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateUserDto) {
    return this.users.create(request.user, dto);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto
  ) {
    return this.users.update(request.user, id, dto);
  }

  @Patch(':id/status')
  setActive(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UserStatusDto
  ) {
    return this.users.setActive(request.user, id, dto.isActive);
  }
}
