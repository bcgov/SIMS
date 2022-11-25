require("../../../env_setup_apps");
import { Queues } from "@sims/services/queue";
import { ConfigService } from "@sims/utilities/config";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { NestFactory } from "@nestjs/core";
import { Queue } from "bull";
import { QueueConsumersModule } from "./queue-consumers.module";
import * as basicAuth from "express-basic-auth";

async function bootstrap() {
  const app = await NestFactory.create(QueueConsumersModule);

  const config = app.get<ConfigService>(ConfigService);

  //Application port.
  const port = config.queueConsumersPort || 3001;

  // Create bull board UI dashboard for queue management.
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");
  const bullBoardQueues = Queues.map((queue) => {
    return new BullAdapter(app.get<Queue>(`BullQueue_${queue.name}`), {
      readOnlyMode: queue.dashboardReadonly,
    });
  });
  createBullBoard({
    queues: bullBoardQueues,
    serverAdapter,
  });
  // Bull board user for basic authentication.
  const queueDashboardUsers = {};
  queueDashboardUsers[config.queueDashboard.queueDashboardUser] =
    config.queueDashboard.queueDashboardPassword;
  app.use(
    "/admin/queues",
    basicAuth({
      users: queueDashboardUsers,
      challenge: true,
    }),
    serverAdapter.getRouter(),
  );

  await app.listen(port);
}
bootstrap();
