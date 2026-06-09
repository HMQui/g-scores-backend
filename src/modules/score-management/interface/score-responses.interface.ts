export interface SubjectScoreItem {
    subjectName: string;
    score: number;
}

export interface StudentScoreResponse {
    registrationNumber: string;
    foreignLanguageCode: string | null;
    scores: SubjectScoreItem[];
}

export interface StatisticsLevel {
    level: '>= 8' | '6 - <8' | '4 - <6' | '< 4';
    count: number;
}

export interface SubjectStatisticsResponse {
    subjectCode: string;
    subjectName: string;
    statistics: StatisticsLevel[];
}

export interface RawStatisticsQuery {
    level_excellent: string;
    level_good: string;
    level_average: string;
    level_poor: string;
}

export interface CsvRow {
    sbd: string;
    ma_ngoai_ngu?: string;
    toan?: string;
    ngu_van?: string;
    ngoai_ngu?: string;
    vat_li?: string;
    hoa_hoc?: string;
    sinh_hoc?: string;
    lich_su?: string;
    dia_li?: string;
    gdcd?: string;
    [key: string]: string | undefined;
}
