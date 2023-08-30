import { Injectable, Logger } from "@nestjs/common";
import {
  CustomTransportStrategy,
  Server,
  MessageHandler,
} from "@nestjs/microservices";
import { firstValueFrom, isObservable } from "rxjs";
import {
  ICustomHeaders,
  IInputVariables,
  IOutputVariables,
  MustReturnJobActionAcknowledgement,
  ZBClient,
  ZBWorkerOptions,
  ZeebeJob,
} from "zeebe-node";

/**
 * Zeebe strategy to stablish the connectivity and create all workers.
 * @see https://docs.camunda.io/docs/0.25/components/zeebe/basics/job-workers.
 */
@Injectable()
export class ZeebeTransportStrategy
  extends Server
  implements CustomTransportStrategy
{
  constructor(private readonly zeebeClient: ZBClient) {
    super();
  }

  /**
   * Identify all Zeebe workers in the controllers and create the
   * respective Zeebe workers to handle all the jobs.
   */
  async listen(callback: () => void) {
    const handlers = this.getHandlers();
    handlers.forEach((handler: MessageHandler, taskType: string) => {
      const { extras } = handler;
      const workerOptions = extras.options as ZBWorkerOptions;
      this.zeebeClient.createWorker({
        ...workerOptions,
        // Ensures that the variables must be explicit provided in order to
        // be retrieved from the workflow as per Camunda best practices.
        fetchVariable: workerOptions?.fetchVariable ?? [],
        taskType,
        taskHandler: async (job) => this.workerHandlerWrapper(handler, job),
      });
    });
    callback();
  }

  /**
   * Wrapper to allow global handling of all the jobs executed.
   * @param jobHandler job method to be executed.
   * @param job job information.
   * @returns job result.
   */
  private async workerHandlerWrapper(
    jobHandler: MessageHandler,
    job: Readonly<ZeebeJob<IInputVariables, ICustomHeaders, IOutputVariables>>,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    jobLogger.log(
      `Starting job for processInstanceKey ${job.processInstanceKey}. Retries left: ${job.retries}.`,
    );
    try {
      const jobResult = await jobHandler(job);
      if (isObservable(jobResult)) {
        await firstValueFrom(jobResult);
      }
      return jobResult;
    } catch (error: unknown) {
      jobLogger.error(
        `Unhandled exception while processing job ${job.type} from processInstanceKey ${job.processInstanceKey}`,
      );
      jobLogger.error(job);
      jobLogger.error(error);
      return job.fail(`Unhandled exception. ${error}`);
    }
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
