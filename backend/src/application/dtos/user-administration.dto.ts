import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean, IsByteLength, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf
} from 'class-validator';
import { UserRole } from '../../domain/entities/user.entity';

const userRoles = ['ADMINISTRADOR', 'AGENTE', 'CLIENTE'] as const;

export class CreateUserDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) fullName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiProperty({ minLength: 12, description: 'Contraseña inicial; el servidor solo almacena su hash.' })
  @IsString() @IsByteLength(12, 72) password!: string;
  @ApiProperty({ enum: userRoles }) @IsEnum({ ADMINISTRADOR: 'ADMINISTRADOR', AGENTE: 'AGENTE', CLIENTE: 'CLIENTE' })
  role!: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined)
  @IsEmail() @MaxLength(254) email?: string;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined)
  @IsString() @MinLength(2) @MaxLength(120) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?: string | null;
  @ApiPropertyOptional({ enum: userRoles }) @ValidateIf((_object, value) => value !== undefined)
  @IsEnum({ ADMINISTRADOR: 'ADMINISTRADOR', AGENTE: 'AGENTE', CLIENTE: 'CLIENTE' })
  role?: UserRole;
}

export class UserStatusDto {
  @ApiProperty() @IsBoolean() isActive!: boolean;
}
