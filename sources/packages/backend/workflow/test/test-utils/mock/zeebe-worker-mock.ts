import { PublishMessageRequest, ZBClient, ZeebeJob } from "zeebe-node";
import { Workers } from "@sims/services/constants";
import {
  WorkflowParentScopes,
  WorkflowServiceTasks,
} from "../constants/workflow-variables-constants";

/**
 * Zeebe client to be used in mock implementation
 * of the workers.
 */
const zeebeWorkerClient = new ZBClient();

/**
 * Mock task handler which returns job complete
 * with the mock data set at create process instance level
 * for that particular worker.
 * @param job worker job.
 * @returns mock task handler response.
 */
export async function mockTaskHandler(job: ZeebeJob<unknown>) {
  setTimeout(() => {
    // Check if there is a message to be published.
    const messagePayloads = getMessagePayload(job);
    if (messagePayloads?.length) {
      for (const messagePayload of messagePayloads) {
        zeebeWorkerClient.publishMessage(messagePayload);
      }
    }
  }, 1000);
  // Get the expected object to be returned. If no object is
  // present, a 'complete' result will be returned.
  const serviceTaskId = getScopedServiceTaskId(job);

  return job.complete({
    [serviceTaskId]: true,
    ...job.variables[`${serviceTaskId}-result`],
  });
}

/**
 * The service task id (a.k.a. elementId) is unique in the workflow where it is present but
 * can exist in multiple sub-processes (e.g. 'create-income-request'). In this case a special
 * variable, named as 'parentScopes', is used to create a unique service task id.
 * The 'parentScopes' variable is a list that can be appended with multiple scopes allowing
 * uniquely identifying the service ids at any level, for instance, a sub-process calling
 * a sub-process.
 * @param job worker job.
 * @returns unique service task id.
 */
function getScopedServiceTaskId(job: ZeebeJob<unknown>): string {
  // Check if the service task id is in a sub-process.
  const parentScopes: string[] | undefined = job.variables["parentScopes"];
  if (parentScopes?.length) {
    const scopedElementId = [...parentScopes, job.elementId];
    return scopedElementId.join("-");
  }
  // If the element is not in a sub-process just return the element id.
  return job.elementId;
}

/**
 * When the workflow also expects a message to proceed, the worker can send the
 * message if its expected mock result is present in the job variables.
 * @param job worker job.
 * @returns message payload to be sent by the worker to the workflow.
 */
function getMessagePayload(
  job: ZeebeJob<unknown> | undefined,
): PublishMessageRequest<unknown>[] {
  const serviceTaskId = getScopedServiceTaskId(job);
  const messagePayload = job.variables[`${serviceTaskId}-message-result`];
  if (messagePayload) {
    return messagePayload;
  }
  return undefined;
}

export function createMockedWorkerResult(
  serviceTaskId: WorkflowServiceTasks,
  options: {
    jobCompleteMock?: unknown;
    jobMessageMocks?: PublishMessageRequest<unknown>[];
    scopes?: WorkflowParentScopes[];
  },
): Record<string, unknown> {
  let fullServiceTaskId = serviceTaskId.toString();
  if (options?.scopes?.length) {
    fullServiceTaskId = [...options.scopes, fullServiceTaskId].join("-");
  }
  const mockedWorkerResult: Record<string, unknown> = {};
  if (options.jobCompleteMock) {
    mockedWorkerResult[`${fullServiceTaskId}-result`] = options.jobCompleteMock;
  }
  if (options.jobMessageMocks?.length) {
    mockedWorkerResult[`${fullServiceTaskId}-message-result`] =
      options.jobMessageMocks;
  }
  return mockedWorkerResult;
}

/**
 * Zeebe client with mocked worker implementations.
 */
export class ZeebeMockedClient {
  private static mockedZeebeClient: ZBClient;

  static getMockedZeebeInstance() {
    if (!ZeebeMockedClient.mockedZeebeClient) {
      const fakeWorkers = Object.values(Workers).map((taskType) => ({
        taskType,
        taskHandler: mockTaskHandler,
      }));
      ZeebeMockedClient.mockedZeebeClient = new ZBClient();
      fakeWorkers.forEach((fakeWorker) =>
        ZeebeMockedClient.mockedZeebeClient.createWorker(fakeWorker),
      );
    }
    return ZeebeMockedClient.mockedZeebeClient;
  }
}
