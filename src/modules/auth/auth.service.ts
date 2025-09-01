import {
  Injectable,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.config';
import { LoginDto } from './dto/login.dto';
import { CompanyRepository } from '../companies/repositories/company.repository';
import { EmployeeRepository } from '../employees/repositories/employee.repository';
import { ConfigService } from '@nestjs/config';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private companyRepository: CompanyRepository,
    private employeeRepository: EmployeeRepository,
    private configService: ConfigService
  ) {}

  async login(loginDto: LoginDto) {
    try {
      const data = await this.supabaseService.signIn(
        loginDto.email,
        loginDto.password
      );

      if (!data || !data.session) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get user context
      const userContext: any = await this.getUserContext(
        data.user.id,
        data.user.email || loginDto.email
      );

      // Check subscription validity for company users
      if (
        userContext.companyId &&
        (userContext.type === 'company_admin' ||
          userContext.type === 'employee_admin' ||
          userContext.type === 'employee')
      ) {
        const company = await this.companyRepository.findOne(
          userContext.companyId
        );

        if (company && !company.isSubscriptionValid()) {
          throw new UnauthorizedException(
            'Your company subscription has expired. Please contact support to renew.'
          );
        }

        // Add subscription status to response
        userContext.subscriptionStatus = {
          isValid: company?.isSubscriptionValid() || false,
          expiresAt: company?.subscriptionEndDate,
          planName: company?.subscription?.name
        };
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email || loginDto.email,
          ...userContext
        }
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed: ' + error.message);
    }
  }

  async logout(token: string) {
    try {
      if (!token) {
        throw new BadRequestException('No token provided');
      }

      await this.supabaseService.signOut(token);
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new BadRequestException('Logout failed: ' + error.message);
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const data = await this.supabaseService.refreshToken(refreshToken);

      if (!data || !data.session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token refresh failed: ' + error.message);
    }
  }

  async validateUser(token: string) {
    try {
      const user = await this.supabaseService.verifyToken(token);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const userContext = await this.getUserContext(user.id, user.email || '');
      return {
        ...user,
        ...userContext
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Token validation failed: ' + error.message
      );
    }
  }

  private async getUserContext(supabaseUserId: string, email: string) {
    try {
      // First check if user is a super admin
      const superAdminEmails = this.configService
        .get<string>('SUPER_ADMIN_EMAILS', '')
        .split(',')
        .map((e) => e.trim());
      if (email && superAdminEmails.includes(email)) {
        return {
          type: 'super_admin',
          isSuperAdmin: true
        };
      }

      // Check if user is a company admin (by email)
      if (email) {
        const company = await this.companyRepository.findByEmail(email);
        if (company) {
          return {
            type: 'company_admin',
            companyId: company.id,
            companyName: company.name,
            subscription: {
              name: company.subscription?.name,
              maxEmployees: company.subscription?.maxEmployees
            }
          };
        }
      }

      // Check if user is an employee (by email first, then by supabaseUserId)
      let employee: Employee | null = null; // Explicitly type the variable

      if (email) {
        employee = await this.employeeRepository.findByEmail(email, '');
      }

      // If not found by email, try by supabaseUserId
      if (!employee && supabaseUserId) {
        employee =
          await this.employeeRepository.findBySupabaseId(supabaseUserId);
      }

      if (employee) {
        return {
          type: employee.isAdmin ? 'employee_admin' : 'employee',
          employeeId: employee.id,
          employeeName: employee.name,
          companyId: employee.company?.id,
          companyName: employee.company?.name,
          roles:
            employee.roles?.map((role) => ({
              id: role.id,
              name: role.name,
              permissions: role.permissions
            })) || []
        };
      }

      // User not found in our system
      return {
        type: 'unknown',
        message: 'User not associated with any company or employee account'
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        type: 'unknown',
        error: 'Failed to retrieve user context'
      };
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    try {
      // First verify the current password by trying to sign in
      const user =
        (await this.companyRepository.findBySupabaseId(userId)) ||
        (await this.employeeRepository.findBySupabaseId(userId));

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify current password
      await this.supabaseService.signIn(user.email, currentPassword);

      // Update password
      const result = await this.supabaseService.updateUser(userId, {
        password: newPassword
      });

      return {
        message: 'Password changed successfully',
        requiresNewLogin: true
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to change password: ' + error.message
      );
    }
  }

  async forgotPassword(email: string) {
    try {
      const client = this.supabaseService.getClient();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        throw new BadRequestException('Failed to send reset email');
      }

      return {
        message: 'Password reset email sent successfully',
        email
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to process password reset: ' + error.message
      );
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const client = this.supabaseService.getClient();
      const { error } = await client.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new BadRequestException('Failed to reset password');
      }

      return {
        message: 'Password reset successfully',
        requiresNewLogin: true
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to reset password: ' + error.message
      );
    }
  }
}
