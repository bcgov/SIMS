import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.dir(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api')
  const port = process.env.PORT || 3000;

  if(process.env.NODE_ENV !== 'production'){
    app.enableCors();
  }

  // pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false,
    }),
  );

  await app.listen(port);
  console.log(`Application is listing on port ${port}`);
}
bootstrap();
