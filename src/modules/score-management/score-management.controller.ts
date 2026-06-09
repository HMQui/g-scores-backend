import {
    Controller,
    Post,
    UploadedFile,
    BadRequestException,
    UseInterceptors,
    Get,
    NotFoundException,
    Param,
} from '@nestjs/common';
import { ScoreService } from './service/score/score.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvHeaderValidationInterceptor } from '../../common/interceptors/csv-header-validation.interceptor';
import type { Express } from 'express';
import 'multer';
import {
    SubjectStatisticsResponse,
    StudentScoreResponse,
} from './interface/score-responses.interface';
import { SearchScoreParamDto } from './dto/search-score.dto';
import { StudentReportView } from './entities/student-report-view.entity';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';

@ApiTags('Scores')
@Controller('scores')
export class ScoreManagementController {
    constructor(private readonly scoreService: ScoreService) {}

    /**
     * Handles CSV file upload and triggers the import process
     */
    @Post('import')
    @ApiOperation({ summary: 'Import student scores from CSV file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            dest: './uploads',
            fileFilter: (req, file, callback) => {
                if (
                    !file.mimetype.match(
                        /(text\/csv|application\/vnd.ms-excel)/,
                    )
                ) {
                    return callback(
                        new BadRequestException('Only CSV files are allowed.'),
                        false,
                    );
                }
                callback(null, true);
            },
        }),
        CsvHeaderValidationInterceptor,
    )
    async importCsv(
        @UploadedFile()
        file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Upload a CSV file.');
        }

        const result = await this.scoreService.importCsvData(file.path);

        return {
            message: 'Import successfully.',
            details: result,
        };
    }

    /**
     * Endpoint to retrieve score statistics report
     */
    @Get('reports/statistics')
    @ApiOperation({ summary: 'Get score statistics categorized by 4 levels' })
    public async getScoreStatistics(): Promise<SubjectStatisticsResponse[]> {
        return this.scoreService.getStatisticsReport();
    }

    /**
     * Endpoint to retrieve top 10 students in Group A report
     */
    @Get('reports/top-10-group-a')
    @ApiOperation({
        summary: 'Get Top 10 students with highest Group A scores',
    })
    public async getTop10GroupA(): Promise<StudentReportView[]> {
        return this.scoreService.getTop10GroupA();
    }

    /**
     * Endpoint to retrieve score details for a student by registration number
     */
    @Get(':registrationNumber')
    @ApiOperation({ summary: 'Get detailed scores of a specific student' })
    @ApiParam({
        name: 'registrationNumber',
        type: 'string',
        description: 'Student Registration Number',
    })
    public async getScoreByRegistrationNumber(
        @Param() params: SearchScoreParamDto,
    ): Promise<StudentScoreResponse> {
        const result =
            await this.scoreService.getStudentScoreByRegistrationNumber(
                params.registrationNumber,
            );
        if (!result) {
            throw new NotFoundException(
                `Student with registration number ${params.registrationNumber} not found`,
            );
        }
        return result;
    }
}
