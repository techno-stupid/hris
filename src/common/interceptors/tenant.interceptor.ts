import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Add company context to the request
    if (request.params.companyId) {
      request.companyId = request.params.companyId;
    }

    return next.handle().pipe(
      map((data) => {
        // Add company information to response if needed
        if (request.company && data) {
          return {
            ...data,
            companyContext: {
              id: request.company.id,
              name: request.company.name
            }
          };
        }
        return data;
      })
    );
  }
}
