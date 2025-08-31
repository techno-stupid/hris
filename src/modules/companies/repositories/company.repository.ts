import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Company } from '../entities/company.entity';

@Injectable()
export class CompanyRepository extends BaseRepository<Company> {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>
  ) {
    super(companyRepo);
  }

  async findByEmail(email: string): Promise<Company | null> {
    return await this.companyRepo.findOne({
      where: { email },
      relations: ['subscription']
    });
  }

  async findBySupabaseId(supabaseUserId: string): Promise<Company | null> {
    return await this.companyRepo.findOne({
      where: { supabaseUserId },
      relations: ['subscription']
    });
  }

  async findWithEmployees(id: string): Promise<Company | null> {
    return await this.companyRepo.findOne({
      where: { id },
      relations: ['employees', 'subscription']
    });
  }

  async findWithRoles(id: string): Promise<Company | null> {
    return await this.companyRepo.findOne({
      where: { id },
      relations: ['roles', 'subscription']
    });
  }

  async findActiveCompanies(): Promise<Company[]> {
    return await this.companyRepo.find({
      where: { isActive: true },
      relations: ['subscription']
    });
  }

  async getCompanyStats(id: string): Promise<any> {
    const company = await this.companyRepo
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.employees', 'employees')
      .leftJoinAndSelect('company.roles', 'roles')
      .leftJoinAndSelect('company.subscription', 'subscription')
      .where('company.id = :id', { id })
      .getOne();

    if (!company) return null;

    return {
      id: company.id,
      name: company.name,
      employeeCount: company.employees?.length || 0,
      roleCount: company.roles?.length || 0,
      maxEmployees: company.subscription?.maxEmployees || 0,
      subscriptionPlan: company.subscription?.name || 'None'
    };
  }
}
