import { Injectable, Logger } from "@nestjs/common";
import {
  CustomTransportStrategy,
  Server,
  MessageHandler,
} from "@nestjs/microservices";
import { isObservable, lastValueFrom } from "rxjs";
import { ZeebeHealthIndicator } from "./zeebe-health-indicator";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import {
  ICustomHeaders,
  IOutputVariables,
  MustReturnJobActionAcknowledgement,
  ZBWorkerOptions,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

/**
 * Zeebe strategy to stablish the connectivity and create all workers.
 * @see https://docs.camunda.io/docs/0.25/components/zeebe/basics/job-workers.
 */
@Injectable()
export class ZeebeTransportStrategy
  extends Server
  implements CustomTransportStrategy
{
  constructor(
    private readonly zeebeClient: ZeebeGrpcClient,
    private readonly zeebeHealthIndicator: ZeebeHealthIndicator,
  ) {
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
        onReady: () => {
          this.zeebeHealthIndicator.reportConnectionWorkerStatus(
            taskType,
            true,
          );
        },
        onConnectionError: () =>
          this.zeebeHealthIndicator.reportConnectionWorkerStatus(
            taskType,
            false,
          ),
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
    job: Readonly<
      ZeebeJob<{ [x: string]: unknown }, ICustomHeaders, IOutputVariables>
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    jobLogger.log(
      `Starting job for processInstanceKey ${job.processInstanceKey}. Retries left: ${job.retries}.`,
    );
    try {
      // The jobHandler can potentially return a Promise or
      // an Observable. The Promise will be returned from a
      // controller when it finishes as expected returning
      // some value. The Observable will be returned as a
      // result of an unhandled exception when a RpcExecption
      // will be generated and the RpcExpectionHandler will
      // wrap this exception as an Observable object.
      const jobResult = await jobHandler(job);
      if (isObservable(jobResult)) {
        // The lastValueFrom is almost exactly the same as toPromise()
        // meaning that it will resolve with the last value that has arrived
        // when the Observable completes.
        await lastValueFrom(jobResult);
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
