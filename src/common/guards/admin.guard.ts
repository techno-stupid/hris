import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userRole = request.userRole;
    const employee = request.employee;

    // Allow company admins and employee admins
    if (userRole === 'company_admin') {
      return true;
    }

    if (userRole === 'employee_admin' && employee?.isAdmin) {
      return true;
    }

    throw new ForbiddenException('Admin privileges required');
  }
}