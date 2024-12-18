import { INestApplication } from "@nestjs/common";
import { CancelAssessmentQueueInDTO } from "@sims/services/queue";
import { QueueNames, addDays } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../test/helpers";
import { CancelApplicationAssessmentProcessor } from "../cancel-application-assessment.processor";
import { DataSource, Repository } from "typeorm";
import {
  createE2EDataSources,
  createFakeDisbursementOveraward,
  createFakeStudentAssessment,
  E2EDataSources,
  getProviderInstanceForModule,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementOveraward,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  OfferingIntensity,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import * as faker from "faker";
import { AssessmentSequentialProcessingService } from "@sims/services";
import { TestingModule } from "@nestjs/testing";
import { QueueConsumersModule } from "../../../../src/queue-consumers.module";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

describe(
  describeProcessorRootTest(QueueNames.CancelApplicationAssessment),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let processor: CancelApplicationAssessmentProcessor;
    let zbClientMock: ZeebeGrpcClient;
    let appDataSource: DataSource;
    let studentAssessmentRepo: Repository<StudentAssessment>;
    let disbursementOverawardRepo: Repository<DisbursementOveraward>;
    let disbursementScheduleRepo: Repository<DisbursementSchedule>;
    let testingModule: TestingModule;

    beforeAll(async () => {
      const { nestApplication, module, dataSource, zbClient } =
        await createTestingAppModule();
      app = nestApplication;
      testingModule = module;
      zbClientMock = zbClient;
      appDataSource = dataSource;
      studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
      disbursementOverawardRepo = dataSource.getRepository(
        DisbursementOveraward,
      );
      disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
      // Processor under test.
      processor = app.get(CancelApplicationAssessmentProcessor);
      db = createE2EDataSources(dataSource);
    });

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("Should cancel the assessment pending disbursements and rollback overawards when the cancelled application has overawards and also one sent and one pending disbursements.", async () => {
      // Arrange
      const workflowInstanceId = faker.datatype
        .number({
          min: 1000000000,
          max: 9999999999,
        })
        .toString();
      // Application and disbursements.
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        null,
        {
          applicationStatus: ApplicationStatus.Cancelled,
          createSecondDisbursement: true,
        },
      );
      // Adjust assessment.
      const studentAssessment = application.currentAssessment;
      studentAssessment.assessmentWorkflowId = workflowInstanceId;
      studentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationQueued;
      await studentAssessmentRepo.save(application.currentAssessment);
      // Adjust disbursements.
      const [firstDisbursement, secondDisbursement] =
        studentAssessment.disbursementSchedules;
      firstDisbursement.disbursementScheduleStatus =
        DisbursementScheduleStatus.Sent;
      await disbursementScheduleRepo.save(firstDisbursement);
      // Add a student overaward.
      const overaward = createFakeDisbursementOveraward({
        student: application.student,
        studentAssessment,
      });
      await disbursementOverawardRepo.save(overaward);
      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId: studentAssessment.id,
      });

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(zbClientMock.cancelProcessInstance).toBeCalledWith(
        workflowInstanceId,
      );
      expect(result).toEqual(["Assessment cancelled with success."]);
      expect(
        mockedJob.containLogMessages([
          `Cancelling application assessment id ${studentAssessment.id}`,
          `Found workflow id ${workflowInstanceId}.`,
          "Workflow instance successfully cancelled.",
          "Changing student assessment status to Cancelled.",
          "Assessment status updated to Cancelled.",
          "Rolling back overawards, if any.",
          "Overawards rollback check executed.",
          "Assessing if there is a future impacted application that need to be reassessed.",
          "No impacts were detected on future applications.",
        ]),
      ).toBe(true);

      // Assert that overawards were soft deleted.
      const updatedOveraward = await disbursementOverawardRepo.findOne({
        where: { id: overaward.id },
        withDeleted: true,
      });
      expect(updatedOveraward.deletedAt).toBeDefined();

      // Assert sent disbursement was not affected.
      const firstDisbursementUpdated = await disbursementScheduleRepo.findOneBy(
        { id: firstDisbursement.id },
      );
      expect(firstDisbursementUpdated.disbursementScheduleStatus).toBe(
        DisbursementScheduleStatus.Sent,
      );

      // Assert pending disbursement was cancelled.
      const secondDisbursementUpdated =
        await disbursementScheduleRepo.findOneBy({ id: secondDisbursement.id });
      expect(secondDisbursementUpdated.disbursementScheduleStatus).toBe(
        DisbursementScheduleStatus.Cancelled,
      );
    });

    it("Should cancel the assessment and log a warning when the workflowInstanceId is not present.", async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        null,
        { applicationStatus: ApplicationStatus.Overwritten },
      );
      const studentAssessment = application.currentAssessment;
      studentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationQueued;
      await db.studentAssessment.save(studentAssessment);
      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId: studentAssessment.id,
      });

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(zbClientMock.cancelProcessInstance).not.toHaveBeenCalled();
      expect(result).toEqual([
        "Assessment cancelled with success.",
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
        "Error(s): 0, Warning(s): 1, Info: 8",
      ]);
      expect(
        mockedJob.containLogMessage(
          "Assessment was queued to be cancelled but there is no workflow ID associated with. " +
            "This is considered a normal scenario for cancellations that never transitioned to the 'In Progress' state.",
        ),
      ).toBe(true);
    });

    it(`Should log a warning message when the assessment has status different than ${StudentAssessmentStatus.CancellationQueued}.`, async () => {
      // Arrange
      const application = await saveFakeApplication(appDataSource);
      const studentAssessment = application.currentAssessment;

      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId: studentAssessment.id,
      });

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      expect(zbClientMock.cancelProcessInstance).not.toHaveBeenCalled();
      expect(
        mockedJob.containLogMessages([
          `Assessment id ${mockedJob.job.data.assessmentId} is not in ${StudentAssessmentStatus.CancellationQueued} status.`,
          "Workflow cancellation process not executed due to the assessment cancellation not being in the correct status.",
        ]),
      );

      expect(mockedJob.job.discard).toBeCalled();
    });

    it("Should throw an error and call job.discard when the application is not in the expected status.", async () => {
      // Arrange
      const errorMessage = `Application must be in the ${ApplicationStatus.Cancelled} or ${ApplicationStatus.Overwritten} state to have the assessment cancelled.`;
      const expectedError = new Error(errorMessage);
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        null,
        { applicationStatus: ApplicationStatus.Completed },
      );
      const studentAssessment = application.currentAssessment;
      studentAssessment.studentAssessmentStatus =
        StudentAssessmentStatus.CancellationQueued;
      await db.studentAssessment.save(studentAssessment);
      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId: studentAssessment.id,
      });

      // Act and Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toStrictEqual(
        expectedError,
      );
      expect(mockedJob.job.discard).toBeCalled();
    });

    it("Should throw an error and call job.discard when the assessment id was not found.", async () => {
      // Arrange
      const assessmentId = 9999;
      const errorMessage = `Assessment id ${assessmentId} was not found.`;
      const error = new Error(errorMessage);
      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId,
      });

      // Act and Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toStrictEqual(
        error,
      );
      expect(mockedJob.job.discard).toBeCalled();
    });

    it("Should find an impacted application and create a reassessment when canceling an application with a assessment date set in the current assessment.", async () => {
      // Arrange

      // Create the student to be shared across all these applications.
      const student = await saveFakeStudent(db.dataSource);
      // Application in the past that must be ignored.
      await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: addDays(-1),
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
        },
      );
      // Application to have the cancellation requested.
      // Because the assessment date is set, this application must find the future impacted application.
      const currentApplicationToCancel = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Cancelled,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: new Date(),
            studentAssessmentStatus: StudentAssessmentStatus.CancellationQueued,
          },
        },
      );
      // Application in the future of the currentApplicationToCancel.
      const impactedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: addDays(1),
            studentAssessmentStatus: StudentAssessmentStatus.Submitted,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId: currentApplicationToCancel.currentAssessment.id,
      });

      // Act
      await processor.processQueue(mockedJob.job);

      // Asserts
      expect(
        mockedJob.containLogMessage(
          `Application id ${impactedApplication.id} was detected as impacted and will be reassessed.`,
        ),
      ).toBe(true);
      // Assert that an reassessment of type 'Related application changed' was created in the future impacted application.
      const updatedImpactedApplication = await findImpactedApplication(
        impactedApplication.id,
      );
      expect(updatedImpactedApplication.currentAssessment.triggerType).toBe(
        AssessmentTriggerType.RelatedApplicationChanged,
      );
    });

    it("Should not find an impacted application when the application being cancelled never had an assessment date.", async () => {
      // Arrange

      // Create the student to be shared across all these applications.
      const student = await saveFakeStudent(db.dataSource);
      // Application to have the cancellation requested.
      // Because the assessment date was never set no future applications should be found.
      const currentApplicationToCancel = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Cancelled,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: undefined,
            studentAssessmentStatus: StudentAssessmentStatus.CancellationQueued,
          },
        },
      );
      // Application in the future of the currentApplicationToCancel.
      await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: addDays(1),
            studentAssessmentStatus: StudentAssessmentStatus.Submitted,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId: currentApplicationToCancel.currentAssessment.id,
      });

      // Act
      await processor.processQueue(mockedJob.job);

      // Asserts
      expect(
        mockedJob.containLogMessage(
          "No impacts were detected on future applications.",
        ),
      ).toBe(true);
    });

    it("Should find an impacted application and create a reassessment when the impacted application original assessment calculation date is after the cancelled assessment date original assessment, including 'Overwritten' records.", async () => {
      // Arrange

      // Create the student to be shared across all these applications.
      const student = await saveFakeStudent(db.dataSource);
      // Current application to be cancelled in Overwritten status because was edited.
      const currentApplicationToCancelOverwritten =
        await saveFakeApplicationDisbursements(
          db.dataSource,
          { student },
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Overwritten,
            currentAssessmentInitialValues: {
              assessmentWorkflowId: "some fake id",
              assessmentDate: addDays(-1),
              studentAssessmentStatus: StudentAssessmentStatus.Completed,
            },
          },
        );
      // Current application to be cancelled.
      const currentApplicationToCancel = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Cancelled,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: addDays(1),
            studentAssessmentStatus: StudentAssessmentStatus.CancellationQueued,
          },
        },
      );
      // Force pastOverwrittenApplication and pastApplication to share the same application number.
      currentApplicationToCancel.applicationNumber =
        currentApplicationToCancelOverwritten.applicationNumber;
      await db.application.save(currentApplicationToCancel);
      // Application in the future of the currentApplicationToCancelOverwritten but before
      // the last assessment date from currentApplicationToCancel.
      const impactedApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Assessment,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: new Date(),
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId: currentApplicationToCancel.currentAssessment.id,
      });

      // Act
      await processor.processQueue(mockedJob.job);

      // Asserts
      expect(
        mockedJob.containLogMessage(
          `Application id ${impactedApplication.id} was detected as impacted and will be reassessed.`,
        ),
      ).toBe(true);
      // Assert that an reassessment of type 'Related application changed' was created in the future impacted application.
      const updatedImpactedApplication = await findImpactedApplication(
        impactedApplication.id,
      );
      expect(updatedImpactedApplication.currentAssessment.triggerType).toBe(
        AssessmentTriggerType.RelatedApplicationChanged,
      );
    });

    it("Should not find an impacted application when the application in the future has only a declined COE.", async () => {
      // Arrange

      // Create the student to be shared across all these applications.
      const student = await saveFakeStudent(db.dataSource);
      // Application to have the cancellation requested.
      // Because the assessment date was never set no future applications should be found.
      const currentApplicationToCancel = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Cancelled,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: new Date(),
            studentAssessmentStatus: StudentAssessmentStatus.CancellationQueued,
          },
        },
      );
      // Application in the future of the currentApplicationToCancel.
      await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: addDays(1),
            studentAssessmentStatus: StudentAssessmentStatus.Submitted,
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.declined,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
        assessmentId: currentApplicationToCancel.currentAssessment.id,
      });

      // Act
      await processor.processQueue(mockedJob.job);

      // Asserts
      expect(
        mockedJob.containLogMessage(
          "No impacts were detected on future applications.",
        ),
      ).toBe(true);
    });

    it(
      "Should not assess for impacted application to create reassessment when an application assessment with " +
        "a declined COE is being cancelled.",
      async () => {
        // Arrange
        // Create the student to be shared across all these applications.
        const student = await saveFakeStudent(db.dataSource);

        // Current application to be cancelled with a declined COE.
        const currentApplicationToCancel =
          await saveFakeApplicationDisbursements(
            db.dataSource,
            { student },
            {
              offeringIntensity: OfferingIntensity.partTime,
              applicationStatus: ApplicationStatus.Cancelled,
              currentAssessmentInitialValues: {
                assessmentWorkflowId: "some fake id",
                assessmentDate: new Date(),
                studentAssessmentStatus:
                  StudentAssessmentStatus.CancellationQueued,
              },
              firstDisbursementInitialValues: { coeStatus: COEStatus.declined },
            },
          );
        const futureImpactedApplication =
          await saveFakeApplicationDisbursements(
            db.dataSource,
            { student },
            {
              offeringIntensity: OfferingIntensity.partTime,
              applicationStatus: ApplicationStatus.Completed,
              currentAssessmentInitialValues: {
                assessmentWorkflowId: "some fake id",
                assessmentDate: addDays(1),
                studentAssessmentStatus: StudentAssessmentStatus.Submitted,
              },
            },
          );
        // Create related application reassessment for the future application.
        // Replicating the effect of COE getting declined for current application.
        const impactedApplicationAssessmentBeforeCancel =
          createFakeStudentAssessment(
            {
              auditUser: student.user,
              application: futureImpactedApplication,
            },
            {
              initialValue: {
                triggerType: AssessmentTriggerType.RelatedApplicationChanged,
              },
            },
          );
        futureImpactedApplication.currentAssessment =
          impactedApplicationAssessmentBeforeCancel;
        await db.studentAssessment.save(
          impactedApplicationAssessmentBeforeCancel,
        );
        // Queued job.
        const mockedJob = mockBullJob<CancelAssessmentQueueInDTO>({
          assessmentId: currentApplicationToCancel.currentAssessment.id,
        });
        // Spy on assess impacted application method to make sure that it is not invoked.
        const assessmentSequentialProcessingService =
          await getProviderInstanceForModule(
            testingModule,
            QueueConsumersModule,
            AssessmentSequentialProcessingService,
          );
        const sequentialProcessingServiceSpy = jest.spyOn(
          assessmentSequentialProcessingService,
          "assessImpactedApplicationReassessmentNeeded",
        );

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        // Ensure that the cancellation did not create a new reassessment for the
        // future impacted application.
        const impactedApplicationCurrentAssessment =
          await findImpactedApplication(futureImpactedApplication.id);
        expect(impactedApplicationCurrentAssessment.currentAssessment.id).toBe(
          impactedApplicationAssessmentBeforeCancel.id,
        );
        // Also assert that method to assess impacted application was not called.
        expect(sequentialProcessingServiceSpy).not.toHaveBeenCalled();
      },
    );

    /**
     * Find a future impacted application to be asserted.
     * @param applicationId application to be find.
     * @returns future impacted application to be asserted.
     */
    async function findImpactedApplication(
      applicationId: number,
    ): Promise<Application> {
      return db.application.findOne({
        select: {
          id: true,
          currentAssessment: {
            id: true,
            triggerType: true,
          },
        },
        relations: {
          currentAssessment: true,
        },
        where: {
          id: applicationId,
        },
      });
    }
  },
);
