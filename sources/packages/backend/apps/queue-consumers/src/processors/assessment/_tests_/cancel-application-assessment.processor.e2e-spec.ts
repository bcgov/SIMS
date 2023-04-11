import { ZBClient } from "zeebe-node";
import { Job } from "bull";
import { createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { CancelAssessmentQueueInDTO } from "@sims/services/queue";
import { resetMockedZeebeModule } from "@sims/test-utils/mocks/zeebe-client-mock";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../test/helpers";
import { CancelApplicationAssessmentProcessor } from "../cancel-application-assessment.processor";
import { DataSource, Repository } from "typeorm";
import {
  createFakeDisbursementOveraward,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  DisbursementOveraward,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  StudentAssessment,
} from "@sims/sims-db";

describe(
  describeProcessorRootTest(QueueNames.CancelApplicationAssessment),
  () => {
    let app: INestApplication;
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
    });

    beforeEach(() => {
      resetMockedZeebeModule(zbClientMock);
    });

    it("Should cancel pending disbursements and rollback overawards when the cancelled application has overawards and also one sent and one pending disbursements.", async () => {
      // Arrange
      const workflowInstanceId = "2251799814028835";
      // Application and disbursements.
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        null,
        {
          applicationStatus: ApplicationStatus.Cancelled,
          createSecondDisbursement: true,
        },
      );
      // Adjust assessment
      const studentAssessment = application.currentAssessment;
      studentAssessment.assessmentWorkflowId = workflowInstanceId;
      await studentAssessmentRepo.save(application.currentAssessment);
      // Adjust disbursements
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

      const job = createMock<Job<CancelAssessmentQueueInDTO>>({
        data: { assessmentId: studentAssessment.id },
      });

      // Act
      const result = await processor.cancelAssessment(job);

      // Assert
      expect(zbClientMock.cancelProcessInstance).toBeCalledWith(
        workflowInstanceId,
      );
      expect(result.summary).toContain(
        "Workflow instance successfully cancelled.",
      );
      expect(result.summary).toContain("Assessment cancelled with success.");

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

    it("Should cancel workflow and log a warning when the workflowInstanceId is not present.", async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        null,
        { applicationStatus: ApplicationStatus.Overwritten },
      );
      const studentAssessment = application.currentAssessment;
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
      const job = createMock<Job<CancelAssessmentQueueInDTO>>({
        data: { assessmentId },
      });

      // Act and Assert
      await expect(processor.cancelAssessment(job)).rejects.toStrictEqual(
        error,
      );
      expect(job.discard).toBeCalled();
    });
  },
);
