import {
  ICustomHeaders,
  IInputVariables,
  IOutputVariables,
  ZeebeJob,
} from "zeebe-node";

export enum MockedZeebeJobResult {
  Complete = "complete",
  Fail = "fail",
  Error = "error",
}

export const FAKE_WORKER_JOB_RESULT_PROPERTY = "resultType";

export interface FakeWorkerJobResult {
  [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult;
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
  job.complete = jest.fn().mockResolvedValue({
    resultType: MockedZeebeJobResult.Complete,
  } as FakeWorkerJobResult);
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
