import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log(
    'Worker background execution context bootstrapped successfully. Running schedules...',
  );
}
void bootstrap();
