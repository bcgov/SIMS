import { ZBClient } from "zeebe-node";
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

describe(
  describeProcessorRootTest(QueueNames.StartApplicationAssessment),
  () => {
    let app: INestApplication;
    let processor: StartApplicationAssessmentProcessor;
    let zbClientMock: ZBClient;

    beforeAll(async () => {
      const { nestApplication, zbClient } = await createTestingAppModule();
      app = nestApplication;
      zbClientMock = zbClient;
      // Processor under test.
      processor = app.get(StartApplicationAssessmentProcessor);
    });

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("Should log an error when the workflow createProcessInstance method throws an unexpected error.", async () => {
      // Arrange
      const dummyException = new Error("Dummy error");
      const job = createMock<Job<StartAssessmentQueueInDTO>>({
        data: {
          workflowName: "dummy-workflow-name",
          assessmentId: 9999,
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

    it("Should invoke the workflow create instance method with the received job parameters.", async () => {
      // Arrange
      const workflowName = "dummy workflow name";
      const assessmentId = 999;
      const variables = { assessmentId };
      // Queued job.
      const job = createMock<Job<StartAssessmentQueueInDTO>>({
        data: {
          workflowName,
          assessmentId,
        },
      });

      // Act
      await processor.startAssessment(job);

      // Assert
      expect(zbClientMock.createProcessInstance).toHaveBeenCalledWith(
        workflowName,
        variables,
      );
    });
  },
);
