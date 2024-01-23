import { ZBClient } from "zeebe-node";
import { Job } from "bull";
import { createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { CancelAssessmentQueueInDTO } from "@sims/services/queue";
import { QueueNames, addDays } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../test/helpers";
import { CancelApplicationAssessmentProcessor } from "../cancel-application-assessment.processor";
import { DataSource, Repository } from "typeorm";
import {
  createE2EDataSources,
  createFakeDisbursementOveraward,
  E2EDataSources,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementOveraward,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  OfferingIntensity,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import * as faker from "faker";

describe(
  describeProcessorRootTest(QueueNames.CancelApplicationAssessment),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let processor: CancelApplicationAssessmentProcessor;
    let zbClientMock: ZBClient;
    let appDataSource: DataSource;
    let studentAssessmentRepo: Repository<StudentAssessment>;
    let disbursementOverawardRepo: Repository<DisbursementOveraward>;
    let disbursementScheduleRepo: Repository<DisbursementSchedule>;

    beforeAll(async () => {
      const { nestApplication, dataSource, zbClient } =
        await createTestingAppModule();
      app = nestApplication;
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
      const workflowInstanceId = faker.random
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
      const job = createMock<Job<CancelAssessmentQueueInDTO>>({
        data: { assessmentId: studentAssessment.id },
      });

      // Act
      const result = await processor.cancelAssessment(job);

      // Assert
      expect(zbClientMock.cancelProcessInstance).toBeCalledWith(
        workflowInstanceId,
      );
      expect(result.summary).toStrictEqual([
        `Cancelling application assessment id ${studentAssessment.id}`,
        `Found workflow id ${workflowInstanceId}.`,
        "Workflow instance successfully cancelled.",
        "Changing student assessment status to Cancelled.",
        "Rolling back overawards, if any.",
        "Assessment cancelled with success.",
      ]);

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
      const job = createMock<Job<CancelAssessmentQueueInDTO>>({
        data: { assessmentId: studentAssessment.id },
      });

      // Act
      const result = await processor.cancelAssessment(job);

      // Assert
      expect(zbClientMock.cancelProcessInstance).not.toHaveBeenCalled();
      expect(result.warnings).toContain(
        "Assessment was queued to be cancelled but there is no workflow id associated with.",
      );
      expect(result.summary).toContain("Assessment cancelled with success.");
    });

    it(`Should log a warning message when the assessment has status different than ${StudentAssessmentStatus.CancellationQueued}.`, async () => {
      // Arrange
      const application = await saveFakeApplication(appDataSource);
      const studentAssessment = application.currentAssessment;

      // Queued job.
      const job = createMock<Job<CancelAssessmentQueueInDTO>>({
        data: { assessmentId: studentAssessment.id },
      });

      // Act
      const result = await processor.cancelAssessment(job);

      // Assert
      expect(zbClientMock.cancelProcessInstance).not.toHaveBeenCalled();
      expect(result.warnings).toContain(
        `Assessment id ${job.data.assessmentId} is not in ${StudentAssessmentStatus.CancellationQueued} status.`,
      );
      expect(result.summary).toContain(
        "Workflow cancellation process not executed due to the assessment cancellation not being in the correct status.",
      );
      expect(job.discard).toBeCalled();
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
      const job = createMock<Job<CancelAssessmentQueueInDTO>>({
        data: { assessmentId: studentAssessment.id },
      });

      // Act and Assert
      await expect(processor.cancelAssessment(job)).rejects.toStrictEqual(
        expectedError,
      );
      expect(job.discard).toBeCalled();
    });

    it("Should throw an error and call job.discard when the assessment id was not found.", async () => {
      // Arrange
      const assessmentId = 9999;
      const errorMessage = `Assessment id ${assessmentId} was not found.`;
      const error = new Error(errorMessage);
      // Queued job.
      const job = createMock<Job<CancelAssessmentQueueInDTO>>({
        data: { assessmentId },
      });

      // Act and Assert
      await expect(processor.cancelAssessment(job)).rejects.toStrictEqual(
        error,
      );
      expect(job.discard).toBeCalled();
    });

    it.only("Should find an impacted application and create a reassessment when the impacted application original assessment calculation date is after the cancelled assessment date original assessment.", async () => {
      // TODO: add the asserts for the impactedApplication.
      // TODO: Create multiple original overwritten assessment in A with first assessment date before B and a later original assessment after C to ensure that the first original assessment from A will be considered.
      // Arrange

      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.

      // Application in the past that must be ignored.
      const pastApplication = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );

      // Application to have the cancellation requested.
      const currentApplicationToCancel = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Cancelled,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: addDays(1, new Date()),
            studentAssessmentStatus: StudentAssessmentStatus.CancellationQueued,
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
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
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: addDays(2, new Date()),
            studentAssessmentStatus: StudentAssessmentStatus.Submitted,
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );

      // Queued job.
      const job = createMock<Job<CancelAssessmentQueueInDTO>>({
        data: { assessmentId: currentApplicationToCancel.currentAssessment.id },
      });

      // Act
      await processor.cancelAssessment(job);

      // Asserts
      // TODO: asserts.
    });
  },
);
