import { ZBClient } from "zeebe-node";
import { Job } from "bull";
import { createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { StartApplicationAssessmentProcessor } from "../start-application-assessment.processor";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { resetMockedZeebeModule } from "@sims/test-utils/mocks/zeebe-client-mock";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../test/helpers";

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
      resetMockedZeebeModule(zbClientMock);
    });

    it("Should thrown an error when the workflow createProcessInstance method throws an error.", async () => {
      // Arrange
      const dummyException = new Error("Dummy error");
      const job = createMock<Job<StartAssessmentQueueInDTO>>();
      zbClientMock.createProcessInstance = jest.fn().mockImplementation(() => {
        throw dummyException;
      });

      // Act and Assert.
      await expect(processor.startAssessment(job)).rejects.toBe(dummyException);
    });

    it("Should invoke the workflow create instance method with the received job parameters.", async () => {
      // Arrange
      const workflowName = "dummy workflow name";
      const assessmentId = 999;
      const variables = { assessmentId };
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
