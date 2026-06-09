import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import dataSource from '../typeorm.config';
import { ScoreManagementModule } from './modules/score-management/score-management.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            useFactory: () => ({
                ...dataSource.options,
                autoLoadEntities: true,
            }),
            dataSourceFactory: async () => {
                return dataSource.initialize();
            },
        }),
        ScoreManagementModule,
    ],
})
export class AppModule {}
