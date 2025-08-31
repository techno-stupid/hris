import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

@Injectable()
export class SubscriptionRepository extends BaseRepository<SubscriptionPlan> {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionRepo: Repository<SubscriptionPlan>
  ) {
    super(subscriptionRepo);
  }

  async findActive(): Promise<SubscriptionPlan[]> {
    return await this.subscriptionRepo.find({
      where: { isActive: true },
      order: { price: 'ASC' }
    });
  }

  async findByName(name: string): Promise<SubscriptionPlan | null> {
    return await this.subscriptionRepo.findOne({
      where: { name }
    });
  }

  async findWithCompanies(id: string): Promise<SubscriptionPlan | null> {
    return await this.subscriptionRepo.findOne({
      where: { id },
      relations: ['companies']
    });
  }

  async getSubscriptionStats(id: string): Promise<any> {
    const plan = await this.subscriptionRepo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.companies', 'companies')
      .where('plan.id = :id', { id })
      .getOne();

    if (!plan) return null;

    return {
      id: plan.id,
      name: plan.name,
      companiesCount: plan.companies?.length || 0,
      maxEmployees: plan.maxEmployees,
      price: plan.price,
      revenue: plan.price * (plan.companies?.length || 0)
    };
  }
}
