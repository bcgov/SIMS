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
import {
  Application,
  QueueConfiguration,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import {
  CancelAssessmentQueueInDTO,
  QueueService,
  StartAssessmentQueueInDTO,
} from "@sims/services/queue";
import { AssessmentWorkflowEnqueueRetryScheduler } from "../assessment-workflow-enqueuer-retry.scheduler";

describe(
  describeProcessorRootTest(QueueNames.AssessmentWorkflowQueueRetry),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let retryProcessor: AssessmentWorkflowEnqueueRetryScheduler;
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
      retryProcessor = app.get(AssessmentWorkflowEnqueueRetryScheduler);
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

    it("Should queue an assessment with 'queued' status when it has this status for more than the time configured for the queue.", async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.Queued;
      // Gets one hour more than the needed time for the assessment retry.
      currentAssessment.updatedAt =
        await getAmountOfHoursAssessmentRetryWithHourOffset(1);
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const job = createMock<Job<void>>();

      // Act
      await retryProcessor.enqueueAssessmentRetryOperations(job);

      // Assert
      // Load application and related assessments for assertion.
      const updatedApplication = await loadApplicationDataForAssertions(
        application.id,
      );
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: updatedApplication.currentAssessment.id,
      } as StartAssessmentQueueInDTO;
      expect(startApplicationAssessmentQueueMock.add).toBeCalledWith(queueData);
    });

    it("Should queue an assessment for cancellation with 'cancelation queued' status when it has this status for more than the time configured for the queue.", async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationQueued;
      // Gets one hour more than the needed time for the assessment retry.
      currentAssessment.updatedAt =
        await getAmountOfHoursAssessmentRetryWithHourOffset(1);
      await db.studentAssessment.save(currentAssessment);
      // Retry job.
      const job = createMock<Job<void>>();

      // Act
      await retryProcessor.enqueueAssessmentRetryOperations(job);

      // Assert
      // Load application and related assessments for assertion.
      const updatedApplication = await loadApplicationDataForAssertions(
        application.id,
      );
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: updatedApplication.currentAssessment.id,
      } as CancelAssessmentQueueInDTO;
      expect(cancelApplicationAssessmentQueueMock.add).toBeCalledWith(
        queueData,
      );
    });

    it("Should not queue an assessment with 'queued' status when it has this status for less than the time configured for the queue.", async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.Queued;

      // Gets one hour less than the needed time for the assessment retry.
      currentAssessment.updatedAt =
        await getAmountOfHoursAssessmentRetryWithHourOffset(-1);
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const job = createMock<Job<void>>();

      // Act
      await retryProcessor.enqueueAssessmentRetryOperations(job);

      // Assert
      // Load application and related assessments for assertion.
      const updatedApplication = await loadApplicationDataForAssertions(
        application.id,
      );
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: updatedApplication.currentAssessment.id,
      } as StartAssessmentQueueInDTO;
      expect(startApplicationAssessmentQueueMock.add).not.toBeCalledWith(
        queueData,
      );
    });

    it("Should not queue an assessment cancellation with 'cancellation queued' status when it has this status for less than the time configured for the queue.", async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource);
      const currentAssessment = application.currentAssessment;
      currentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.Queued;

      // Gets one hour less than the needed time for the assessment retry.
      currentAssessment.updatedAt =
        await getAmountOfHoursAssessmentRetryWithHourOffset(-1);
      await db.studentAssessment.save(currentAssessment);

      // Retry job.
      const job = createMock<Job<void>>();

      // Act
      await retryProcessor.enqueueAssessmentRetryOperations(job);

      // Assert
      // Load application and related assessments for assertion.
      const updatedApplication = await loadApplicationDataForAssertions(
        application.id,
      );
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: updatedApplication.currentAssessment.id,
      } as StartAssessmentQueueInDTO;
      expect(startApplicationAssessmentQueueMock.add).not.toBeCalledWith(
        queueData,
      );
    });

    /**
     * Gets date calculated from the current date minus the amount of hours assessment retry plus an hour offset.
     * @param hourOffset hour offset.
     * @returns a date calculated from the current date minus the amount of hours assessment retry plus an hour offset.
     */
    const getAmountOfHoursAssessmentRetryWithHourOffset = async (
      hourOffset: number,
    ): Promise<Date> => {
      const queueConfig: QueueConfiguration =
        await queueService.queueConfigurationDetails(
          QueueNames.AssessmentWorkflowQueueRetry,
        );
      const now = new Date();
      return addHours(
        -(
          queueConfig.queueConfiguration.amountHoursAssessmentRetry + hourOffset
        ),
        now,
      );
    };

    /**
     * Load application and assessment data needed to execute the assert operations.
     * @param applicationId application id.
     * @returns application with related assessments (currentAssessment and currentProcessingAssessment).
     */
    const loadApplicationDataForAssertions = (
      applicationId: number,
    ): Promise<Application> => {
      return db.application.findOne({
        select: {
          id: true,
          currentAssessment: {
            id: true,
          },
        },
        relations: {
          currentAssessment: true,
        },
        where: { id: applicationId },
      });
    };
  },
);
