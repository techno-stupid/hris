import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { RoleRepository } from './repositories/role.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class RolesService {
  constructor(private roleRepository: RoleRepository) {}

  // Predefined permissions
  static readonly AVAILABLE_PERMISSIONS = [
    'view_employees',
    'create_employees',
    'edit_employees',
    'delete_employees',
    'view_roles',
    'create_roles',
    'edit_roles',
    'delete_roles',
    'assign_roles',
    'view_reports',
    'generate_reports',
    'view_company_settings',
    'edit_company_settings'
  ];

  async create(createRoleDto: CreateRoleDto, company: Company) {
    // Validate permissions
    this.validatePermissions(createRoleDto.permissions);

    // Check if role name already exists in company
    const existingRole = await this.roleRepository.findByName(
      createRoleDto.name,
      company.id
    );
    if (existingRole) {
      throw new BadRequestException('Role with this name already exists');
    }

    const role = await this.roleRepository.create({
      ...createRoleDto,
      company
    });

    return {
      id: role.id,
      name: role.name,
      permissions: role.permissions,
      description: role.description
    };
  }

  async findAllByCompany(companyId: string) {
    const roles = await this.roleRepository.findByCompany(companyId);
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions,
      description: role.description,
      createdAt: role.createdAt
    }));
  }

  async findOne(id: string, companyId: string) {
    const role = await this.roleRepository.findOne(id);
    if (!role || role.company.id !== companyId) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async findWithEmployees(id: string, companyId: string) {
    const role = await this.roleRepository.findWithEmployees(id, companyId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      permissions: role.permissions,
      description: role.description,
      employees: role.employees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email
      }))
    };
  }

  async update(id: string, companyId: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne(id);
    if (!role || role.company.id !== companyId) {
      throw new NotFoundException('Role not found');
    }

    if (updateRoleDto.permissions) {
      this.validatePermissions(updateRoleDto.permissions);
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findByName(
        updateRoleDto.name,
        companyId
      );
      if (existingRole) {
        throw new BadRequestException('Role with this name already exists');
      }
    }

    return await this.roleRepository.update(id, updateRoleDto);
  }

  async delete(id: string, companyId: string) {
    const role = await this.roleRepository.findWithEmployees(id, companyId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.employees && role.employees.length > 0) {
      throw new BadRequestException(
        `Cannot delete role. ${role.employees.length} employees are assigned to this role.`
      );
    }

    await this.roleRepository.delete(id);
    return { message: 'Role deleted successfully' };
  }

  async getAvailablePermissions() {
    return {
      permissions: RolesService.AVAILABLE_PERMISSIONS
    };
  }

  private validatePermissions(permissions: string[]) {
    const invalidPermissions = permissions.filter(
      (p) => !RolesService.AVAILABLE_PERMISSIONS.includes(p)
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Invalid permissions: ${invalidPermissions.join(', ')}`
      );
    }
  }
}
