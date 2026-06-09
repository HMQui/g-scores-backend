import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    name: 'student_report_view',
    materialized: true,
    expression: `
    SELECT 
        st.registration_number,
        MAX(CASE WHEN su.code = 'toan' THEN sc.score ELSE NULL END) AS math_score,
        MAX(CASE WHEN su.code = 'vat_li' THEN sc.score ELSE NULL END) AS physics_score,
        MAX(CASE WHEN su.code = 'hoa_hoc' THEN sc.score ELSE NULL END) AS chemistry_score,
        (
            MAX(CASE WHEN su.code = 'toan' THEN sc.score ELSE NULL END) +
            MAX(CASE WHEN su.code = 'vat_li' THEN sc.score ELSE NULL END) +
            MAX(CASE WHEN su.code = 'hoa_hoc' THEN sc.score ELSE NULL END)
        ) AS group_a_score
        FROM students st
        LEFT JOIN scores sc ON st.registration_number = sc.student_registration_number
        LEFT JOIN subjects su ON sc.subject_id = su.id
        GROUP BY st.registration_number
    `,
})
export class StudentReportView {
    @ViewColumn({ name: 'registration_number' })
    registrationNumber!: string;

    @ViewColumn({ name: 'math_score' })
    mathScore!: number;

    @ViewColumn({ name: 'physics_score' })
    physicsScore!: number;

    @ViewColumn({ name: 'chemistry_score' })
    chemistryScore!: number;

    @ViewColumn({ name: 'group_a_score' })
    groupAScore!: number;
}
