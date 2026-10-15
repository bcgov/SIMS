import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor("ier12-integration-1", {
  lockDuration: 60000,
  lockRenewTime: 5000,
  maxStalledCount: 0,
})
export class BullMqQueueScheduler extends WorkerHost {
  async process(
    job: Job<{ count: number }, { status: string }>,
  ): Promise<string> {
    console.log(`Processing queue ${job.queueName}, job ID ${job.id}.`);
    console.log(`Processing job with count: ${job.data.count}`);
    console.log(`Processing job: ${job.id}`);
    if (job.data.count <= 0) {
      throw new Error("Failed to process job.");
    }
    await job.updateProgress(0);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await job.updateProgress(50);
    if (job.data.count > 0) {
      await new Promise((resolve) => setTimeout(resolve, 15000));
      await job.updateProgress(100);
      return "Successfully processed.";
    }
  }
}
