import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: 'success', enum: ['success', 'error'] })
  status: 'success' | 'error';

  @ApiProperty({ example: 'Request successful' })
  message: string;

  @ApiProperty()
  data?: T;

  @ApiProperty({ example: '2025-08-30T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/resource' })
  path: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 'error' })
  status: 'error';

  @ApiProperty({ example: 'Bad Request' })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ required: false })
  errors?: any;

  @ApiProperty({ example: '2025-08-30T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/resource' })
  path: string;
}

export class PaginatedResponseDto<T = any> {
  @ApiProperty({ example: 'success' })
  status: 'success';

  @ApiProperty({ example: 'Resources retrieved successfully' })
  message: string;

  @ApiProperty()
  data: {
    items: T[];
    meta: {
      total: number;
      page: number;
      lastPage: number;
      perPage: number;
    };
  };

  @ApiProperty({ example: '2025-08-30T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/resource' })
  path: string;
}
