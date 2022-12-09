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

export function createFakeWorkerJob<
  WorkerInputVariables = IInputVariables,
  CustomHeaderShape = ICustomHeaders,
  WorkerOutputVariables = IOutputVariables,
>(options?: {
  variables?: WorkerInputVariables;
  customHeaders?: CustomHeaderShape;
}) {
  const job = {
    variables: options?.variables,
    customHeaders: options?.customHeaders,
  } as ZeebeJob<WorkerInputVariables, CustomHeaderShape, WorkerOutputVariables>;
  job.complete = jest.fn().mockResolvedValue(MockedZeebeJobResult.Complete);
  job.fail = jest.fn().mockResolvedValue(MockedZeebeJobResult.Fail);
  job.error = jest.fn().mockResolvedValue(MockedZeebeJobResult.Error);
  return job;
}
