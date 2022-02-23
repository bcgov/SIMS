import "reflect-metadata";
require("../env_setup");
import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { KeycloakConfig } from "./auth/keycloakConfig";
import { LoggerService } from "./logger/logger.service";
import { AppAllExceptionsFilter } from "./app.exception.filter";
import { exit } from "process";
import { setGlobalPipes } from "./utilities/auth-utils";

async function bootstrap() {
  await KeycloakConfig.load();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});

  // Setting global prefix
  app.setGlobalPrefix("api");

  // Using LoggerService as app logger
  const logger = new LoggerService();
  app.useLogger(logger);

  // Exception filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AppAllExceptionsFilter(httpAdapter));

  // Getting application port
  const port = process.env.PORT || 3000;

  // TODO: Configure CORS to be as much restrictive as possible.
  app.enableCors();

  // Setting express middleware for req
  app.use(LoggerService.apiLogger);

  // pipes
  setGlobalPipes(app);

  // Starting application
  await app.listen(port);
  // Logging node http server error
  app.getHttpServer().on("error", (excp) => {
    logger.error(`Application server receive ${excp}`, undefined, "Bootstrap");
    exit(1);
  });
  logger.log(`Application is listing on port ${port}`, "Bootstrap");
}
bootstrap().catch((excp) => {
  const logger = new LoggerService();
  logger.error(
    `Application bootstrap exception: ${excp}`,
    undefined,
    "Bootstrap-Main",
  );
  exit(1);
});
