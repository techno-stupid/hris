import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { ApiResponseDto, ApiErrorResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @SwaggerResponse({ 
    status: 200, 
    description: 'Login successful',
    type: ApiResponseDto,
  })
  @SwaggerResponse({ 
    status: 401, 
    description: 'Invalid credentials',
    type: ApiErrorResponseDto,
  })
  async login(@Body() loginDto: LoginDto) {
    // The response interceptor will wrap this automatically
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @SwaggerResponse({ 
    status: 200, 
    description: 'Logout successful',
    type: ApiResponseDto,
  })
  async logout(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @SwaggerResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    type: ApiResponseDto,
  })
  @SwaggerResponse({ 
    status: 401, 
    description: 'Invalid refresh token',
    type: ApiErrorResponseDto,
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}