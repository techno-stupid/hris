import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../../modules/subscriptions/entities/subscription-plan.entity';
import { Company } from '../../modules/companies/entities/company.entity';
import { Employee } from '../../modules/employees/entities/employee.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { SupabaseService } from '../../config/supabase.config';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const shouldSeed = this.configService.get('SEED_DATABASE', 'false') === 'true';
    
    if (shouldSeed) {
      await this.seed();
    }
  }

  async seed() {
    this.logger.log('Starting database seeding...');

    try {
      // Check if already seeded
      const existingPlans = await this.subscriptionRepo.count();
      if (existingPlans > 0) {
        this.logger.log('Database already seeded, skipping...');
        return;
      }

      // 1. Create Subscription Plans
      const plans = await this.createSubscriptionPlans();
      this.logger.log(`Created ${plans.length} subscription plans`);

      // 2. Create Demo Company with Admin
      const company = await this.createDemoCompany(plans[1]); // Use Standard plan
      this.logger.log(`Created demo company: ${company.name}`);

      // 3. Create Roles for the company
      const roles = await this.createDefaultRoles(company);
      this.logger.log(`Created ${roles.length} default roles`);

      // 4. Create Demo Employees
      const employees = await this.createDemoEmployees(company, roles);
      this.logger.log(`Created ${employees.length} demo employees`);

      this.logger.log('Database seeding completed successfully!');
      this.logger.log('');
      this.logger.log('=== Login Credentials ===');
      this.logger.log('Super Admin: Use email from SUPER_ADMIN_EMAILS in .env');
      this.logger.log('Company Admin: admin@demo-company.com / Demo@123456');
      this.logger.log('Employee Admin: john.admin@demo-company.com / Demo@123456');
      this.logger.log('Regular Employee: jane.doe@demo-company.com / Demo@123456');
      this.logger.log('========================');
    } catch (error) {
      this.logger.error('Seeding failed:', error);
    }
  }

  private async createSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const plansData = [
      {
        name: 'Starter',
        maxEmployees: 10,
        price: 49.99,
        description: 'Perfect for small startups and teams',
      },
      {
        name: 'Standard',
        maxEmployees: 50,
        price: 149.99,
        description: 'Great for growing businesses',
      },
      {
        name: 'Professional',
        maxEmployees: 200,
        price: 399.99,
        description: 'For established companies',
      },
      {
        name: 'Enterprise',
        maxEmployees: 1000,
        price: 999.99,
        description: 'Unlimited features for large organizations',
      },
    ];

    const plans: SubscriptionPlan[] = [];
    for (const planData of plansData) {
      const plan = this.subscriptionRepo.create(planData);
      plans.push(await this.subscriptionRepo.save(plan));
    }

    return plans;
  }

  private async createDemoCompany(subscription: SubscriptionPlan): Promise<Company> {
    const email = 'admin@demo-company.com';
    const password = 'Demo@123456';

    // Create Supabase user if configured
    let supabaseUserId = `demo-admin-${Date.now()}`;
    
    if (this.supabaseService.isSupabaseConfigured()) {
      try {
        const supabaseUser = await this.supabaseService.createUser(
          email,
          password,
          { role: 'company_admin', company_name: 'Demo Company' }
        );
        supabaseUserId = supabaseUser.user.id;
      } catch (error) {
        this.logger.warn('Could not create Supabase user, using mock ID');
      }
    }

    const company = this.companyRepo.create({
      name: 'Demo Company',
      email,
      supabaseUserId,
      subscription,
      isActive: true,
    });

    return await this.companyRepo.save(company);
  }

  private async createDefaultRoles(company: Company): Promise<Role[]> {
    const rolesData = [
      {
        name: 'HR Manager',
        permissions: [
          'view_employees',
          'create_employees',
          'edit_employees',
          'delete_employees',
          'view_roles',
          'assign_roles',
          'view_reports',
          'generate_reports',
        ],
        description: 'Full HR management capabilities',
        company,
      },
      {
        name: 'Team Lead',
        permissions: [
          'view_employees',
          'edit_employees',
          'view_roles',
          'view_reports',
        ],
        description: 'Team management capabilities',
        company,
      },
      {
        name: 'Employee',
        permissions: [
          'view_employees',
          'view_reports',
        ],
        description: 'Basic employee access',
        company,
      },
    ];

    const roles: Role[] = [];
    for (const roleData of rolesData) {
      const role = this.roleRepo.create(roleData);
      roles.push(await this.roleRepo.save(role));
    }

    return roles;
  }

  private async createDemoEmployees(company: Company, roles: Role[]): Promise<Employee[]> {
    const employeesData = [
      {
        name: 'John Admin',
        email: 'john.admin@demo-company.com',
        password: 'Demo@123456',
        isAdmin: true,
        role: roles[0], // HR Manager
      },
      {
        name: 'Jane Doe',
        email: 'jane.doe@demo-company.com',
        password: 'Demo@123456',
        isAdmin: false,
        role: roles[2], // Employee
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@demo-company.com',
        password: 'Demo@123456',
        isAdmin: false,
        role: roles[1], // Team Lead
      },
    ];

    const employees: Employee[] = [];
    
    for (const empData of employeesData) {
      let supabaseUserId = `demo-employee-${Date.now()}-${Math.random()}`;
      
      if (this.supabaseService.isSupabaseConfigured()) {
        try {
          const supabaseUser = await this.supabaseService.createUser(
            empData.email,
            empData.password,
            { 
              role: empData.isAdmin ? 'employee_admin' : 'employee',
              company_id: company.id,
              company_name: company.name,
            }
          );
          supabaseUserId = supabaseUser.user.id;
        } catch (error) {
          this.logger.warn(`Could not create Supabase user for ${empData.email}`);
        }
      }

      const employee = this.employeeRepo.create({
        name: empData.name,
        email: empData.email,
        supabaseUserId,
        isAdmin: empData.isAdmin,
        company,
        roles: [empData.role],
        isActive: true,
      });

      employees.push(await this.employeeRepo.save(employee));
    }

    return employees;
  }
}