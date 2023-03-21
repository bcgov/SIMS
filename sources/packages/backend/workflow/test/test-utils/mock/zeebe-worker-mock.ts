import { AssessmentConsolidatedData } from "../../models";
import { Duration, ZBClient, ZBWorkerConfig } from "zeebe-node";
import { ApplicationExceptionStatus, ProgramInfoStatus } from "@sims/sims-db";

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
      taskType: "associate-workflow-instance",
      taskHandler: (job) =>
        job.complete({ ["associate-workflow-instance"]: true }),
    },
    {
      taskType: "save-disbursement-schedules",
      taskHandler: (job) =>
        job.complete({ ["save-disbursement-schedules"]: true }),
    },
    {
      taskType: "save-assessment-data",
      taskHandler: (job) => job.complete({ ["save-assessment-data"]: true }),
    },
    {
      taskType: "update-noa-status",
      taskHandler: (job) => job.complete({ ["update-noa-status"]: true }),
    },
    {
      taskType: "load-assessment-consolidated-data",
      taskHandler: (job) =>
        job.complete(getMockConsolidatedData(job.variables)),
    },
    {
      taskType: "update-application-status",
      taskHandler: (job) =>
        job.complete({ ["update-application-status"]: true }),
    },
    {
      taskType: "verify-application-exceptions",
      taskHandler: (job) =>
        job.complete({ ["verify-application-exceptions"]: true }),
    },
    {
      taskType: "program-info-request",
      taskHandler: (job) => job.complete({ ["program-info-request"]: true }),
    },
    {
      taskType: "create-income-request",
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
          ["create-income-request"]: true,
        });
      },
    },
    {
      taskType: "check-income-request",
      taskHandler: (job) => job.complete({ ["check-income-request"]: true }),
    },
    {
      taskType: "associate-msfaa",
      taskHandler: (job) => job.complete({ ["associate-msfaa"]: true }),
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
