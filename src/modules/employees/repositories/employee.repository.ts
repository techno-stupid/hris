// src/modules/employees/repositories/employee.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Employee } from '../entities/employee.entity';

@Injectable()
export class EmployeeRepository extends BaseRepository<Employee> {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>
  ) {
    super(employeeRepo);
  }

  // DON'T override findOne - it's already in BaseRepository
  // The base findOne(id: string) method is what EmployeesService uses

  async findByEmail(
    email: string,
    companyId?: string
  ): Promise<Employee | null> {
    const whereCondition: any = { email };
    if (companyId) {
      whereCondition.company = { id: companyId };
    }

    return await this.employeeRepo.findOne({
      where: whereCondition,
      relations: ['roles', 'company']
    });
  }

  async findBySupabaseId(supabaseUserId: string): Promise<Employee | null> {
    return await this.employeeRepo.findOne({
      where: { supabaseUserId },
      relations: ['roles', 'company']
    });
  }

  async findAllByCompany(companyId: string): Promise<Employee[]> {
    return await this.employeeRepo.find({
      where: { company: { id: companyId } },
      relations: ['roles']
    });
  }

  async findAdminsByCompany(companyId: string): Promise<Employee[]> {
    return await this.employeeRepo.find({
      where: {
        company: { id: companyId },
        isAdmin: true
      },
      relations: ['roles']
    });
  }

  async findWithRoles(id: string, companyId: string): Promise<Employee | null> {
    return await this.employeeRepo.findOne({
      where: {
        id,
        company: { id: companyId }
      },
      relations: ['roles', 'company']
    });
  }

  async countByCompany(companyId: string): Promise<number> {
    return await this.employeeRepo.count({
      where: { company: { id: companyId } }
    });
  }

  async assignRole(
    employeeId: string,
    roleId: string
  ): Promise<Employee | null> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['roles']
    });

    if (!employee) return null;

    // This would need the Role entity to be properly loaded
    // Implementation would depend on your specific needs
    return employee;
  }

  async removeRole(
    employeeId: string,
    roleId: string
  ): Promise<Employee | null> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['roles']
    });

    if (!employee) return null;

    employee.roles = employee.roles.filter((role) => role.id !== roleId);
    return await this.employeeRepo.save(employee);
  }

  // Add this method with a different name to avoid conflict
  async findOneWithOptions(
    options: FindOneOptions<Employee>
  ): Promise<Employee | null> {
    return await this.employeeRepo.findOne(options);
  }
}
