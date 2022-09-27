import { NestFactory } from '@nestjs/core';
import { WorkersModule } from './workers.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkersModule);
  await app.listen(3000);
}
bootstrap();
