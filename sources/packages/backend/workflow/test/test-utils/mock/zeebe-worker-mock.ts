import { ZBClient, ZeebeJob } from "zeebe-node";
import { Workers } from "@sims/services/constants";
import { getScopedServiceTaskId } from ".";
import {
  JOB_COMPLETED_RESULT_SUFFIX,
  JOB_MESSAGE_RESULT_SUFFIX,
  PARENT_SUBPROCESSES_VARIABLE,
} from "../constants/mock-constants";

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
  const serviceTaskMock = job.variables[job.elementId] ?? {};
  // Check if the service task id is in a sub-process.
  const subprocesses: string[] =
    job.variables[PARENT_SUBPROCESSES_VARIABLE] ?? [];
  let mockedData = serviceTaskMock;
  for (const subprocessMock of subprocesses) {
    if (mockedData[subprocessMock]) {
      mockedData = mockedData[subprocessMock];
    } else {
      break;
    }
  }
  // Check if there is a message to be published.
  const messagePayloads = mockedData[JOB_MESSAGE_RESULT_SUFFIX];
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
    ...mockedData[JOB_COMPLETED_RESULT_SUFFIX],
  });
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
