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
    // We can also check against a database table of super admins
    const superAdminEmails = this.configService.get('SUPER_ADMIN_EMAILS', '').split(',');
    
    if (!superAdminEmails.includes(user.email)) {
      throw new ForbiddenException('Access denied. Super admin privileges required.');
    }

    return true;
  }
}