import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { getQueueToken } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class QueueSchedulerService implements OnModuleInit {
  // 1. Inject the ModuleRef to access the DI container
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit(): Promise<void> {
    const queueNames = ["ier12-integration-1"];

    for (const name of queueNames) {
      // 2. Generate the specific DI token for the queue
      const queueToken = getQueueToken(name);

      try {
        // 3. Fetch the Queue instance dynamically
        // { strict: false } allows retrieving providers registered in other modules
        const queue = this.moduleRef.get<Queue>(queueToken, { strict: false });

        // 4. Upsert your scheduler
        await queue.upsertJobScheduler(
          `scheduler-${name}`,
          { pattern: "56 22 * * *", tz: "America/Vancouver" },
          {
            name: `${name}-job`,
            data: { count: 2 },
          },
        );
        console.log(`Successfully upserted scheduler for queue: ${name}`);
      } catch (error) {
        // This triggers if the queue wasn't registered in your application modules
        console.error(
          `Failed to retrieve queue '${name}'. Is it registered?`,
          error,
        );
      }
    }
  }
}
