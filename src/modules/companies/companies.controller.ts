import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CompanyContextGuard } from '../../common/guards/company-context.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { EmployeesService } from '../employees/employees.service';
import { RolesService } from '../roles/roles.service';
import { CompaniesService } from './companies.service';
import { CreateEmployeeDto } from '../employees/dto/create-employee.dto';
import { UpdateEmployeeDto } from '../employees/dto/update-employee.dto';
import { AssignRoleDto } from '../employees/dto/assign-role.dto';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { CurrentCompany, CurrentCompanyId, UserRole } from '../../common/decorators/company-context.decorator';
import { Company } from './entities/company.entity';

@ApiTags('Company Management')
@ApiBearerAuth()
@Controller('company')  // Changed from 'companies/:companyId' to just 'company'
@UseGuards(AuthGuard, CompanyContextGuard)  // CompanyContextGuard automatically sets the company
export class CompanyController {
  constructor(
    private employeesService: EmployeesService,
    private rolesService: RolesService,
    private companiesService: CompaniesService,
  ) {}

  // ============ Company Info ============

  @Get('profile')
  @ApiOperation({ summary: 'Get current company profile' })
  async getCompanyProfile(@CurrentCompany() company: Company) {
    return this.companiesService.findOne(company.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get company statistics' })
  async getCompanyStats(@CurrentCompanyId() companyId: string) {
    return this.companiesService.getStats(companyId);
  }

  // ============ Employee Management ============

  @Post('employees')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create new employee' })
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentCompany() company: Company,
  ) {
    return this.employeesService.create(createEmployeeDto, company);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get all employees in the company' })
  async getAllEmployees(@CurrentCompanyId() companyId: string) {
    return this.employeesService.findAllByCompany(companyId);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  async getEmployee(
    @Param('id') id: string,
    @CurrentCompanyId() companyId: string,
  ) {
    return this.employeesService.findOne(id, companyId);
  }

  @Put('employees/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update employee' })
  async updateEmployee(
    @Param('id') id: string,
    @CurrentCompanyId() companyId: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, companyId, updateEmployeeDto);
  }

  @Delete('employees/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete employee' })
  async deleteEmployee(
    @Param('id') id: string,
    @CurrentCompanyId() companyId: string,
  ) {
    return this.employeesService.delete(id, companyId);
  }

  @Post('employees/:employeeId/roles')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Assign role to employee' })
  async assignRole(
    @Param('employeeId') employeeId: string,
    @CurrentCompanyId() companyId: string,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.employeesService.assignRole(employeeId, assignRoleDto, companyId);
  }

  @Delete('employees/:employeeId/roles/:roleId')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove role from employee' })
  async removeRole(
    @Param('employeeId') employeeId: string,
    @Param('roleId') roleId: string,
    @CurrentCompanyId() companyId: string,
  ) {
    return this.employeesService.removeRole(employeeId, roleId, companyId);
  }

  // ============ Role Management ============

  @Post('roles')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create new role' })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentCompany() company: Company,
  ) {
    return this.rolesService.create(createRoleDto, company);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles in the company' })
  async getAllRoles(@CurrentCompanyId() companyId: string) {
    return this.rolesService.findAllByCompany(companyId);
  }

  @Get('roles/permissions')
  @ApiOperation({ summary: 'Get available permissions' })
  async getAvailablePermissions() {
    return this.rolesService.getAvailablePermissions();
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  async getRole(
    @Param('id') id: string,
    @CurrentCompanyId() companyId: string,
  ) {
    return this.rolesService.findOne(id, companyId);
  }

  @Get('roles/:id/employees')
  @ApiOperation({ summary: 'Get employees with this role' })
  async getRoleEmployees(
    @Param('id') id: string,
    @CurrentCompanyId() companyId: string,
  ) {
    return this.rolesService.findWithEmployees(id, companyId);
  }

  @Put('roles/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update role' })
  async updateRole(
    @Param('id') id: string,
    @CurrentCompanyId() companyId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, companyId, updateRoleDto);
  }

  @Delete('roles/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  async deleteRole(
    @Param('id') id: string,
    @CurrentCompanyId() companyId: string,
  ) {
    return this.rolesService.delete(id, companyId);
  }
}