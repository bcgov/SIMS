import "../../../env-setup";
import { ConfigService } from "@sims/utilities/config";
import { NestFactory } from "@nestjs/core";
import { QueueConsumersModule } from "./queue-consumers.module";
import { LoggerService } from "@sims/utilities/logger";
import { SystemUsersService } from "@sims/services";
import * as cookieParser from "cookie-parser";

(async () => {
  const app = await NestFactory.create(QueueConsumersModule);
  const config = app.get<ConfigService>(ConfigService);

  // Get the injected logger.
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);

  app.use(cookieParser());

  logger.log("Loading system user...");
  const systemUsersService = app.get(SystemUsersService);
  await systemUsersService.loadSystemUser();

  await app.listen(config.queueConsumersPort);
})();
