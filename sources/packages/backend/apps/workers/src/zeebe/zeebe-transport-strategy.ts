import {
  CustomTransportStrategy,
  Server,
  MessageHandler,
} from "@nestjs/microservices";
import { ZBClient, ZBWorkerOptions } from "zeebe-node";

export class ZeebeTransportStrategy
  extends Server
  implements CustomTransportStrategy
{
  private zeebeClient: ZBClient;
  /**
   * This method is triggered when you run "app.listen()".
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
   * This method is triggered on application shutdown.
   */
  async close() {
    console.info("Closing zeebe client.");
    if (this.zeebeClient) {
      await this.zeebeClient.close();
    }
    console.info("Zeebe client closed.");
  }
}
