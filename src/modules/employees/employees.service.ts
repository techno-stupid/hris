import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { EmployeeRepository } from './repositories/employee.repository';
import { RoleRepository } from '../roles/repositories/role.repository';
import { CompanyRepository } from '../companies/repositories/company.repository';
import { SupabaseService } from '../../config/supabase.config';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class EmployeesService {
  constructor(
    private employeeRepository: EmployeeRepository,
    private roleRepository: RoleRepository,
    private companyRepository: CompanyRepository,
    private supabaseService: SupabaseService
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto, company: Company) {
    // Check employee limit
    const employeeCount = await this.employeeRepository.countByCompany(
      company.id
    );
    if (employeeCount >= company.subscription.maxEmployees) {
      throw new ForbiddenException(
        `Employee limit reached. Maximum allowed: ${company.subscription.maxEmployees}`
      );
    }

    // Check if email already exists in company
    const existingEmployee = await this.employeeRepository.findByEmail(
      createEmployeeDto.email,
      company.id
    );
    if (existingEmployee) {
      throw new BadRequestException(
        'Employee with this email already exists in the company'
      );
    }

    // Create Supabase user
    const supabaseUser = await this.supabaseService.createUser(
      createEmployeeDto.email,
      createEmployeeDto.password,
      {
        role: createEmployeeDto.isAdmin ? 'employee_admin' : 'employee',
        company_id: company.id,
        company_name: company.name
      }
    );

    try {
      // Create employee
      const employee = await this.employeeRepository.create({
        name: createEmployeeDto.name,
        email: createEmployeeDto.email,
        isAdmin: createEmployeeDto.isAdmin || false,
        supabaseUserId: supabaseUser.user.id,
        company
      });

      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        isAdmin: employee.isAdmin,
        companyId: company.id
      };
    } catch (error) {
      // Rollback Supabase user if employee creation fails
      await this.supabaseService.deleteUser(supabaseUser.user.id);
      throw new BadRequestException('Failed to create employee');
    }
  }

  async findAllByCompany(companyId: string) {
    const employees = await this.employeeRepository.findAllByCompany(companyId);
    return employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      isAdmin: emp.isAdmin,
      roles:
        emp.roles?.map((role) => ({
          id: role.id,
          name: role.name
        })) || [],
      isActive: emp.isActive
    }));
  }

  async findOne(id: string, companyId: string) {
    const employee = await this.employeeRepository.findWithRoles(id, companyId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async update(
    id: string,
    companyId: string,
    updateEmployeeDto: UpdateEmployeeDto
  ) {
    const employee = await this.employeeRepository.findOne(id);
    if (!employee || employee.company.id !== companyId) {
      throw new NotFoundException('Employee not found');
    }

    return await this.employeeRepository.update(id, updateEmployeeDto);
  }

  async assignRole(
    employeeId: string,
    assignRoleDto: AssignRoleDto,
    companyId: string
  ) {
    const employee = await this.employeeRepository.findWithRoles(
      employeeId,
      companyId
    );
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const role = await this.roleRepository.findOne(assignRoleDto.roleId);
    if (!role || role.company.id !== companyId) {
      throw new NotFoundException('Role not found');
    }

    // Check if role already assigned
    if (employee.roles.some((r) => r.id === role.id)) {
      throw new BadRequestException('Role already assigned to employee');
    }

    employee.roles.push(role);
    await this.employeeRepository.getRepository().save(employee);

    return {
      message: 'Role assigned successfully',
      employee: {
        id: employee.id,
        name: employee.name,
        roles: employee.roles.map((r) => ({ id: r.id, name: r.name }))
      }
    };
  }

  async removeRole(employeeId: string, roleId: string, companyId: string) {
    const employee = await this.employeeRepository.removeRole(
      employeeId,
      roleId
    );
    if (!employee) {
      throw new NotFoundException('Employee or role not found');
    }

    return {
      message: 'Role removed successfully',
      employee: {
        id: employee.id,
        name: employee.name,
        roles: employee.roles.map((r) => ({ id: r.id, name: r.name }))
      }
    };
  }

  async delete(id: string, companyId: string) {
    const employee = await this.employeeRepository.findOne(id);
    if (!employee || employee.company.id !== companyId) {
      throw new NotFoundException('Employee not found');
    }

    // Soft delete employee
    await this.employeeRepository.update(id, { isActive: false });

    // Disable Supabase user
    if (employee.supabaseUserId) {
      await this.supabaseService.updateUser(employee.supabaseUserId, {
        banned: true
      });
    }

    return { message: 'Employee deleted successfully' };
  }
}
