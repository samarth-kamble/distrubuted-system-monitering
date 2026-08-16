import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app-logger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new AppLogger(),
  });

  // Enable security headers with Helmet
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable cookie parsing middleware for HTTP request cookies
  app.use(cookieParser());

  // Set global API routing prefix, keeping Auth endpoints clean
  app.setGlobalPrefix('api/v1', { exclude: ['auth/(.*)', 'simulation/(.*)'] });

  // Use global exception filter to format standard JSON error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable global validation pipe with automatic stripping of undeclared fields
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 8000;

  await app.listen(port);

  console.log(`Listening on port ${port}`);
  console.log(`App listening on port http://localhost:${port}🚀`);
}

void bootstrap();
