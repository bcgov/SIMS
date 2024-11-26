import { Global, Module, OnModuleInit } from "@nestjs/common";
import { getQueueToken } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { ModuleRef } from "@nestjs/core";
import { QueueService } from "@sims/services/queue";

@Global()
@Module({})
export class QueuesBootstrapModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit(): Promise<void> {
    console.log("Queue module initialized");
    const queues = await this.queueService.queueConfigurationModel();
    queues.forEach((queue) => {
      if (!queue.isActive && queue.isScheduler) {
        return;
      }
      const queueProvider = this.moduleRef.get<Queue>(
        getQueueToken(queue.name),
        {
          strict: false,
        },
      );
      queueProvider.on("failed", (job: Job, error: unknown) => {
        console.error("JOB failed");
        console.error(job.id);
        console.error(job.queue.name);
        console.error(new Date(job.processedOn));
        console.error(job.failedReason);
        console.error("Attempts made: ", job.attemptsMade);
        console.error(error);
      });
      queueProvider.on("stalled", (job: Job, error: unknown) => {
        console.error("JOB stalled");
        console.error(job.id);
        console.error(job.queue.name);
        console.error(new Date(job.processedOn));
        console.error(job.failedReason);
        console.error("Attempts made: ", job.attemptsMade);
        console.error(error);
      });
      queueProvider.on("error", (job: Job, error: unknown) => {
        console.error("JOB Error");
        console.error(job.id);
        console.error(job.queue.name);
        console.error(new Date(job.processedOn));
        console.error(job.failedReason);
        console.error("Attempts made: ", job.attemptsMade);
        console.error(error);
      });
    });
  }
}
