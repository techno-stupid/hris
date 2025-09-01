import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { CompanyRepository } from '../../modules/companies/repositories/company.repository';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private companyRepository: CompanyRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Skip subscription check for super admins
    if (request.isSuperAdmin || request.userRole === 'super_admin') {
      return true;
    }

    // Get company from request (set by CompanyContextGuard)
    const company = request.company;

    if (!company) {
      // If no company in context, try to fetch it
      const companyId = request.companyId;
      if (companyId) {
        const fetchedCompany = await this.companyRepository.findOne(companyId);
        if (fetchedCompany && !fetchedCompany.isSubscriptionValid()) {
          throw new ForbiddenException(
            'Your company subscription has expired. Please contact your administrator to renew.'
          );
        }
      }
      return true;
    }

    // Check if subscription is valid
    if (!company.isSubscriptionValid()) {
      throw new ForbiddenException(
        'Your company subscription has expired. Please contact your administrator to renew.'
      );
    }

    return true;
  }
}
