import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { SubscriptionPlan } from '../../modules/subscriptions/entities/subscription-plan.entity';
import { Company } from '../../modules/companies/entities/company.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { AuthModule } from '../../modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      Company,
      Employee,
      Role,
    ]),
    AuthModule,
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}