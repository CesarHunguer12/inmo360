import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../domain/entities/user.entity';

export class RoleDto {
  @ApiProperty({ enum: ['ADMINISTRADOR', 'AGENTE', 'CLIENTE'] })
  @IsEnum({ ADMINISTRADOR: 'ADMINISTRADOR', AGENTE: 'AGENTE', CLIENTE: 'CLIENTE' })
  role!: UserRole;
}
