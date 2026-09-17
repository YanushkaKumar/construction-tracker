import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsEmail,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum ProjectStatusDto {
  PENDING = 'PENDING',
  PLANNING = 'PLANNING',
  UPCOMING = 'UPCOMING',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum PriorityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Whitelists exactly what a client may set on a project.
 *
 * Everything here reaches `prisma.project.create` directly, so fields the
 * system owns are deliberately absent: `companyId` and `code` are derived
 * server-side, and the running totals (`budgetActual`, `progressPercent`)
 * are maintained by the finance/progress flows rather than set by the caller.
 */
export class CreateProjectDto {
  @ApiProperty({ example: 'Kandy Villa' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  clientPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetEstimate?: number;

  @ApiPropertyOptional({ example: 5500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  contractValue?: number;

  @ApiPropertyOptional({ example: 'LKR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ enum: ProjectStatusDto })
  @IsOptional()
  @IsEnum(ProjectStatusDto)
  status?: ProjectStatusDto;

  @ApiPropertyOptional({ enum: PriorityDto })
  @IsOptional()
  @IsEnum(PriorityDto)
  priority?: PriorityDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ example: 45, description: 'Completion percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent?: number;
}
