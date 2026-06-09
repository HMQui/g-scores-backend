import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as fs from 'fs';
import csv from 'csv-parser';
import type { Request } from 'express';

@Injectable()
export class CsvHeaderValidationInterceptor implements NestInterceptor {
    private readonly logger = new Logger(CsvHeaderValidationInterceptor.name);
    private readonly requiredHeaders: string[] = [
        'sbd',
        'toan',
        'ngu_van',
        'ngoai_ngu',
        'vat_li',
        'hoa_hoc',
        'sinh_hoc',
        'lich_su',
        'dia_li',
        'gdcd',
        'ma_ngoai_ngu',
    ];

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<unknown>> {
        const request = context.switchToHttp().getRequest<Request>();
        const file = request.file;

        if (file && file.path) {
            await this.validateCsvHeaders(file.path);
        }

        return next.handle();
    }

    private validateCsvHeaders(filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath).pipe(csv());

            stream.on('headers', (headers: string[]) => {
                const missingHeaders = this.requiredHeaders.filter(
                    (header: string) => !headers.includes(header),
                );

                if (missingHeaders.length > 0) {
                    this.logger.error(
                        `CSV validation failed. Missing headers: ${missingHeaders.join(', ')}`,
                    );

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }

                    stream.destroy();
                    return reject(
                        new BadRequestException(
                            `Invalid CSV file. Missing required columns: ${missingHeaders.join(', ')}`,
                        ),
                    );
                }

                stream.destroy();
                resolve();
            });

            stream.on('error', (error: Error) => {
                this.logger.error('Failed to parse CSV headers', error.stack);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                reject(
                    new BadRequestException(
                        'Unable to process the uploaded CSV file.',
                    ),
                );
            });
        });
    }
}
