import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
    T,
    StandardResponse<T>
> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T>,
    ): Observable<StandardResponse<T>> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();

        return next.handle().pipe(
            map((data: T) => ({
                statusCode: response.statusCode,
                message: 'Success',
                data,
            })),
        );
    }
}
