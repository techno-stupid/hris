import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentEmployee } from '../../common/decorators/current-user.decorator';
import { Employee } from './entities/employee.entity';

@ApiTags('Employee')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(AuthGuard, TenantGuard)
export class EmployeeController {
  @Get('profile')
  @ApiOperation({ summary: 'Get current employee profile' })
  async getProfile(@CurrentEmployee() employee: Employee) {
    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      isAdmin: employee.isAdmin,
      roles:
        employee.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          permissions: role.permissions
        })) || [],
      company: {
        id: employee.company.id,
        name: employee.company.name
      }
    };
  }
}
