import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // Handle different response scenarios
        let message = 'Request successful';
        let responseData = data;

        // If the service returns an object with a message property, use it
        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message;
          // If there's also a data property, use that as the actual data
          if ('data' in data) {
            responseData = data.data;
          } else {
            // Remove the message from the data to avoid duplication
            const { message: _, ...rest } = data;
            responseData = rest;
          }
        }

        // Determine message based on HTTP method if not already set
        if (message === 'Request successful') {
          switch (request.method) {
            case 'POST':
              message = 'Resource created successfully';
              break;
            case 'PUT':
            case 'PATCH':
              message = 'Resource updated successfully';
              break;
            case 'DELETE':
              message = 'Resource deleted successfully';
              break;
            case 'GET':
              message = 'Resource retrieved successfully';
              break;
          }
        }

        return {
          status: 'success',
          message,
          data: responseData,
          timestamp: new Date().toISOString(),
          path
        };
      })
    );
  }
}
