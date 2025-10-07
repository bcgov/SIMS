import "../../../env-setup";
import { NestFactory } from "@nestjs/core";
import { LoadTestModule } from "./load-test.module";
import { KeycloakConfig } from "@sims/auth/config";
import { LoggerService } from "@sims/utilities/logger";
import { exit } from "process";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  await KeycloakConfig.load();
  const app = await NestFactory.create<NestExpressApplication>(LoadTestModule);

  // Get the injected logger.
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);

  // Setting global prefix.
  app.setGlobalPrefix("load-test");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false,
    }),
  );

  const loadTestAPIPort = +process.env.LOAD_TEST_API_PORT || 3005;
  await app.listen(loadTestAPIPort);

  // Logging node http server error
  app.getHttpServer().on("error", (error: unknown) => {
    logger.error(`Load test server received ${error}`, undefined, "Bootstrap");
    exit(1);
  });
  logger.log(
    `Load test gateway is listening on port ${loadTestAPIPort}`,
    "Bootstrap",
  );
}
bootstrap().catch((error: unknown) => {
  const logger = new LoggerService();
  logger.error(
    `Load test gateway bootstrap exception: ${error}`,
    undefined,
    "Bootstrap-Main",
  );
  exit(1);
});
