import { Job } from "bull";
import { createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { StartApplicationAssessmentProcessor } from "../start-application-assessment.processor";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../test/helpers";
import { LogLevels, ProcessSummary } from "@sims/utilities/logger";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { StudentAssessmentStatus } from "@sims/sims-db";
import { Not } from "typeorm";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

describe(
  describeProcessorRootTest(QueueNames.StartApplicationAssessment),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let processor: StartApplicationAssessmentProcessor;
    let zbClientMock: ZeebeGrpcClient;

    beforeAll(async () => {
      const { nestApplication, zbClient, dataSource } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      zbClientMock = zbClient;
      // Processor under test.
      processor = app.get(StartApplicationAssessmentProcessor);
    });

    beforeEach(async () => {
      jest.resetAllMocks();
      // Ensure that all assessments will be cancelled.
      await db.studentAssessment.update(
        {
          studentAssessmentStatus: Not(StudentAssessmentStatus.Cancelled),
        },
        { studentAssessmentStatus: StudentAssessmentStatus.Cancelled },
      );
    });

    it("Should log an error when the workflow createProcessInstance method throws an unexpected error.", async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.Queued;
      await db.studentAssessment.save(currentAssessment);
      const dummyException = new Error("Dummy error");
      const job = createMock<Job<StartAssessmentQueueInDTO>>({
        data: {
          workflowName: "dummy-workflow-name",
          assessmentId: currentAssessment.id,
        },
      });
      zbClientMock.createProcessInstance = jest.fn().mockImplementation(() => {
        throw dummyException;
      });
      // Capture the processSummary for later assertion.
      let processSummary: ProcessSummary;
      processor.logger.logProcessSummary = jest.fn((providedProcessSummary) => {
        processSummary = providedProcessSummary;
      });

      // Act
      const result = await processor.startAssessment(job);

      // Assert.

      // Assert process summary was provided.
      expect(processSummary).toBeDefined();
      // Assert expected result message.
      expect(result).toBe(
        "Unexpected error while executing the job, check logs for further details.",
      );
      // Assert error message was added to the logs.
      const hasExpectedLogErrorMessage = processSummary
        .flattenLogs()
        .some(
          (log) =>
            log.level === LogLevels.Error &&
            log.message.includes("Dummy error"),
        );
      expect(hasExpectedLogErrorMessage).toBeTruthy();
    });

    it(`Should log a warn message when the assessment status is different than ${StudentAssessmentStatus.Queued}.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const job = createMock<Job<StartAssessmentQueueInDTO>>({
        data: {
          workflowName: "workflow-name",
          assessmentId: application.currentAssessment.id,
        },
      });

      // Capture the processSummary for later assertion.
      let processSummary: ProcessSummary;
      processor.logger.logProcessSummary = jest.fn((providedProcessSummary) => {
        processSummary = providedProcessSummary;
      });

      // Act
      const result = await processor.startAssessment(job);

      // Assert
      // Assert expected result message.
      expect(result).toBe(
        "Workflow process not executed due to the assessment not being in the correct status.",
      );
      // Assert warn message was added to the logs.
      const hasExpectedLogWarnMessage = processSummary
        .flattenLogs()
        .some(
          (log) =>
            log.level === LogLevels.Warn &&
            log.message.includes(
              `Assessment id ${job.data.assessmentId} is not in ${StudentAssessmentStatus.Queued} status.`,
            ),
        );
      expect(hasExpectedLogWarnMessage).toBeTruthy();
      expect(job.discard).toBeCalled();
    });

    it("Should invoke the workflow create instance method with the received job parameters.", async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.Queued;
      await db.studentAssessment.save(currentAssessment);
      const workflowName = "dummy workflow name";

      const variables = { assessmentId: currentAssessment.id };
      // Queued job.
      const job = createMock<Job<StartAssessmentQueueInDTO>>({
        data: {
          workflowName,
          assessmentId: application.currentAssessment.id,
        },
      });

      // Act
      await processor.startAssessment(job);

      // Assert
      const createProcessInstancePayload = {
        bpmnProcessId: workflowName,
        variables,
      };
      expect(zbClientMock.createProcessInstance).toHaveBeenCalledWith(
        createProcessInstancePayload,
      );
    });
  },
);
