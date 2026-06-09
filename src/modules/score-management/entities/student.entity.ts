import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('students')
export class Student {
    @PrimaryColumn({ type: 'varchar', length: 10, name: 'registration_number' })
    registrationNumber!: string;

    @Column({
        type: 'varchar',
        length: 5,
        nullable: true,
        name: 'foreign_language_code',
    })
    foreignLanguageCode!: string | null;
}
