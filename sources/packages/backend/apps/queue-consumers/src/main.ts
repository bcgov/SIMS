import "../../../env-setup";
import { QueueService } from "@sims/services/queue";
import { ConfigService } from "@sims/utilities/config";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { NestFactory } from "@nestjs/core";
import { Queue } from "bull";
import { QueueConsumersModule } from "./queue-consumers.module";
import * as basicAuth from "express-basic-auth";
import { LoggerService } from "@sims/utilities/logger";
import { SystemUsersService } from "@sims/services";

(async () => {
  const app = await NestFactory.create(QueueConsumersModule);
  const config = app.get<ConfigService>(ConfigService);

  // Get the injected logger.
  const logger = await app.resolve(LoggerService);
  app.useLogger(logger);

  logger.log("Loading system user...");
  const systemUsersService = app.get(SystemUsersService);
  await systemUsersService.loadSystemUser();

  // Queue service.
  const queueService = app.get<QueueService>(QueueService);
  const queues = await queueService.queueConfigurationModel();
  // Create bull board UI dashboard for queue management.
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/fed-admin/queues");
  const bullBoardQueues: BullAdapter[] = [];
  queues.forEach((queue) => {
    if (!queue.isActive && queue.isScheduler) {
      logger.log(`Queue service "${queue.name}" is inactive.`);
    } else {
      bullBoardQueues.push(
        new BullAdapter(app.get<Queue>(`BullQueue_${queue.name}`), {
          readOnlyMode: queue.dashboardReadonly,
        }),
      );
    }
  });
  createBullBoard({
    queues: bullBoardQueues,
    serverAdapter,
  });
  // Bull board user for basic authentication.
  const queueDashboardUsers = {};
  queueDashboardUsers[config.queueDashboardCredential.userName] =
    config.queueDashboardCredential.password;
  app.use(
    "/fed-admin/queues",
    basicAuth({
      users: queueDashboardUsers,
      challenge: true,
    }),
    serverAdapter.getRouter(),
  );

  await app.listen(config.queueConsumersPort);
})();
