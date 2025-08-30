import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
  ) {}

  async create(createSubscriptionPlanDto: CreateSubscriptionPlanDto) {
    // Check if plan name already exists
    const existingPlan = await this.subscriptionRepository.findByName(
      createSubscriptionPlanDto.name
    );
    if (existingPlan) {
      throw new BadRequestException('Subscription plan with this name already exists');
    }

    const plan = await this.subscriptionRepository.create(createSubscriptionPlanDto);

    return {
      id: plan.id,
      name: plan.name,
      maxEmployees: plan.maxEmployees,
      price: plan.price,
      description: plan.description,
      isActive: plan.isActive,
    };
  }

  async findAll() {
    const plans = await this.subscriptionRepository.findActive();
    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      maxEmployees: plan.maxEmployees,
      price: plan.price,
      description: plan.description,
      isActive: plan.isActive,
    }));
  }

  async findOne(id: string) {
    const plan = await this.subscriptionRepository.findOne(id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }

  async getStats(id: string) {
    const stats = await this.subscriptionRepository.getSubscriptionStats(id);
    if (!stats) {
      throw new NotFoundException('Subscription plan not found');
    }
    return stats;
  }

  async update(id: string, updateSubscriptionPlanDto: UpdateSubscriptionPlanDto) {
    const plan = await this.subscriptionRepository.findOne(id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (updateSubscriptionPlanDto.name && updateSubscriptionPlanDto.name !== plan.name) {
      const existingPlan = await this.subscriptionRepository.findByName(
        updateSubscriptionPlanDto.name
      );
      if (existingPlan) {
        throw new BadRequestException('Subscription plan with this name already exists');
      }
    }

    return await this.subscriptionRepository.update(id, updateSubscriptionPlanDto);
  }

  async delete(id: string) {
    const plan = await this.subscriptionRepository.findWithCompanies(id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (plan.companies && plan.companies.length > 0) {
      throw new BadRequestException(
        `Cannot delete subscription plan. ${plan.companies.length} companies are using this plan.`
      );
    }

    // Soft delete by deactivating
    await this.subscriptionRepository.update(id, { isActive: false });
    return { message: 'Subscription plan deactivated successfully' };
  }

  async getComparison() {
    const plans = await this.subscriptionRepository.findActive();
    
    return {
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        maxEmployees: plan.maxEmployees,
        price: plan.price,
        description: plan.description,
        features: this.getPlanFeatures(plan.maxEmployees),
      })),
    };
  }

  private getPlanFeatures(maxEmployees: number): string[] {
    const features = ['Employee Management', 'Role Management', 'Basic Reports'];
    
    if (maxEmployees > 10) {
      features.push('Advanced Reports', 'Multiple Admins');
    }
    
    if (maxEmployees > 50) {
      features.push('API Access', 'Custom Integrations', 'Priority Support');
    }
    
    if (maxEmployees > 100) {
      features.push('Dedicated Account Manager', 'Custom Features', 'SLA');
    }
    
    return features;
  }
}