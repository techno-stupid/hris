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
      // Create company
      const company = await this.companyRepository.create({
        name: createCompanyDto.name,
        email: createCompanyDto.email,
        supabaseUserId: supabaseUser.user.id,
        subscription
      });

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        subscription: {
          name: subscription.name,
          maxEmployees: subscription.maxEmployees
        }
      };
    } catch (error) {
      // Rollback Supabase user if company creation fails
      await this.supabaseService.deleteUser(supabaseUser.user.id);
      throw new BadRequestException('Failed to create company');
    }
  }

  async findAll() {
    const companies = await this.companyRepository.findActiveCompanies();
    return companies.map((company) => ({
      id: company.id,
      name: company.name,
      email: company.email,
      subscription: company.subscription?.name,
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
