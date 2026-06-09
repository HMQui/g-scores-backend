import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import * as fs from 'fs';
import csv from 'csv-parser';
import { Student } from '../../entities/student.entity';
import { Subject } from '../../entities/subject.entity';
import { Score } from '../../entities/score.entity';
import { StudentReportView } from '../../entities/student-report-view.entity';
import {
    StudentScoreResponse,
    SubjectScoreItem,
    SubjectStatisticsResponse,
    RawStatisticsQuery,
    CsvRow,
} from '../../interface/score-responses.interface';

export interface ImportResult {
    totalProcessed: number;
}

@Injectable()
export class ScoreService {
    private readonly logger = new Logger(ScoreService.name);

    constructor(
        @InjectRepository(Student) private studentRepo: Repository<Student>,
        @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
        @InjectRepository(Score) private scoreRepo: Repository<Score>,
        @InjectRepository(StudentReportView)
        private reportViewRepo: Repository<StudentReportView>,
        private dataSource: DataSource,
    ) {}

    // Parse CSV stream and import students/scores in batches
    async importCsvData(filePath: string): Promise<ImportResult> {
        this.logger.log(`Start processing file: ${filePath}`);

        const subjectsMap = await this.ensureSubjectsExist();
        const studentsBatch: Student[] = [];
        const scoresBatch: Score[] = [];
        const BATCH_SIZE = 1000;
        let processedRows = 0;

        const stream = fs.createReadStream(filePath).pipe(csv());

        try {
            // Process stream sequentially using Async Iterator
            for await (const data of stream) {
                const row = data as CsvRow;

                const student = new Student();
                student.registrationNumber = row.sbd;
                student.foreignLanguageCode = row.ma_ngoai_ngu || null;
                studentsBatch.push(student);

                const subjectCodes = [
                    'toan',
                    'ngu_van',
                    'ngoai_ngu',
                    'vat_li',
                    'hoa_hoc',
                    'sinh_hoc',
                    'lich_su',
                    'dia_li',
                    'gdcd',
                ];

                for (const code of subjectCodes) {
                    const rawScore = row[code];
                    if (rawScore && !isNaN(parseFloat(rawScore))) {
                        const subject = subjectsMap.get(code);

                        if (!subject) {
                            this.logger.warn(
                                `Subject code ${code} not found, skipping.`,
                            );
                            continue;
                        }

                        const score = new Score();
                        score.student = student;
                        score.subject = subject;
                        score.score = parseFloat(rawScore);
                        scoresBatch.push(score);
                    }
                }

                processedRows++;

                // Execute batch insert when threshold is met
                if (studentsBatch.length >= BATCH_SIZE) {
                    await this.insertBatch(studentsBatch, scoresBatch);
                    studentsBatch.length = 0;
                    scoresBatch.length = 0;
                }
            }

            // Insert remaining data after stream ends
            if (studentsBatch.length > 0) {
                await this.insertBatch(studentsBatch, scoresBatch);
            }

            this.logger.log('Updating Materialized View...');
            await this.dataSource.query(
                'REFRESH MATERIALIZED VIEW student_report_view',
            );

            fs.unlinkSync(filePath);
            this.logger.log(`Finished importing ${processedRows} rows.`);

            return { totalProcessed: processedRows };
        } catch (error) {
            this.logger.error(
                'Error processing CSV stream',
                error instanceof Error ? error.stack : error,
            );
            throw error;
        }
    }

    /**
     * Perform bulk insert for a batch of students and scores
     */
    private async insertBatch(
        students: Student[],
        scores: Score[],
    ): Promise<void> {
        try {
            await this.studentRepo
                .createQueryBuilder()
                .insert()
                .into(Student)
                .values(students)
                .orIgnore()
                .execute();

            if (scores.length > 0) {
                await this.scoreRepo.save(scores, { chunk: 500 });
            }
        } catch (error) {
            this.logger.error('Error inserting batch', error);
            throw error;
        }
    }

