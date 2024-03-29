import "../../../env-setup";
import { NestFactory } from "@nestjs/core";
import { LoggerService } from "@sims/utilities/logger";
import { WorkersModule } from "./workers.module";
import { ZeebeTransportStrategy } from "./zeebe/zeebe-transport-strategy";
import { ConfigService } from "@sims/utilities/config";
import { SystemUsersService } from "@sims/services";

(async () => {
  const workers = await NestFactory.create(WorkersModule, { bufferLogs: true });
  const config = workers.get(ConfigService);
  // Get the injected logger.
  const logger = await workers.resolve(LoggerService);
  workers.useLogger(logger);

  logger.log("Loading system user...");
  const systemUsersService = workers.get(SystemUsersService);
  await systemUsersService.loadSystemUser();

  logger.log("Initializing workers...");

  workers.connectMicroservice({
    strategy: workers.get(ZeebeTransportStrategy),
  });
  await workers.listen(config.workersPort);
  await workers.startAllMicroservices();

  logger.log("Workers initialized!");
})();
