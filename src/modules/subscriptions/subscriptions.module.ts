import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { SubscriptionRepository } from './repositories/subscription.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan])],
  providers: [SubscriptionsService, SubscriptionRepository],
  exports: [SubscriptionsService, SubscriptionRepository]
})
export class SubscriptionsModule {}
