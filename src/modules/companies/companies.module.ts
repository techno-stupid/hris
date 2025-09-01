import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyRepository } from './repositories/company.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EmployeesModule } from '../employees/employees.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    SubscriptionsModule,
    forwardRef(() => EmployeesModule),
    forwardRef(() => RolesModule)
  ],
  controllers: [CompanyController], // Use the refactored controller
  providers: [CompaniesService, CompanyRepository],
  exports: [CompaniesService, CompanyRepository]
})
export class CompaniesModule {}
