import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const employee = request.employee;

    if (!employee) {
      throw new ForbiddenException('Employee context required');
    }

    // Company admin has all permissions
    if (request.userRole === 'company_admin') {
      return true;
    }

    // Check employee permissions through roles
    const employeePermissions = new Set<string>();
    
    if (employee.roles) {
      employee.roles.forEach(role => {
        role.permissions.forEach(permission => {
          employeePermissions.add(permission);
        });
      });
    }

    const hasPermission = requiredPermissions.some(permission => 
      employeePermissions.has(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Required permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}