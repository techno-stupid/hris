import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  status: 'error';
  message: string;
  error?: string;
  errors?: any;
  statusCode: number;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;

        // Handle validation errors from class-validator
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          errors = responseObj.message;
        } else if (responseObj.errors) {
          errors = responseObj.errors;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack
      );
    } else {
      this.logger.error('Unknown error type', exception);
    }

    const errorResponse: ErrorResponse = {
      status: 'error',
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url
    };

    // Add error details for non-production environments
    if (process.env.NODE_ENV !== 'production') {
      if (errors) {
        errorResponse.errors = errors;
      }
      if (
        exception instanceof Error &&
        status === HttpStatus.INTERNAL_SERVER_ERROR
      ) {
        errorResponse.error = exception.stack;
      }
    } else {
      // In production, only show validation errors
      if (errors && status === HttpStatus.BAD_REQUEST) {
        errorResponse.errors = errors;
      }
    }

    response.status(status).json(errorResponse);
  }
}
