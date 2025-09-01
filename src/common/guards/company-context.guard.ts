import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { CompanyRepository } from '../../modules/companies/repositories/company.repository';
import { EmployeeRepository } from '../../modules/employees/repositories/employee.repository';
import { ConfigService } from '@nestjs/config';
import { Employee } from '../../modules/employees/entities/employee.entity';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  constructor(
    private companyRepository: CompanyRepository,
    private employeeRepository: EmployeeRepository,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is a super admin
    const superAdminEmails = this.configService
      .get<string>('SUPER_ADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim());
    if (user.email && superAdminEmails.includes(user.email)) {
      request.userRole = 'super_admin';
      request.isSuperAdmin = true;
      // Super admin doesn't have a default company
      throw new ForbiddenException(
        'Super admin is not associated with any company'
      );
    }

    // Check if user is a company admin
    if (user.email) {
      const company = await this.companyRepository.findByEmail(user.email);
      if (company) {
        request.company = company;
        request.companyId = company.id;
        request.userRole = 'company_admin';
        return true;
      }
    }

    // Check if user is an employee
    let employee: Employee | null = null;

    if (user.email) {
      employee = await this.employeeRepository.findByEmail(user.email);
    }

    if (!employee && user.id) {
      employee = await this.employeeRepository.findBySupabaseId(user.id);
    }

    if (employee && employee.company) {
      request.company = employee.company;
      request.companyId = employee.company.id;
      request.employee = employee;
      request.userRole = employee.isAdmin ? 'employee_admin' : 'employee';
      return true;
    }

    throw new ForbiddenException('User is not associated with any company');
  }
}
