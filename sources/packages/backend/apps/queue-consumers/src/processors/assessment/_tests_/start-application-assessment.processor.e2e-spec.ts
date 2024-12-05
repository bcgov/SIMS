import { INestApplication } from "@nestjs/common";
import { StartApplicationAssessmentProcessor } from "../start-application-assessment.processor";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../test/helpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { StudentAssessmentStatus } from "@sims/sims-db";
import { Not } from "typeorm";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
import { resetZeebeModuleMock } from "@sims/test-utils/mocks";

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
      resetZeebeModuleMock(zbClientMock);
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
      const dummyException = new Error();
      const mockedJob = mockBullJob<StartAssessmentQueueInDTO>({
        workflowName: "dummy-workflow-name",
        assessmentId: currentAssessment.id,
      });
      zbClientMock.createProcessInstance = jest.fn().mockImplementation(() => {
        throw dummyException;
      });

      // Act/Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrow(
        "Error while starting application assessment workflow: dummy-workflow-name",
      );
    });

    it(`Should log a warn message when the assessment status is different than ${StudentAssessmentStatus.Queued}.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const mockedJob = mockBullJob<StartAssessmentQueueInDTO>({
        assessmentId: application.currentAssessment.id,
      });

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      // Assert expected result message.
      expect(result).toEqual([
        "Workflow process not executed due to the assessment not being in the correct status.",
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
        "Error(s): 0, Warning(s): 2, Info: 2",
      ]);
      expect(
        mockedJob.containLogMessages([
          "Workflow process not executed due to the assessment not being in the correct status.",
          `Assessment id ${mockedJob.job.data.assessmentId} is not in ${StudentAssessmentStatus.Queued} status.`,
        ]),
      ).toBe(true);
      expect(mockedJob.job.discard).toBeCalled();
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
      const mockedJob = mockBullJob<StartAssessmentQueueInDTO>({
        workflowName,
        assessmentId: application.currentAssessment.id,
      });

      // Act
      await processor.processQueue(mockedJob.job);

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
