import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsDateString
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  subscriptionStartDate?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  subscriptionEndDate?: Date;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
