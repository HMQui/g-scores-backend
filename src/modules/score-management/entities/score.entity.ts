import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Student } from './student.entity';
import { Subject } from './subject.entity';

@Entity('scores')
@Index(['student', 'subject'], { unique: true })
export class Score {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Student)
    @JoinColumn({ name: 'student_registration_number' })
    student!: Student;

    @ManyToOne(() => Subject)
    @JoinColumn({ name: 'subject_id' })
    subject!: Subject;

    @Column({ type: 'numeric', precision: 4, scale: 2 })
    score!: number;
}
