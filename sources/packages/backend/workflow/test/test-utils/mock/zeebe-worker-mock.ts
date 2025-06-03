import { Workers } from "@sims/services/constants";
import {
  INSTANCES,
  IS_MULTI_INSTANCE,
  JOB_COMPLETED_RESULT_SUFFIX,
  JOB_MESSAGE_RESULT_SUFFIX,
  MULTI_INSTANCE_LOOP_COUNTER,
  PARENT_SUBPROCESSES_VARIABLE,
} from "../constants/mock-constants";
import { getNormalizedServiceTaskId, getPassthroughTaskId } from "./mock.utils";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import {
  ICustomHeaders,
  IInputVariables,
  IOutputVariables,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";
import { Camunda8 } from "@camunda8/sdk";

/**
 * Mock task handler which returns job complete
 * with the mock data set at create process instance level
 * for that particular worker.
 * @param job worker job.
 * @returns mock task handler response.
 */
async function mockTaskHandler(
  job: ZeebeJob<IInputVariables, ICustomHeaders, IOutputVariables>,
) {
  const serviceTaskId = getNormalizedServiceTaskId(job.elementId);
  const serviceTaskMock = job.variables[serviceTaskId] ?? {};
  let mockedData = serviceTaskMock;
  const isMultiInstance = !!serviceTaskMock[IS_MULTI_INSTANCE];
  if (isMultiInstance) {
    // If the service task is a multi-instance, we need to return the
    // appropriate value for each instance.
    const multiInstanceIndex = +job.variables[MULTI_INSTANCE_LOOP_COUNTER] - 1;
    mockedData = serviceTaskMock[INSTANCES][multiInstanceIndex];
  }
  // Check if the service task id is in a sub-process.
  const subprocesses: string[] =
    (job.variables[PARENT_SUBPROCESSES_VARIABLE] as string[]) ?? [];
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
      const camunda8 = new Camunda8({
        zeebeGrpcSettings: { ZEEBE_CLIENT_LOG_LEVEL: "ERROR" },
      });
      ZeebeMockedClient.mockedZeebeClient = camunda8.getZeebeGrpcApiClient();
      fakeWorkers.forEach((fakeWorker) =>
        ZeebeMockedClient.mockedZeebeClient.createWorker(fakeWorker),
      );
    }
    return ZeebeMockedClient.mockedZeebeClient;
  }
}
