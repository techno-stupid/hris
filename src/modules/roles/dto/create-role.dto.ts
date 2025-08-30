import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'HR Manager' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['view_employees', 'edit_employees', 'create_employees'] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}