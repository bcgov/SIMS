import { Workers } from "@sims/services/constants";
import {
  JOB_COMPLETED_RESULT_SUFFIX,
  JOB_MESSAGE_RESULT_SUFFIX,
  PARENT_SUBPROCESSES_VARIABLE,
} from "../constants/mock-constants";
import { getNormalizedServiceTaskId, getPassthroughTaskId } from "./mock.utils";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import { ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { Camunda8 } from "@camunda8/sdk";

/**
 * Mock task handler which returns job complete
 * with the mock data set at create process instance level
 * for that particular worker.
 * @param job worker job.
 * @returns mock task handler response.
 */
async function mockTaskHandler(job: ZeebeJob<unknown>) {
  const serviceTaskId = getNormalizedServiceTaskId(job.elementId);
  const serviceTaskMock = job.variables[serviceTaskId] ?? {};
  // Check if the service task id is in a sub-process.
  const subprocesses: string[] =
    job.variables[PARENT_SUBPROCESSES_VARIABLE] ?? [];
  let mockedData = serviceTaskMock;
  for (const subprocessMock of subprocesses) {
    const subprocessMockId = getNormalizedServiceTaskId(subprocessMock);
    if (mockedData[subprocessMockId]) {
      mockedData = mockedData[subprocessMockId];
    } else {
      break;
    }
  }

  // Check if there is a message to be published.
  const messagePayloads = mockedData[JOB_MESSAGE_RESULT_SUFFIX];
  if (messagePayloads?.length) {
    const zeebeClient = ZeebeMockedClient.getMockedZeebeInstance();
    for (const messagePayload of messagePayloads) {
      await zeebeClient.publishMessage(messagePayload);
    }
  }
  return job.complete({
    [getPassthroughTaskId(job.elementId)]: job.elementId,
    ...mockedData[JOB_COMPLETED_RESULT_SUFFIX],
  });
}

/**
 * Zeebe client with mocked worker implementations.
 */
export class ZeebeMockedClient {
  private static mockedZeebeClient: ZeebeGrpcClient;

  static getMockedZeebeInstance() {
    if (!ZeebeMockedClient.mockedZeebeClient) {
      const fakeWorkers = Object.values(Workers).map((taskType) => ({
        taskType,
        taskHandler: mockTaskHandler,
      }));
      const camunda8 = new Camunda8();
      ZeebeMockedClient.mockedZeebeClient = camunda8.getZeebeGrpcApiClient();
      fakeWorkers.forEach((fakeWorker) =>
        ZeebeMockedClient.mockedZeebeClient.createWorker(fakeWorker),
      );
    }
    return ZeebeMockedClient.mockedZeebeClient;
  }
}
