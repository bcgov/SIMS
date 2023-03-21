import { AssessmentConsolidatedData } from "../../models";
import { Duration, ZBClient, ZBWorkerConfig } from "zeebe-node";
import { ApplicationExceptionStatus, ProgramInfoStatus } from "@sims/sims-db";

interface FakeAssessmentVariables {
  e2eTestStudentStatus: string;
  e2eTestApplicationExceptionStatus: ApplicationExceptionStatus;
  e2ePIRStatus: ProgramInfoStatus;
}

const fakeWorkers: ZBWorkerConfig<FakeAssessmentVariables, unknown, unknown>[] =
  [
    {
      taskType: "associate-workflow-instance",
      taskHandler: (job) => job.complete(),
    },
    {
      taskType: "save-disbursement-schedules",
      taskHandler: (job) => job.complete(),
    },
    { taskType: "save-assessment-data", taskHandler: (job) => job.complete() },
    { taskType: "update-noa-status", taskHandler: (job) => job.complete() },
    {
      taskType: "load-assessment-consolidated-data",
      taskHandler: (job) =>
        job.complete(getMockConsolidatedData(job.variables)),
    },
    {
      taskType: "update-application-status",
      taskHandler: (job) => job.complete(),
    },
    {
      taskType: "verify-application-exceptions",
      taskHandler: (job) => job.complete(),
    },
    {
      taskType: "program-info-request",
      taskHandler: (job) => job.complete(),
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
        });
      },
    },
    {
      taskType: "check-income-request",
      taskHandler: (job) => job.complete(),
    },
    {
      taskType: "associate-msfaa",
      taskHandler: (job) => job.complete(),
    },
  ];

export function getMockConsolidatedData(
  jobVariables?: FakeAssessmentVariables,
): Partial<AssessmentConsolidatedData> {
  if (!jobVariables) {
    return;
  }
  const consolidatedData = {} as AssessmentConsolidatedData;
  if (jobVariables.e2eTestStudentStatus === "independentSingleStudent") {
    consolidatedData.studentDataDependantstatus = "independant";
    consolidatedData.studentDataRelationshipStatus = "single";
    consolidatedData.studentDataTaxReturnIncome = 40000;
  }

  if (
    jobVariables.e2eTestApplicationExceptionStatus ===
    ApplicationExceptionStatus.Approved
  ) {
    consolidatedData.applicationExceptionStatus =
      ApplicationExceptionStatus.Approved;
  }

  if (jobVariables.e2ePIRStatus === ProgramInfoStatus.notRequired) {
    consolidatedData.studentDataSelectedOffering = 1;
  }

  return consolidatedData;
}

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
