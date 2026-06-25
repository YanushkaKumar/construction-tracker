// ============================================
// BuildTrack API — Application Bootstrap
// ============================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security ─────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── API Versioning ───────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global Validation Pipe ───────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Swagger Documentation ────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BuildTrack API')
      .setDescription('Construction Project Management Platform API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication & authorization')
      .addTag('Company', 'Company management')
      .addTag('Users', 'User management')
      .addTag('Projects', 'Project management')
      .addTag('Tasks', 'Task management')
      .addTag('Daily Reports', 'Site daily reports')
      .addTag('Materials', 'Material & inventory management')
      .addTag('Expenses', 'Expense management & approvals')
      .addTag('Workers', 'Worker management')
      .addTag('Attendance', 'Worker attendance')
      .addTag('Reports', 'Reporting & analytics')
      .addTag('Dashboard', 'Dashboard KPIs')
      .addTag('Notifications', 'Notification management')
      .addTag('Storage', 'File storage & uploads')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🏗️  BuildTrack API running on port ${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
