import { Module } from '@nestjs/common';
import { ScoreManagementController } from './score-management.controller';
import { StudentReportView } from './entities/student-report-view.entity';
import { Score } from './entities/score.entity';
import { Subject } from './entities/subject.entity';
import { Student } from './entities/student.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoreService } from './service/score/score.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Student, Subject, Score, StudentReportView]),
    ],
    controllers: [ScoreManagementController],
    providers: [ScoreService],
})
export class ScoreManagementModule {}
