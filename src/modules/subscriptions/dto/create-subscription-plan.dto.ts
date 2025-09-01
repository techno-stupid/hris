import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Basic Plan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(1)
  maxEmployees: number;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 12, description: 'Subscription duration in months' })
  @IsNumber()
  @Min(1)
  durationMonths: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
