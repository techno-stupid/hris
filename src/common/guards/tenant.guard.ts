// src/common/guards/tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CompanyRepository } from '../../modules/companies/repositories/company.repository';
import { EmployeeRepository } from '../../modules/employees/repositories/employee.repository';
import { ConfigService } from '@nestjs/config';
import { Employee } from '../../modules/employees/entities/employee.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private companyRepository: CompanyRepository,
    private employeeRepository: EmployeeRepository,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const companyId = request.params.companyId || request.headers['x-company-id'];

    if (!user || !companyId) {
      throw new ForbiddenException('Missing authentication or company information');
    }

    // Check if user is a super admin (they can access any company)
    const superAdminEmails = this.configService.get<string>('SUPER_ADMIN_EMAILS', '').split(',').map(e => e.trim());
    if (user.email && superAdminEmails.includes(user.email)) {
      // Super admin can access any company
      const company = await this.companyRepository.findOne(companyId);
      if (!company) {
        throw new ForbiddenException('Company not found');
      }
      request.company = company;
      request.userRole = 'super_admin';
      return true;
    }

    // Check if user is a company admin (by email)
    if (user.email) {
      const company = await this.companyRepository.findByEmail(user.email);
      if (company && company.id === companyId) {
        request.company = company;
        request.userRole = 'company_admin';
        return true;
      }
    }

    // Check if user is an employee of the company (by email first)
    let employee: Employee | null = null;  // Explicitly type the variable
    
    if (user.email) {
      employee = await this.employeeRepository.findByEmail(user.email);
    }

    // If not found by email, try by supabaseUserId
    if (!employee && user.id) {
      employee = await this.employeeRepository.findBySupabaseId(user.id);
    }

    if (employee && employee.company && employee.company.id === companyId) {
      request.company = employee.company;
      request.employee = employee;
      request.userRole = employee.isAdmin ? 'employee_admin' : 'employee';
      return true;
    }

    throw new ForbiddenException('Access denied to this company');
  }
}