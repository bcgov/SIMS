import { Queue } from "bull";
import { INestApplication } from "@nestjs/common";
import { QueueNames, addDays } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import { AssessmentWorkflowEnqueuerScheduler } from "../assessment-workflow-enqueuer.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAssessment,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import { getQueueProviderName } from "@sims/test-utils/mocks";
import { Not } from "typeorm";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import {
  CancelAssessmentQueueInDTO,
  StartAssessmentQueueInDTO,
} from "@sims/services/queue";

describe(
  describeProcessorRootTest(QueueNames.AssessmentWorkflowEnqueuer),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let processor: AssessmentWorkflowEnqueuerScheduler;
    let startApplicationAssessmentQueueMock: Queue<StartAssessmentQueueInDTO>;
    let cancelApplicationAssessmentQueueMock: Queue<CancelAssessmentQueueInDTO>;
    let auditUser: User;

    beforeAll(async () => {
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      auditUser = await db.user.save(createFakeUser());
      // Mocked StartApplicationAssessment queue.
      startApplicationAssessmentQueueMock = app.get(
        getQueueProviderName(QueueNames.StartApplicationAssessment),
      );
      // Mocked CancelApplicationAssessment queue.
      cancelApplicationAssessmentQueueMock = app.get(
        getQueueProviderName(QueueNames.CancelApplicationAssessment),
      );
      // Processor under test.
      processor = app.get(AssessmentWorkflowEnqueuerScheduler);
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

    it(`Should queue an assessment when an active application has only the original assessment and it is in '${StudentAssessmentStatus.Submitted}' state.`, async () => {
      // Arrange

      // Application submitted with original assessment.
      const application = await createDefaultApplication();
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      // Load application and related assessments for assertion.
      const updatedApplication = await loadApplicationDataForAssertions(
        application.id,
      );
      // Assert item was added to the queue.
      const queueData = {
        assessmentId: updatedApplication.currentProcessingAssessment.id,
      } as StartAssessmentQueueInDTO;
      expect(startApplicationAssessmentQueueMock.add).toBeCalledWith(queueData);
      // currentProcessingAssessment must be updated with the queued assessment.
      expect(updatedApplication.currentAssessment.id).toBe(
        updatedApplication.currentProcessingAssessment.id,
      );
      expect(
        updatedApplication.currentProcessingAssessment.studentAssessmentStatus,
      ).toBe(StudentAssessmentStatus.Queued);
    });

    it("Should queue the oldest pending reassessment when an active application has one completed original assessment and multiple submitted reassessments queued.", async () => {
      // Arrange

      // Application submitted with original assessment and completed assessment.
      const application = await createDefaultApplication(
        StudentAssessmentStatus.Completed,
      );
      // Oldest submitted assessment (the original one should be ignored because it is set as Completed.).
      const oldestAssessment = createFakeStudentAssessment({
        application,
        auditUser,
      });
      oldestAssessment.triggerType = AssessmentTriggerType.OfferingChange;
      oldestAssessment.createdAt = addDays(-1);
      // Newest assessment that will be saved with current date and time.
      const newestAssessment = createFakeStudentAssessment({
        application,
        auditUser,
      });
      newestAssessment.triggerType = AssessmentTriggerType.OfferingChange;
      // Save all assessments.
      await db.studentAssessment.save([oldestAssessment, newestAssessment]);
      // Updates the current assessment to the newest one.
      application.currentAssessment = newestAssessment;
      await db.application.save(application);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      // Load application and related assessments for assertion.
      const updatedApplication = await loadApplicationDataForAssertions(
        application.id,
      );
      // Assert oldest submitted assessment was added to the queue.
      const queueData = {
        assessmentId: oldestAssessment.id,
      } as StartAssessmentQueueInDTO;
      expect(startApplicationAssessmentQueueMock.add).toBeCalledWith(queueData);
      // currentProcessingAssessment must be updated with the oldest assessment
      // and currentAssessment and currentProcessingAssessment must be different.
      expect(updatedApplication.currentProcessingAssessment.id).toBe(
        oldestAssessment.id,
      );
      expect(
        updatedApplication.currentProcessingAssessment.studentAssessmentStatus,
      ).toBe(StudentAssessmentStatus.Queued);
      // Current assessment should not be updated.
      expect(updatedApplication.currentAssessment.id).toBe(newestAssessment.id);
    });

    [
      StudentAssessmentStatus.Queued,
      StudentAssessmentStatus.InProgress,
    ].forEach((status) => {
      it(`Should not queue a '${StudentAssessmentStatus.Submitted}' assessment if the another assessment has its status as '${status}'`, async () => {
        // Arrange

        // Application submitted with original assessment.
        const application = await createDefaultApplication(status);
        const submittedAssessment = createFakeStudentAssessment({
          application,
          auditUser,
        });
        submittedAssessment.triggerType = AssessmentTriggerType.OfferingChange;
        await db.studentAssessment.save(submittedAssessment);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(startApplicationAssessmentQueueMock.add).not.toBeCalled();
      });
    });

    it(`Should not queue a '${StudentAssessmentStatus.Submitted}' assessment if currentAssessment and currentProcessingAssessment are the same already.`, async () => {
      // Arrange

      // Application submitted with original assessment.
      const application = await createDefaultApplication();
      // Force currentAssessment and currentProcessingAssessment to be the same to test the SQL condition.
      application.currentProcessingAssessment = application.currentAssessment;
      await db.application.save(application);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      expect(startApplicationAssessmentQueueMock.add).not.toBeCalled();
    });

    it(`Should queue the assessment cancellation when an application has one assessment with status '${StudentAssessmentStatus.CancellationRequested}'.`, async () => {
      // Arrange

      // Application with a cancellation requested assessment.
      const application = await createDefaultApplication(
        StudentAssessmentStatus.CancellationRequested,
      );
      application.applicationStatus = ApplicationStatus.Overwritten;
      await db.application.save(application);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      await processor.processQueue(mockedJob.job);

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

      expect(updatedApplication.currentAssessment.studentAssessmentStatus).toBe(
        StudentAssessmentStatus.CancellationQueued,
      );
    });

    it(`Should not queue the assessment cancellation when an application has one assessment with status '${StudentAssessmentStatus.CancellationRequested}' but has another assessment with status '${StudentAssessmentStatus.CancellationQueued}'.`, async () => {
      // Arrange

      // Application with a cancellation queued assessment.
      const application = await createDefaultApplication(
        StudentAssessmentStatus.CancellationQueued,
      );
      const cancellationRequestedAssessment = createFakeStudentAssessment({
        application,
        auditUser,
      });
      cancellationRequestedAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationRequested;
      await db.studentAssessment.save(cancellationRequestedAssessment);
      application.applicationStatus = ApplicationStatus.Overwritten;
      await db.application.save(application);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      expect(cancelApplicationAssessmentQueueMock.add).not.toBeCalled();
    });

    /**
     * Get a default application with only one original assessment to test
     * multiple positive and negative scenarios ensuring that the only variant
     * would be the assessment status.
     * @param assessmentStatus assessment status. When not provided it will
     * be set with its default value 'Submitted'.
     * @returns application with the current assessment configured with
     * the provided student assessment.
     */
    const createDefaultApplication = async (
      assessmentStatus?: StudentAssessmentStatus,
    ): Promise<Application> => {
      const application = await saveFakeApplication(db.dataSource);
      if (assessmentStatus) {
        application.currentAssessment.studentAssessmentStatus =
          assessmentStatus;
        await db.studentAssessment.save(application.currentAssessment);
      }
      return application;
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
            studentAssessmentStatus: true,
          },
          currentProcessingAssessment: {
            id: true,
            studentAssessmentStatus: true,
          },
        },
        relations: {
          currentAssessment: true,
          currentProcessingAssessment: true,
        },
        where: { id: applicationId },
      });
    };
  },
);
