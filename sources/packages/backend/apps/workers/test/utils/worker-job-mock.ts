import {
  ICustomHeaders,
  IInputVariables,
  IOutputVariables,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

export enum MockedZeebeJobResult {
  Complete = "complete",
  Fail = "fail",
  Error = "error",
}

export const FAKE_WORKER_JOB_RESULT_PROPERTY = "resultType";
export const FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY = "errorMessage";
export const FAKE_WORKER_JOB_ERROR_CODE_PROPERTY = "errorCode";
export const FAKE_WORKER_OUTPUT_VARIABLES_PROPERTY = "outputVariables";

export class FakeWorkerJobResult {
  [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult;
  /**
   * Contains the dynamic list of outputted variables that will be sent
   * to the Workflow when the method job.complete is invoked.
   */
  [FAKE_WORKER_OUTPUT_VARIABLES_PROPERTY]?: IOutputVariables;
  /**
   * Get the {@link MockedZeebeJobResult} from the expected property in the {@link result} parameter.
   * @param result job execution result.
   * @returns job result status.
   */
  static getResultType(result: unknown): MockedZeebeJobResult {
    return result[FAKE_WORKER_JOB_RESULT_PROPERTY];
  }
  /**
   * Get the optional worker output variables that can be returned from the job.complete method.
   * @param result job execution result.
   * @returns worker output variables, if any.
   */
  static getOutputVariables(result: unknown): IOutputVariables {
    return result[FAKE_WORKER_OUTPUT_VARIABLES_PROPERTY];
  }
}

/**
 * Create a mocked object to mock any worker job input parameter.
 * The methods complete, fail, and error returns a known enum that
 * can be used for the worker controller return assertion.
 * @param options input variables and/or customs headers expected to
 * be received by the worker from the workflow.
 * @returns job completion status.
 */
export function createFakeWorkerJob<
  WorkerInputVariables = IInputVariables,
  CustomHeaderShape = ICustomHeaders,
  WorkerOutputVariables = IOutputVariables,
>(options?: {
  variables?: WorkerInputVariables;
  customHeaders?: CustomHeaderShape;
}): ZeebeJob<WorkerInputVariables, CustomHeaderShape, WorkerOutputVariables> {
  const job = {
    variables: options?.variables,
    customHeaders: options?.customHeaders,
  } as ZeebeJob<WorkerInputVariables, CustomHeaderShape, WorkerOutputVariables>;
  job.complete = jest.fn().mockImplementation(
    (updatedVariables?: WorkerOutputVariables) =>
      ({
        resultType: MockedZeebeJobResult.Complete,
        outputVariables: updatedVariables,
      } as FakeWorkerJobResult),
  );
  job.fail = jest.fn().mockImplementation(
    (errorMessage: string, retries?: number) =>
      ({
        resultType: MockedZeebeJobResult.Fail,
        errorMessage,
        retries,
      } as FakeWorkerJobResult),
  );
  job.error = jest.fn().mockImplementation(
    (errorCode: string, errorMessage?: string) =>
      ({
        resultType: MockedZeebeJobResult.Error,
        errorCode,
        errorMessage,
      } as FakeWorkerJobResult),
  );
  return job;
}
