import "reflect-metadata";
require("../env_setup");
import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { KeycloakConfig } from "./auth/keycloakConfig";
import { LoggerService } from "./logger/logger.service";
import { AppAllExceptionsFilter } from "./app.exception.filter";
import { exit } from "process";

async function bootstrap() {
  await KeycloakConfig.load();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});

  // Setting global prefix
  app.setGlobalPrefix("api");

  // Using LoggerService as app logger
  app.useLogger(app.get(LoggerService));

  // Exception filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AppAllExceptionsFilter(httpAdapter));

  // Getting application port
  const port = process.env.PORT || 3000;

  // Enabling cors for non prod env
  if (process.env.NODE_ENV !== "production") {
    app.enableCors();
  }

  // Setting express middleware for req
  app.use(LoggerService.apiLogger);

  // pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false,
    }),
  );

  // Starting application
  await app.listen(port);
  // Logging node http server error
  app.getHttpServer().on("error", (excp) => {
    LoggerService.error(
      `Application server receive ${excp}`,
      undefined,
      "Bootstrap",
    );
    exit(1);
  });
  LoggerService.log(`Application is listing on port ${port}`, "Bootstrap");
}
bootstrap().catch((excp) => {
  LoggerService.error(
    `Application bootstrap exception: ${excp}`,
    undefined,
    "Bootstrap-Main",
  );
  exit(1);
});
