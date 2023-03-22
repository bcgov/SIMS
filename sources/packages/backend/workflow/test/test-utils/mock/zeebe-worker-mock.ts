import { Duration, ZBClient, ZBWorkerConfig, ZeebeJob } from "zeebe-node";
import { ApplicationExceptionStatus, ProgramInfoStatus } from "@sims/sims-db";
import { Workers } from "@sims/services/constants";

/**
 * Variables provided for the purpose of e2e tests
 * when creating an instance of assessment gateway workflow.
 */
interface FakeAssessmentVariables {
  e2eTestStudentStatus: string;
  e2eTestApplicationExceptionStatus: ApplicationExceptionStatus;
  e2ePIRStatus: ProgramInfoStatus;
}
/**
 * Zeebe client to be used in mock implementation
 * of the workers.
 */
const zeebeWorkerClient = new ZBClient();

const fakeWorkers: ZBWorkerConfig<FakeAssessmentVariables, unknown, unknown>[] =
  [
    {
      taskType: Workers.AssociateWorkflowInstance,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.SaveDisbursementSchedules,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.SaveAssessmentData,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.UpdateNOAStatus,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.LoadAssessmentConsolidatedData,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.UpdateApplicationStatus,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.VerifyApplicationExceptions,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.ProgramInfoRequest,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.CreateIncomeRequest,
      taskHandler: (job) => {
        zeebeWorkerClient.publishMessage({
          name: "income-verified",
          correlationKey: "1",
          variables: {},
          timeToLive: Duration.seconds.of(60),
        });
        return job.complete({
          incomeVerificationCompleted: true,
          incomeVerificationId: 1,
          [job.elementId]: true,
        });
      },
    },
    {
      taskType: Workers.CheckIncomeRequest,
      taskHandler: mockTaskHandler,
    },
    {
      taskType: Workers.AssociateMSFAA,
      taskHandler: mockTaskHandler,
    },
  ];

/**
 * Mock task handler which returns job complete
 * with the mock data set at create process instance level
 * for that particular worker.
 * @param job worker job.
 * @returns mock task handler response.
 */
export function mockTaskHandler(job: ZeebeJob<unknown>) {
  return job.complete({
    [job.elementId]: true,
    ...job.variables[`${job.elementId}-result`],
  });
}

/**
 * Zeebe client with mocked worker implementations.
 */
export class ZeebeMockedClient {
  private static mockedZeebeClient: ZBClient;

  static getMockedZeebeInstance() {
    if (!ZeebeMockedClient.mockedZeebeClient) {
      ZeebeMockedClient.mockedZeebeClient = new ZBClient();
      fakeWorkers.forEach((fakeWorker) =>
        ZeebeMockedClient.mockedZeebeClient.createWorker(fakeWorker),
      );
    }
    return ZeebeMockedClient.mockedZeebeClient;
  }
}
