import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user email matches super admin email from config
    const superAdminEmails = this.configService.get<string>('SUPER_ADMIN_EMAILS', '')
      .split(',')
      .map(email => email.trim())
      .filter(email => email); // Remove empty strings
    
    if (!user.email || !superAdminEmails.includes(user.email)) {
      throw new ForbiddenException('Access denied. Super admin privileges required.');
    }

    request.isSuperAdmin = true;
    return true;
  }
}