    /**
     * Ensure base subjects exist in DB and return lookup map
     */
    private async ensureSubjectsExist(): Promise<Map<string, Subject>> {
        const subjectList = [
            { code: 'toan', name: 'Toán' },
            { code: 'ngu_van', name: 'Ngữ Văn' },
            { code: 'ngoai_ngu', name: 'Ngoại Ngữ' },
            { code: 'vat_li', name: 'Vật Lí' },
            { code: 'hoa_hoc', name: 'Hóa Học' },
            { code: 'sinh_hoc', name: 'Sinh Học' },
            { code: 'lich_su', name: 'Lịch Sử' },
            { code: 'dia_li', name: 'Địa Lí' },
            { code: 'gdcd', name: 'GDCD' },
        ];

        const map = new Map<string, Subject>();
        for (const item of subjectList) {
            let subject = await this.subjectRepo.findOneBy({ code: item.code });
            if (!subject) {
                subject = this.subjectRepo.create(item);
                await this.subjectRepo.save(subject);
            }
            map.set(subject.code, subject);
        }
        return map;
    }

    /**
     * Retrieves individual student scores by registration number.
     */
    public async getStudentScoreByRegistrationNumber(
        registrationNumber: string,
    ): Promise<StudentScoreResponse | null> {
        const student = await this.studentRepo.findOne({
            where: { registrationNumber },
        });

        if (!student) {
            this.logger.warn(`Student not found: ${registrationNumber}`);
            return null;
        }

        const scores = await this.scoreRepo.find({
            where: { student: { registrationNumber } },
            relations: { subject: true },
        });

        const formattedScores: SubjectScoreItem[] = scores.map(
            (scoreEntity: Score) => ({
                subjectName: scoreEntity.subject.name,
                score: Number(scoreEntity.score),
            }),
        );

        return {
            registrationNumber: student.registrationNumber,
            foreignLanguageCode: student.foreignLanguageCode,
            scores: formattedScores,
        };
    }

    /**
     * Queries the materialized view to get the top 10 students with highest Group A scores.
     */
    public async getTop10GroupA(): Promise<StudentReportView[]> {
        this.logger.log(
            'Fetching Top 10 Group A students from materialized view',
        );

        return this.reportViewRepo.find({
            where: {
                mathScore: Not(IsNull()),
                physicsScore: Not(IsNull()),
                chemistryScore: Not(IsNull()),
            },
            order: {
                groupAScore: 'DESC',
            },
            take: 10,
        });
    }

    /**
     * Aggregates score statistics categorized into 4 levels for all subjects.
     */
    public async getStatisticsReport(): Promise<SubjectStatisticsResponse[]> {
        const subjects = await this.subjectRepo.find();
        const result: SubjectStatisticsResponse[] = [];

        for (const subject of subjects) {
            const stats = await this.scoreRepo
                .createQueryBuilder('score')
                .select(
                    `
                        COUNT(CASE WHEN score.score >= 8 THEN 1 END) AS level_excellent,
                        COUNT(CASE WHEN score.score >= 6 AND score.score < 8 THEN 1 END) AS level_good,
                        COUNT(CASE WHEN score.score >= 4 AND score.score < 6 THEN 1 END) AS level_average,
                        COUNT(CASE WHEN score.score < 4 THEN 1 END) AS level_poor
                    `,
                )
                .where('score.subject_id = :subjectId', {
                    subjectId: subject.id,
                })
                .getRawOne<RawStatisticsQuery>();

            result.push({
                subjectCode: subject.code,
                subjectName: subject.name,
                statistics: [
                    {
                        level: '>= 8',
                        count: Number(stats?.level_excellent) || 0,
                    },
                    { level: '6 - <8', count: Number(stats?.level_good) || 0 },
                    {
                        level: '4 - <6',
                        count: Number(stats?.level_average) || 0,
                    },
                    { level: '< 4', count: Number(stats?.level_poor) || 0 },
                ],
            });
        }

        return result;
    }
}
