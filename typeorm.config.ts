import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    // For production
    url: process.env.DATABASE_URL,

    // For dev
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'secretpassword',
    database: process.env.DB_NAME || 'g_scores',

    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
    synchronize: false,
};

export default new DataSource(dataSourceOptions);
