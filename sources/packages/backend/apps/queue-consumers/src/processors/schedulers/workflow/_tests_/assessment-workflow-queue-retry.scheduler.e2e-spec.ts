import { Job, Queue } from "bull";
import { createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, addHours } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  getQueueProviderName,
  saveFakeApplication,
} from "@sims/test-utils";
import { Not } from "typeorm";
import { QueueConfiguration, StudentAssessmentStatus } from "@sims/sims-db";
import {
  CancelAssessmentQueueInDTO,
  QueueService,
  StartAssessmentQueueInDTO,
} from "@sims/services/queue";
import { WorkflowQueueRetryScheduler } from "../assessment-workflow-queue-retry.scheduler";

describe(
  describeProcessorRootTest(QueueNames.AssessmentWorkflowQueueRetry),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let retryProcessor: WorkflowQueueRetryScheduler;
    let startApplicationAssessmentQueueMock: Queue<StartAssessmentQueueInDTO>;
    let cancelApplicationAssessmentQueueMock: Queue<CancelAssessmentQueueInDTO>;
    let queueService: QueueService;

    beforeAll(async () => {
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      // Mocked StartApplicationAssessment queue.
      startApplicationAssessmentQueueMock = app.get(
        getQueueProviderName(QueueNames.StartApplicationAssessment),
      );
      // Mocked CancelApplicationAssessment queue.
      cancelApplicationAssessmentQueueMock = app.get(
        getQueueProviderName(QueueNames.CancelApplicationAssessment),
      );
      // Processor under test.
      retryProcessor = app.get(WorkflowQueueRetryScheduler);
      queueService = app.get(QueueService);
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

    it(`Should queue an assessment with ${StudentAssessmentStatus.Queued} status when it has this status for more than the time configured for the queue.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.Queued;
      const amountHoursAssessmentRetry =
        await queueService.getAmountHoursAssessmentRetry(
          QueueNames.AssessmentWorkflowQueueRetry,
        );
      // Gets one hour more than the needed time for the assessments retry.
      currentAssessment.studentAssessmentStatusUpdatedOn = addHours(
        -(amountHoursAssessmentRetry + 1),
      );
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const job = createMock<Job<void>>();

      // Act
      await retryProcessor.enqueueAssessmentRetryOperations(job);

      // Assert
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: application.currentAssessment.id,
      };
      expect(startApplicationAssessmentQueueMock.add).toBeCalledWith(queueData);
    });

    it(`Should queue an assessment for cancellation with ${StudentAssessmentStatus.CancellationQueued} status when it has this status for more than the time configured for the queue.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationQueued;
      const amountHoursAssessmentRetry =
        await queueService.getAmountHoursAssessmentRetry(
          QueueNames.AssessmentWorkflowQueueRetry,
        );
      // Gets one hour more than the needed time for the assessments retry.
      currentAssessment.studentAssessmentStatusUpdatedOn = addHours(
        -(amountHoursAssessmentRetry + 1),
      );
      await db.studentAssessment.save(currentAssessment);
      // Retry job.
      const job = createMock<Job<void>>();

      // Act
      await retryProcessor.enqueueAssessmentRetryOperations(job);

      // Assert
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: application.currentAssessment.id,
      } as CancelAssessmentQueueInDTO;
      expect(cancelApplicationAssessmentQueueMock.add).toBeCalledWith(
        queueData,
      );
    });

    it(`Should not queue an assessment with ${StudentAssessmentStatus.Queued} status when it has this status for less than the time configured for the queue.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.Queued;
      const amountHoursAssessmentRetry =
        await queueService.getAmountHoursAssessmentRetry(
          QueueNames.AssessmentWorkflowQueueRetry,
        );
      // Gets one hour less than the needed time for the assessments retry.
      currentAssessment.studentAssessmentStatusUpdatedOn = addHours(
        -(amountHoursAssessmentRetry - 1),
      );
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const job = createMock<Job<void>>();

      // Act
      await retryProcessor.enqueueAssessmentRetryOperations(job);

      // Assert
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: currentAssessment.id,
      };
      expect(startApplicationAssessmentQueueMock.add).not.toBeCalledWith(
        queueData,
      );
    });

    it(`Should not queue an assessment cancellation with ${StudentAssessmentStatus.CancellationQueued} status when it has this status for less than the time configured for the queue.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationQueued;
      const amountHoursAssessmentRetry =
        await queueService.getAmountHoursAssessmentRetry(
          QueueNames.AssessmentWorkflowQueueRetry,
        );
      // Gets one hour less than the needed time for the assessments retry.
      currentAssessment.studentAssessmentStatusUpdatedOn = addHours(
        -(amountHoursAssessmentRetry - 1),
      );
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const job = createMock<Job<void>>();

      // Act
      await retryProcessor.enqueueAssessmentRetryOperations(job);

      // Assert
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: currentAssessment.id,
      };
      expect(startApplicationAssessmentQueueMock.add).not.toBeCalledWith(
        queueData,
      );
    });
  },
);
