import "reflect-metadata";
require("../../../env_setup_apps");
import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { KeycloakConfig } from "./auth/keycloakConfig";
import { LoggerService } from "@sims/utilities/logger";
import { AppAllExceptionsFilter } from "./app.exception.filter";
import { exit } from "process";
import { setGlobalPipes } from "./utilities/auth-utils";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Request, Response } from "express";

async function bootstrap() {
  await KeycloakConfig.load();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Get the injected logger.
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);

  // Setting global prefix
  app.setGlobalPrefix("api");

  // Exception filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AppAllExceptionsFilter(httpAdapter));

  // Getting application port
  const port = process.env.PORT || 3000;

  // Only for the development environment, the CORS setting allows
  // any domain. Otherwise all the web origins(except the same domain where API is hosted)
  // are restricted.
  const allowAnyOrigin = process.env.NODE_ENV !== "production";

  //TODO: Check for potential security threats in exposing the content-disposition header.
  app.enableCors({
    exposedHeaders: "Content-Disposition",
    origin: allowAnyOrigin,
  });

  // Log every request.
  app.use((req: Request, _res: Response, next: () => void) => {
    logger.log(
      `Request - ${req.method} ${req.path} From ${
        req.headers.origin ?? "unknown"
      } | ${req.headers["user-agent"] ?? "unknown"}`,
    );
    next();
  });

  // pipes
  setGlobalPipes(app);

  // Configure Swagger.
  if (process.env.SWAGGER_ENABLED?.toLowerCase() === "true") {
    const options = new DocumentBuilder()
      .setTitle(process.env.PROJECT_NAME)
      .setDescription(`The ${process.env.PROJECT_NAME} API description`)
      .setVersion("1.0.0")
      .addBearerAuth(
        {
          name: "Authorization",
          type: "http",
          in: "Header",
        },
        "access-token",
      )
      .addServer("/api")
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup("swagger", app, document);
  }

  // Starting application
  await app.listen(port);
  // Logging node http server error
  app.getHttpServer().on("error", (error: unknown) => {
    logger.error(`Application server receive ${error}`, undefined, "Bootstrap");
    exit(1);
  });
  logger.log(`Application is listing on port ${port}`, "Bootstrap");
}
bootstrap().catch((error: unknown) => {
  const logger = new LoggerService();
  logger.error(
    `Application bootstrap exception: ${error}`,
    undefined,
    "Bootstrap-Main",
  );
  exit(1);
});
