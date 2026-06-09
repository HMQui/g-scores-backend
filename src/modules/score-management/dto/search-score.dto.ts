import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchScoreParamDto {
    @ApiProperty({
        description: 'Student registration number',
        example: '1000001',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{8,10}$/, {
        message: 'Registration number must be numeric and 8-10 characters long',
    })
    registrationNumber!: string;
}
