import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsByteLength, IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ minLength: 12, description: 'Mínimo 12 caracteres' })
  @IsString()
  @IsByteLength(12, 72)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
