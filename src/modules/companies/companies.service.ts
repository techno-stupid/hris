import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { CompanyRepository } from './repositories/company.repository';
import { SubscriptionRepository } from '../subscriptions/repositories/subscription.repository';
import { SupabaseService } from '../../config/supabase.config';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private companyRepository: CompanyRepository,
    private subscriptionRepository: SubscriptionRepository,
    private supabaseService: SupabaseService
  ) {}

  async create(createCompanyDto: CreateCompanyDto) {
    // Check if company email already exists
    const existingCompany = await this.companyRepository.findByEmail(
      createCompanyDto.email
    );
    if (existingCompany) {
      throw new BadRequestException('Company with this email already exists');
    }

    // Get subscription plan
    const subscription = await this.subscriptionRepository.findOne(
      createCompanyDto.subscriptionId
    );
    if (!subscription || !subscription.isActive) {
      throw new BadRequestException('Invalid or inactive subscription plan');
    }

    // Create Supabase user for company admin
    const supabaseUser = await this.supabaseService.createUser(
      createCompanyDto.email,
      createCompanyDto.password,
      { role: 'company_admin', company_name: createCompanyDto.name }
    );

    try {
      // Calculate subscription dates
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + subscription.durationMonths);

      // Create company with subscription dates
      const company = await this.companyRepository.create({
        name: createCompanyDto.name,
        email: createCompanyDto.email,
        supabaseUserId: supabaseUser.user.id,
        subscription,
        subscriptionStartDate: now,
        subscriptionEndDate: endDate
      });

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        subscription: {
          name: subscription.name,
          maxEmployees: subscription.maxEmployees,
          validUntil: endDate
        }
      };
    } catch (error) {
      // Rollback Supabase user if company creation fails
      await this.supabaseService.deleteUser(supabaseUser.user.id);
      throw new BadRequestException('Failed to create company');
    }
  }

  async renewSubscription(companyId: string, months?: number) {
    const company = await this.companyRepository.findOne(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const renewalMonths = months || company.subscription.durationMonths || 1;

    // If subscription hasn't expired, add to existing end date
    // Otherwise, start from today
    const startDate =
      company.subscriptionEndDate && company.isSubscriptionValid()
        ? new Date(company.subscriptionEndDate)
        : new Date();

    const newEndDate = new Date(startDate);
    newEndDate.setMonth(newEndDate.getMonth() + renewalMonths);

    await this.companyRepository.update(companyId, {
      subscriptionEndDate: newEndDate,
      subscriptionStartDate: company.subscriptionStartDate || new Date()
    });

    return {
      message: 'Subscription renewed successfully',
      newExpiryDate: newEndDate
    };
  }

  async changeSubscriptionPlan(
    companyId: string,
    subscriptionId: string,
    startDate: Date,
    endDate: Date
  ) {
    const subscription =
      await this.subscriptionRepository.findOne(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription plan not found');
    }

    await this.companyRepository.update(companyId, {
      subscription,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate
    });

    const updated = await this.companyRepository.findOne(companyId);
    return updated;
  }

  async findExpiringCompanies(days: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    // Get all companies with their subscription info
    const companies = await this.companyRepository.findActiveCompanies();

    return companies
      .filter((company) => {
        if (!company.subscriptionEndDate) return false;
        const endDate = new Date(company.subscriptionEndDate);
        return endDate <= expiryDate && endDate >= new Date();
      })
      .map((company) => ({
        id: company.id,
        name: company.name,
        email: company.email,
        subscriptionPlan: company.subscription?.name,
        subscriptionEndDate: company.subscriptionEndDate,
        daysRemaining: Math.floor(
          (new Date(company.subscriptionEndDate).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      }));
  }

  async findAll() {
    const companies = await this.companyRepository.findActiveCompanies();
    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      email: company.email,
      subscription: company.subscription?.name,
      subscriptionStartDate: company.subscriptionStartDate,
      subscriptionEndDate: company.subscriptionEndDate,
      isSubscriptionValid: company.isSubscriptionValid(),
      createdAt: company.createdAt
    }));
  }

  async findOne(id: string) {
    const company = await this.companyRepository.findWithEmployees(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async getStats(id: string) {
    const stats = await this.companyRepository.getCompanyStats(id);
    if (!stats) {
      throw new NotFoundException('Company not found');
    }
    return stats;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.companyRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (updateCompanyDto.subscriptionId) {
      const subscription = await this.subscriptionRepository.findOne(
        updateCompanyDto.subscriptionId
      );
      if (!subscription || !subscription.isActive) {
        throw new BadRequestException('Invalid or inactive subscription plan');
      }
      updateCompanyDto['subscription'] = subscription;
      delete updateCompanyDto.subscriptionId;
    }

    return await this.companyRepository.update(id, updateCompanyDto);
  }

  async delete(id: string) {
    const company = await this.companyRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Soft delete
    await this.companyRepository.softDelete(id);

    // Optionally disable Supabase user
    await this.supabaseService.updateUser(company.supabaseUserId, {
      banned: true
    });

    return { message: 'Company deleted successfully' };
  }
}
