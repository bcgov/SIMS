import {
  CustomTransportStrategy,
  Server,
  MessageHandler,
} from "@nestjs/microservices";
import { ZBClient, ZBWorkerOptions } from "zeebe-node";

/**
 * Zeebe strategy to stablish the connectivity and create all workers.
 * @see https://docs.camunda.io/docs/0.25/components/zeebe/basics/job-workers.
 */
export class ZeebeTransportStrategy
  extends Server
  implements CustomTransportStrategy
{
  private zeebeClient: ZBClient;
  /**
   * Identify all Zeebe workers in the controllers and create the
   * respective Zeebe workers to handle all the jobs.
   */
  listen(callback: () => void) {
    this.zeebeClient = new ZBClient();
    const handlers = this.getHandlers();
    handlers.forEach((handler: MessageHandler, taskType: string) => {
      const { extras } = handler;
      const workerOptions = extras as ZBWorkerOptions;
      this.zeebeClient.createWorker({
        ...workerOptions,
        taskType,
        taskHandler: async (job) => handler(job),
      });
    });
    callback();
  }

  /**
   * Handles the application close.
   */
  async close() {
    if (this.zeebeClient) {
      await this.zeebeClient.close();
    }
  }
}
