import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
