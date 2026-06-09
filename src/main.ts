import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    const rawOrigins = configService.get<string>(
        'CORS_ORIGINS',
        'http://localhost:5173',
    );
    const allowedOrigins: string[] = rawOrigins
        .split(',')
        .map((origin: string) => origin.trim());

    app.enableCors({
        origin: allowedOrigins,
    });

    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());

    const config = new DocumentBuilder()
        .setTitle('G-Scores API')
        .setDescription(
            'The internal API documentation for Golden Owl Internship Assignment',
        )
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = configService.get<number>('PORT', 3000);
    await app.listen(port);

    logger.log(`Application running on port ${port}`);
    logger.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();
