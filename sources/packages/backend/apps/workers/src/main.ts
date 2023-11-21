import "../../../env-setup";
import { NestFactory } from "@nestjs/core";
import { LoggerService } from "@sims/utilities/logger";
import { WorkersModule } from "./workers.module";
import { ZeebeTransportStrategy } from "./zeebe/zeebe-transport-strategy";

(async () => {
  const workers = await NestFactory.create(WorkersModule, { bufferLogs: true });
  // Get the injected logger.
  const logger = await workers.resolve(LoggerService);
  workers.useLogger(logger);

  logger.log("Initializing workers...");

  workers.connectMicroservice({
    strategy: workers.get(ZeebeTransportStrategy),
  });
  await workers.listen(8000);
  await workers.startAllMicroservices();

  logger.log("Workers initialized!");
})();
