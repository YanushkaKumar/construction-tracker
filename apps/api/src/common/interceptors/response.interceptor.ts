import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponseFormat<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Transforms all responses to a consistent API format:
 * { data: T, meta?: { total, page, limit, totalPages } }
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseFormat<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseFormat<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If the response already has the expected format, pass through
        if (responseData && responseData.data !== undefined) {
          return responseData;
        }

        // Wrap raw data in standard format
        return { data: responseData };
      }),
    );
  }
}
