import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { EmployeeRepository } from './repositories/employee.repository';
import { CompaniesModule } from '../companies/companies.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]),
    forwardRef(() => CompaniesModule),
    forwardRef(() => RolesModule)
  ],
  controllers: [EmployeeController],
  providers: [EmployeesService, EmployeeRepository],
  exports: [EmployeesService, EmployeeRepository]
})
export class EmployeesModule {}
