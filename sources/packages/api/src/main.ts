import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api')
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is listing on port ${port}`);
}
bootstrap();
