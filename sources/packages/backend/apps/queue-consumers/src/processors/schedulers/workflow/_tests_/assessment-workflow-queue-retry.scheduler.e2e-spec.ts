import { Queue } from "bullmq";
import { INestApplication } from "@nestjs/common";
import { QueueJobNames, QueueNames, addHours } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullMQJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { getQueueProviderName } from "@sims/test-utils/mocks";
import { Not } from "typeorm";
import { StudentAssessmentStatus } from "@sims/sims-db";
import {
  CancelAssessmentQueueInDTO,
  StartAssessmentQueueInDTO,
} from "@sims/services/queue";
import { WorkflowQueueRetryScheduler } from "../assessment-workflow-queue-retry.scheduler";
import { AssessmentWorkflowQueueRetryInDTO } from "../models/assessment-workflow-queue-retry.dto";

describe(
  describeProcessorRootTest(QueueNames.AssessmentWorkflowQueueRetry),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let retryProcessor: WorkflowQueueRetryScheduler;
    let startApplicationAssessmentQueueMock: Queue<StartAssessmentQueueInDTO>;
    let cancelApplicationAssessmentQueueMock: Queue<CancelAssessmentQueueInDTO>;
    let amountHoursAssessmentRetry: number;

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
      // Set the amount of hours for assessment retry.
      // This value is used to calculate the retry window for assessments.
      amountHoursAssessmentRetry = 6;
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
      // Gets one hour more than the needed time for the assessments retry.
      currentAssessment.studentAssessmentStatusUpdatedOn = addHours(
        -(amountHoursAssessmentRetry + 1),
      );
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const mockedJob = mockBullMQJob<AssessmentWorkflowQueueRetryInDTO>(
        {
          amountHoursAssessmentRetry,
        },
        QueueNames.AssessmentWorkflowQueueRetry,
      );

      // Act
      await retryProcessor.process(mockedJob.job);

      // Assert
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: application.currentAssessment.id,
      };
      expect(startApplicationAssessmentQueueMock.add).toHaveBeenCalledWith(
        QueueJobNames.StartApplicationAssessmentJob,
        queueData,
      );
    });

    it(`Should queue an assessment for cancellation with ${StudentAssessmentStatus.CancellationQueued} status when it has this status for more than the time configured for the queue.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationQueued;
      // Gets one hour more than the needed time for the assessments retry.
      currentAssessment.studentAssessmentStatusUpdatedOn = addHours(
        -(amountHoursAssessmentRetry + 1),
      );
      await db.studentAssessment.save(currentAssessment);
      // Retry job.
      const mockedJob = mockBullMQJob<AssessmentWorkflowQueueRetryInDTO>(
        {
          amountHoursAssessmentRetry,
        },
        QueueNames.AssessmentWorkflowQueueRetry,
      );

      // Act
      await retryProcessor.process(mockedJob.job);

      // Assert
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: application.currentAssessment.id,
      };
      expect(cancelApplicationAssessmentQueueMock.add).toHaveBeenCalledWith(
        QueueJobNames.CancelApplicationAssessmentJob,
        queueData,
      );
    });

    it(`Should not queue an assessment with ${StudentAssessmentStatus.Queued} status when it has this status for less than the time configured for the queue.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.Queued;
      // Gets one hour less than the needed time for the assessments retry.
      currentAssessment.studentAssessmentStatusUpdatedOn = addHours(
        -(amountHoursAssessmentRetry - 1),
      );
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const mockedJob = mockBullMQJob<AssessmentWorkflowQueueRetryInDTO>(
        {
          amountHoursAssessmentRetry,
        },
        QueueNames.AssessmentWorkflowQueueRetry,
      );

      // Act
      await retryProcessor.process(mockedJob.job);

      // Assert
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: currentAssessment.id,
      };
      expect(startApplicationAssessmentQueueMock.add).not.toHaveBeenCalledWith(
        QueueJobNames.StartApplicationAssessmentJob,
        queueData,
      );
    });

    it(`Should not queue an assessment cancellation with ${StudentAssessmentStatus.CancellationQueued} status when it has this status for less than the time configured for the queue.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationQueued;
      // Gets one hour less than the needed time for the assessments retry.
      currentAssessment.studentAssessmentStatusUpdatedOn = addHours(
        -(amountHoursAssessmentRetry - 1),
      );
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const mockedJob = mockBullMQJob<AssessmentWorkflowQueueRetryInDTO>(
        {
          amountHoursAssessmentRetry,
        },
        QueueNames.AssessmentWorkflowQueueRetry,
      );

      // Act
      await retryProcessor.process(mockedJob.job);

      // Assert
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: currentAssessment.id,
      };
      expect(startApplicationAssessmentQueueMock.add).not.toHaveBeenCalledWith(
        QueueJobNames.StartApplicationAssessmentJob,
        queueData,
      );
    });

    afterAll(async () => {
      await app?.close();
    });
  },
);
