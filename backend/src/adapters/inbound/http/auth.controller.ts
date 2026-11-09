import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { LoginDto } from '../../../application/dtos/login.dto';
import { RegisterDto } from '../../../application/dtos/register.dto';
import { GetCurrentUserUseCase } from '../../../application/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../../../application/use-cases/login.use-case';
import { RegisterClientUseCase } from '../../../application/use-cases/register-client.use-case';
import { AuthGuard } from '../../../infrastructure/security/auth.guard';
import { AuthenticatedRequest } from '../../../infrastructure/security/authenticated-request';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerClient: RegisterClientUseCase,
    private readonly login: LoginUseCase,
    private readonly getCurrentUser: GetCurrentUserUseCase
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registrar una cuenta de cliente' })
  register(@Body() dto: RegisterDto) {
    return this.registerClient.execute(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  loginUser(@Body() dto: LoginDto) {
    return this.login.execute(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar el usuario autenticado' })
  me(@Req() request: Request) {
    return this.getCurrentUser.execute((request as AuthenticatedRequest).user.id);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión en cliente JWT stateless' })
  logout() {
    return { message: 'Sesión cerrada. El cliente debe descartar el token.' };
  }
}
