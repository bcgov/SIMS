import { PublishMessageRequest, ZBClient, ZeebeJob } from "zeebe-node";
import { Workers } from "@sims/services/constants";
import {
  getPublishMessageResultMockId,
  getScopedServiceTaskId,
  getServiceTaskResultMockId,
} from ".";

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
async function mockTaskHandler(job: ZeebeJob<unknown>) {
  // Check if there is a message to be published.
  const messagePayloads = getMessagePayload(job);
  if (messagePayloads?.length) {
    for (const messagePayload of messagePayloads) {
      zeebeWorkerClient.publishMessage(messagePayload);
    }
  }
  // Get the expected object to be returned. If no object is
  // present, a 'complete' result will be returned.
  const serviceTaskId = getScopedServiceTaskId(job);
  return job.complete({
    [serviceTaskId]: serviceTaskId,
    ...job.variables[getServiceTaskResultMockId(serviceTaskId)],
  });
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
  const messagePayload =
    job.variables[getPublishMessageResultMockId(serviceTaskId)];
  if (messagePayload) {
    return messagePayload;
  }
  return undefined;
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
