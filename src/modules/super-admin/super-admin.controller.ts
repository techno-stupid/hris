import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CompaniesService } from '../companies/companies.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateCompanyDto } from '../companies/dto/create-company.dto';
import { UpdateCompanyDto } from '../companies/dto/update-company.dto';
import { CreateSubscriptionPlanDto } from '../subscriptions/dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from '../subscriptions/dto/update-subscription-plan.dto';

@ApiTags('Super Admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(AuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(
    private companiesService: CompaniesService,
    private subscriptionsService: SubscriptionsService
  ) {}

  // ============ Company Management ============

  @Post('companies')
  @ApiOperation({ summary: 'Create new company' })
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get('companies')
  @ApiOperation({ summary: 'Get all companies' })
  async getAllCompanies() {
    return this.companiesService.findAll();
  }

  @Get('companies/:id')
  @ApiOperation({ summary: 'Get company by ID' })
  async getCompany(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Get('companies/:id/stats')
  @ApiOperation({ summary: 'Get company statistics' })
  async getCompanyStats(@Param('id') id: string) {
    return this.companiesService.getStats(id);
  }

  @Put('companies/:id')
  @ApiOperation({ summary: 'Update company' })
  async updateCompany(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete('companies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company' })
  async deleteCompany(@Param('id') id: string) {
    return this.companiesService.delete(id);
  }

  // ============ Subscription Management ============

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create subscription plan' })
  async createSubscription(
    @Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto
  ) {
    return this.subscriptionsService.create(createSubscriptionPlanDto);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscription plans' })
  async getAllSubscriptions() {
    return this.subscriptionsService.findAll();
  }

  @Get('subscriptions/comparison')
  @ApiOperation({ summary: 'Get subscription plans comparison' })
  async getSubscriptionComparison() {
    return this.subscriptionsService.getComparison();
  }

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  async getSubscription(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Get('subscriptions/:id/stats')
  @ApiOperation({ summary: 'Get subscription statistics' })
  async getSubscriptionStats(@Param('id') id: string) {
    return this.subscriptionsService.getStats(id);
  }

  @Put('subscriptions/:id')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionPlanDto);
  }

  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate subscription plan' })
  async deleteSubscription(@Param('id') id: string) {
    return this.subscriptionsService.delete(id);
  }

  @Put('companies/:id/renew-subscription')
  @ApiOperation({ summary: 'Renew company subscription' })
  async renewCompanySubscription(
    @Param('id') id: string,
    @Body() renewDto: { months?: number }
  ) {
    return this.companiesService.renewSubscription(id, renewDto.months);
  }

  @Put('companies/:id/change-plan')
  @ApiOperation({ summary: 'Change company subscription plan' })
  async changeSubscriptionPlan(
    @Param('id') companyId: string,
    @Body() changePlanDto: { subscriptionId: string }
  ) {
    const company = await this.companiesService.findOne(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const newPlan = await this.subscriptionsService.findOne(
      changePlanDto.subscriptionId
    );
    if (!newPlan || !newPlan.isActive) {
      throw new NotFoundException('Subscription plan not found or inactive');
    }

    // Calculate new end date based on new plan duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (newPlan.durationMonths || 1));

    // Update company with new subscription
    const updatedCompany = await this.companiesService.changeSubscriptionPlan(
      companyId,
      changePlanDto.subscriptionId,
      startDate,
      endDate
    );

    return {
      message: 'Subscription plan changed successfully',
      newPlan: newPlan.name,
      validUntil: endDate
    };
  }

  @Get('companies/expiring-soon')
  @ApiOperation({ summary: 'Get companies with expiring subscriptions' })
  async getExpiringCompanies(@Query('days') days: string = '30') {
    const daysNum = parseInt(days, 10);
    const companies =
      await this.companiesService.findExpiringCompanies(daysNum);
    return companies;
  }
}
