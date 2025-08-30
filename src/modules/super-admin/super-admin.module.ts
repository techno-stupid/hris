import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { CompaniesModule } from '../companies/companies.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    CompaniesModule,
    SubscriptionsModule,
  ],
  controllers: [SuperAdminController],
})
export class SuperAdminModule {}