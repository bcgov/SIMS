import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementSchedule,
  createFakeNotification,
  createFakeStudentAssessment,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  DisabilityStatus,
  DisbursementScheduleStatus,
  NotificationMessage,
  NotificationMessageType,
  WorkflowData,
} from "@sims/sims-db";
import { IsNull, Not } from "typeorm";
import { StudentApplicationNotificationsScheduler } from "../../student-application-notifications/student-application-notifications.scheduler";

describe(
  describeProcessorRootTest(QueueNames.StudentApplicationNotifications),
  () => {
    let app: INestApplication;
    let processor: StudentApplicationNotificationsScheduler;
    let db: E2EDataSources;

    beforeAll(async () => {
      // Setup the app and data sources.
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      // Processor under test.
      processor = app.get(StudentApplicationNotificationsScheduler);
    });

    beforeEach(async () => {
      // Cancel all applications to ensure tha existing data will not affect these tests.
      await db.application.update(
        { applicationStatus: Not(ApplicationStatus.Cancelled) },
        { applicationStatus: ApplicationStatus.Cancelled },
      );
    });

    it(
      "Should generate a notification for PD/PPD student mismatch close to the offering end date " +
        "when the application is Assessment/Completed and at least one disbursement is pending and there is a PD/PPD mismatch.",
      async () => {
        // Arrange
        // Create a student with a non-approved disability.
        const student = await saveFakeStudent(db.dataSource, undefined, {
          initialValue: { disabilityStatus: DisabilityStatus.Requested },
        });
        // Create an application with the disability as true.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          { student },
          {
            applicationStatus: ApplicationStatus.Assessment,
            currentAssessmentInitialValues: {
              workflowData: {
                calculatedData: {
                  pdppdStatus: true,
                },
              } as WorkflowData,
            },
            createSecondDisbursement: true,
            firstDisbursementInitialValues: {
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            },
            secondDisbursementInitialValues: {
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            },
          },
        );

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.studentApplicationNotifications(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `PD/PPD mismatch assessments that generated notifications: ${application.currentAssessment.id}`,
          ]),
        ).toBe(true);
        const notification = await db.notification.findOne({
          select: {
            id: true,
            messagePayload: true,
          },
          relations: { notificationMessage: true },
          where: {
            notificationMessage: {
              id: NotificationMessageType.StudentPDPPDApplicationNotification,
            },
            dateSent: IsNull(),
            user: { id: student.user.id },
          },
        });
        expect(notification).toBeDefined();
        expect(notification.messagePayload).toStrictEqual({
          email_address: application.student.user.email,
          template_id: "7faea39f-cf8e-41ee-af02-c4790cac5b26",
          personalisation: {
            lastName: application.student.user.lastName,
            givenNames: application.student.user.firstName,
            applicationNumber: application.applicationNumber,
          },
        });
      },
    );

    it(
      "Should not generate a notification for PD/PPD student mismatch close to the offering end date " +
        "when the application is Assessment/Completed and email will be sent once for the same assessment.",
      async () => {
        // Arrange
        // Create a student with a non-approved disability.
        const student = await saveFakeStudent(db.dataSource, undefined, {
          initialValue: { disabilityStatus: DisabilityStatus.Requested },
        });
        // Create an application with the disability as true.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          { student },
          {
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              workflowData: {
                calculatedData: {
                  pdppdStatus: true,
                },
              } as WorkflowData,
            },
            firstDisbursementInitialValues: {
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            },
          },
        );

        const studentNotification = createFakeNotification(
          {
            user: student.user,
            notificationMessage: {
              id: NotificationMessageType.StudentPDPPDApplicationNotification,
            } as NotificationMessage,
          },
          {
            initialValue: {
              dateSent: new Date(),
              metadata: {
                assessmentId: application.currentAssessment.id,
              },
            },
          },
        );

        await db.notification.save(studentNotification);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.studentApplicationNotifications(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "No assessments found to generate PD/PPD mismatch notifications.",
          ]),
        ).toBe(true);
        const notificationExists = await db.notification.exists({
          relations: { notificationMessage: true },
          where: {
            notificationMessage: {
              id: NotificationMessageType.StudentPDPPDApplicationNotification,
            },
            metadata: { assessmentId: application.currentAssessment.id },
            user: { id: student.user.id },
            dateSent: IsNull(),
          },
        });
        expect(notificationExists).toBe(false);
      },
    );

    it(
      "Should generate a notification for PD/PPD student mismatch close to the offering end date " +
        "when the application is Assessment/Completed and email will be sent again for different assessments for the same application.",
      async () => {
        // Arrange
        // Create a student with a non-approved disability.
        const student = await saveFakeStudent(db.dataSource, undefined, {
          initialValue: { disabilityStatus: DisabilityStatus.Requested },
        });
        // Create an application with the disability as true.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          { student },
          {
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              workflowData: {
                calculatedData: {
                  pdppdStatus: true,
                },
              } as WorkflowData,
            },
            firstDisbursementInitialValues: {
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            },
          },
        );

        const studentNotification = createFakeNotification(
          {
            user: student.user,
            notificationMessage: {
              id: NotificationMessageType.StudentPDPPDApplicationNotification,
            } as NotificationMessage,
          },
          {
            initialValue: {
              dateSent: new Date(),
              metadata: {
                assessmentId: application.currentAssessment.id,
              },
            },
          },
        );

        await db.notification.save(studentNotification);

        // Create a new assessment for the same application.
        application.currentAssessment = createFakeStudentAssessment(
          {
            auditUser: application.student.user,
            application: application,
            offering: application.currentAssessment.offering,
          },
          {
            initialValue: {
              triggerType: AssessmentTriggerType.ManualReassessment,
              workflowData: {
                calculatedData: {
                  pdppdStatus: true,
                },
              } as WorkflowData,
            },
          },
        );
        await db.application.save(application);

        const newAssessmentDisbursement = createFakeDisbursementSchedule({
          studentAssessment: application.currentAssessment,
        });
        await db.disbursementSchedule.save(newAssessmentDisbursement);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.studentApplicationNotifications(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `PD/PPD mismatch assessments that generated notifications: ${application.currentAssessment.id}`,
          ]),
        ).toBe(true);
        const notificationExists = await db.notification.exists({
          relations: { notificationMessage: true },
          where: {
            notificationMessage: {
              id: NotificationMessageType.StudentPDPPDApplicationNotification,
            },
            metadata: { assessmentId: application.currentAssessment.id },
            user: { id: student.user.id },
            dateSent: IsNull(),
          },
        });
        expect(notificationExists).toBe(true);
      },
    );
  },
);
