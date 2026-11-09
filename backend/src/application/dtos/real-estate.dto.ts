import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsOptional,
  IsString, IsUrl, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CommissionStatus, FollowUpStatus, InquiryStatus, OpportunityStage, PropertyModality, PropertyStatus,
  PropertyType, VisitStatus
} from '@prisma/client';

export class OwnerDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) fullName!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiProperty() @IsString() @MaxLength(30) phone!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateOwnerDto {
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined)
  @IsString() @MinLength(2) @MaxLength(120) fullName?: string;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined)
  @IsEmail() email?: string;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined)
  @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
}

export class PropertyImageDto {
  @ApiProperty() @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }) @MaxLength(2048) url!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) caption?: string;
  @ApiProperty() @IsInt() @Min(0) @Max(999) position!: number;
}

export class UpdatePropertyImageDto {
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }) @MaxLength(2048) url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) caption?: string | null;
  @ApiPropertyOptional() @ValidateIf((_object, value) => value !== undefined)
  @IsInt() @Min(0) @Max(999) position?: number;
}

export class PropertyDto {
  @ApiProperty() @IsString() @MaxLength(32) code!: string;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(160) title!: string;
  @ApiProperty() @IsString() @MinLength(10) description!: string;
  @ApiProperty({ enum: PropertyModality }) @IsEnum(PropertyModality) modality!: PropertyModality;
  @ApiProperty({ enum: PropertyType }) @IsEnum(PropertyType) type!: PropertyType;
  @ApiProperty() @IsNumber() @Min(0.01) price!: number;
  @ApiProperty() @IsString() @MaxLength(100) zone!: string;
  @ApiProperty() @IsString() @MaxLength(240) address!: string;
  @ApiProperty() @IsInt() @Min(0) @Max(100) bedrooms!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(100) bathrooms!: number;
  @ApiProperty() @IsNumber() @Min(0.01) areaM2!: number;
  @ApiProperty() @IsBoolean() hasGarage!: boolean;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) features!: string[];
  @ApiPropertyOptional({ type: [PropertyImageDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PropertyImageDto)
  images?: PropertyImageDto[];
  @ApiProperty() @IsUUID() ownerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() agentId?: string;
}

export class UpdatePropertyDto extends PartialType(PropertyDto) {}

export class PropertyStatusDto {
  @ApiProperty({ enum: PropertyStatus }) @IsEnum(PropertyStatus) status!: PropertyStatus;
}

export class PropertyQueryDto {
  @ApiPropertyOptional({ enum: PropertyModality }) @IsOptional() @IsEnum(PropertyModality) modality?: PropertyModality;
  @ApiPropertyOptional({ enum: PropertyType }) @IsOptional() @IsEnum(PropertyType) type?: PropertyType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
}

export class PreferenceDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minBudget?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxBudget?: number;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) zones!: string[];
  @ApiProperty({ enum: PropertyModality, isArray: true }) @IsArray() @IsEnum(PropertyModality, { each: true }) modalities!: PropertyModality[];
  @ApiProperty({ enum: PropertyType, isArray: true }) @IsArray() @IsEnum(PropertyType, { each: true }) types!: PropertyType[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minBedrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minBathrooms?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) minAreaM2?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requiresGarage?: boolean;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) features!: string[];
}

export class FavoriteDto {
  @ApiProperty() @IsUUID() propertyId!: string;
}

export class InquiryDto {
  @ApiProperty() @IsUUID() propertyId!: string;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(4000) message!: string;
}

export class InquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus }) @IsEnum(InquiryStatus) status!: InquiryStatus;
}

export class VisitDto {
  @ApiProperty() @IsUUID() propertyId!: string;
  @ApiProperty() @IsDateString() scheduledAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class VisitStatusDto {
  @ApiProperty({ enum: VisitStatus }) @IsEnum(VisitStatus) status!: VisitStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}

export class OpportunityStageDto {
  @ApiProperty({ enum: OpportunityStage }) @IsEnum(OpportunityStage) stage!: OpportunityStage;
}

export class FollowUpDto {
  @ApiProperty() @IsUUID() opportunityId!: string;
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(2000) description!: string;
  @ApiProperty() @IsDateString() dueAt!: string;
}

export class FollowUpStatusDto {
  @ApiProperty({ enum: FollowUpStatus }) @IsEnum(FollowUpStatus) status!: FollowUpStatus;
}

export class OperationDto {
  @ApiProperty() @IsUUID() opportunityId!: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount!: number;
}

export class CommissionRateDto {
  @ApiProperty({ description: 'Porcentaje configurado por administración; de 0 a 100.' })
  @IsNumber() @Min(0) @Max(100) ratePercent!: number;
}

export class CommissionStatusDto {
  @ApiProperty({ enum: CommissionStatus }) @IsEnum(CommissionStatus) status!: CommissionStatus;
}

export class ReportQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}
