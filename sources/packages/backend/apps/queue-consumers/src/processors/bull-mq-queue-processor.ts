import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor("start-application")
export class BullMqQueueProcessor extends WorkerHost {
  async process(job: Job<{ count: number }>): Promise<string> {
    console.log(`Processing queue ${job.queueName}, job ID ${job.id}.`);
    console.log(`Processing job with count: ${job.data.count}`);
    console.log(`Processing job: ${job.id}`);
    await job.updateProgress(0);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    await job.updateProgress(50);
    if (job.data.count > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      await job.updateProgress(100);
      return "Successfully processed.";
    }
    throw new Error("Failed to process job.");
  }
}
