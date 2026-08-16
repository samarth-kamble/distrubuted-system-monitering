import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing middleware for HTTP request cookies
  app.use(cookieParser());

  // Set global API routing prefix, keeping Auth endpoints clean
  app.setGlobalPrefix('api/v1', { exclude: ['auth/(.*)'] });

  // Enable global validation pipe with automatic stripping of undeclared fields
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 8080;

  await app.listen(port);

  console.log(`Listening on port ${port}`);
  console.log(`App listening on port http://localhost:${port}🚀`);
}

void bootstrap();
