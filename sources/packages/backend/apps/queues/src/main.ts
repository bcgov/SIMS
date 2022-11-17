require("../../../env_setup_apps");
import { Queues } from "@sims/queue";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { NestFactory } from "@nestjs/core";
import { Queue } from "bull";
import { QueuesModule } from "./queues.module";
import * as basicAuth from "express-basic-auth";

async function bootstrap() {
  const app = await NestFactory.create(QueuesModule);

  // Create bull board UI dashboard for queue management.
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");
  const bullBoardQueues = Object.values(Queues).map((queue) => {
    return new BullAdapter(app.get<Queue>(`BullQueue_${queue.name}`), {
      readOnlyMode: queue.readonly,
    });
  });
  createBullBoard({
    queues: bullBoardQueues,
    serverAdapter,
  });
  app.use(
    "/admin/queues",
    basicAuth({
      users: { "queue-dashboard-admin": process.env.QUEUE_DASHBOARD_PASSWORD },
      challenge: true,
    }),
    serverAdapter.getRouter(),
  );

  await app.listen(3001);
}
bootstrap();
