import { AssessmentConsolidatedData } from "../../models";
import { Duration, ZBClient, ZBWorkerConfig } from "zeebe-node";
import { ApplicationExceptionStatus, ProgramInfoStatus } from "@sims/sims-db";
import { Workers } from "../constants/worker-constants";

/**
 * Variables provided for the purpose of e2e tests
 * when creating an instance of assessment gateway workflow.
 */
interface FakeAssessmentVariables {
  e2eTestStudentStatus: string;
  e2eTestApplicationExceptionStatus: ApplicationExceptionStatus;
  e2ePIRStatus: ProgramInfoStatus;
}

const fakeWorkers: ZBWorkerConfig<FakeAssessmentVariables, unknown, unknown>[] =
  [
    {
      taskType: Workers.AssociateWorkflowInstance,
      taskHandler: (job) =>
        job.complete({ [Workers.AssociateWorkflowInstance]: true }),
    },
    {
      taskType: Workers.SaveDisbursementSchedules,
      taskHandler: (job) =>
        job.complete({ [Workers.SaveDisbursementSchedules]: true }),
    },
    {
      taskType: Workers.SaveAssessmentData,
      taskHandler: (job) =>
        job.complete({ [Workers.SaveAssessmentData]: true }),
    },
    {
      taskType: Workers.UpdateNOAStatus,
      taskHandler: (job) => job.complete({ [Workers.UpdateNOAStatus]: true }),
    },
    {
      taskType: Workers.LoadAssessmentConsolidatedData,
      taskHandler: (job) =>
        job.complete(getMockConsolidatedData(job.variables)),
    },
    {
      taskType: Workers.UpdateApplicationStatus,
      taskHandler: (job) =>
        job.complete({ [Workers.UpdateApplicationStatus]: true }),
    },
    {
      taskType: Workers.VerifyApplicationExceptions,
      taskHandler: (job) =>
        job.complete({ [Workers.VerifyApplicationExceptions]: true }),
    },
    {
      taskType: Workers.ProgramInfoRequest,
      taskHandler: (job) =>
        job.complete({ [Workers.ProgramInfoRequest]: true }),
    },
    {
      taskType: Workers.CreateIncomeRequest,
      taskHandler: (job) => {
        new ZBClient().publishMessage({
          name: "income-verified",
          correlationKey: "1",
          variables: {},
          timeToLive: Duration.seconds.of(60),
        });
        return job.complete({
          incomeVerificationCompleted: true,
          incomeVerificationId: 1,
          [Workers.CreateIncomeRequest]: true,
        });
      },
    },
    {
      taskType: Workers.CheckIncomeRequest,
      taskHandler: (job) =>
        job.complete({ [Workers.CheckIncomeRequest]: true }),
    },
    {
      taskType: Workers.AssociateMSFAA,
      taskHandler: (job) => job.complete({ [Workers.AssociateMSFAA]: true }),
    },
  ];

/**
 * Mock consolidated data according to the
 * e2e test assessment variables provided
 * in the workflow instance.
 * @param jobVariables
 * @returns assessment consolidated data.
 */
export function getMockConsolidatedData(
  jobVariables?: FakeAssessmentVariables,
): Partial<AssessmentConsolidatedData> {
  if (!jobVariables) {
    return;
  }
  const consolidatedData = {} as AssessmentConsolidatedData;
  // Single and independent student does not follow either parent
  // or the partner path in the workflow.
  if (jobVariables.e2eTestStudentStatus === "independentSingleStudent") {
    consolidatedData.studentDataDependantstatus = "independant";
    consolidatedData.studentDataRelationshipStatus = "single";
    consolidatedData.studentDataTaxReturnIncome = 40000;
  }
  // When the exception status is approved workflow is not
  // expected to wait for the application exception verification message.
  if (
    jobVariables.e2eTestApplicationExceptionStatus ===
    ApplicationExceptionStatus.Approved
  ) {
    consolidatedData.applicationExceptionStatus =
      ApplicationExceptionStatus.Approved;
  }

  // When the PIR status is not required, workflow is not
  // expected to wait for the program info request completed message.
  if (jobVariables.e2ePIRStatus === ProgramInfoStatus.notRequired) {
    consolidatedData.studentDataSelectedOffering = 1;
  }

  return consolidatedData;
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
