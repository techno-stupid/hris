import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CompanyRepository } from '../../modules/companies/repositories/company.repository';
import { EmployeeRepository } from '../../modules/employees/repositories/employee.repository';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private companyRepository: CompanyRepository,
    private employeeRepository: EmployeeRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const companyId = request.params.companyId || request.headers['x-company-id'];

    if (!user || !companyId) {
      throw new ForbiddenException('Missing authentication or company information');
    }

    // Check if user is a company admin
    const company = await this.companyRepository.findBySupabaseId(user.id);
    if (company && company.id === companyId) {
      request.company = company;
      request.userRole = 'company_admin';
      return true;
    }

    // Check if user is an employee of the company
    const employee = await this.employeeRepository.findBySupabaseId(user.id);
    if (employee && employee.company.id === companyId) {
      request.company = employee.company;
      request.employee = employee;
      request.userRole = employee.isAdmin ? 'employee_admin' : 'employee';
      return true;
    }

    throw new ForbiddenException('Access denied to this company');
  }
}