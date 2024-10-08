import { createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { Job } from "bull";
import {
  ApplicationStatus,
  DisabilityStatus,
  DisbursementScheduleStatus,
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
        "when the application is completed and at least one disbursement is pending and there is a PD/PPD mismatch.",
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
        const job = createMock<Job<void>>();

        // Act
        await processor.studentApplicationNotifications(job);

        // Assert
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

        // Act again
        await processor.studentApplicationNotifications(job);

        const notifications = await db.notification.find({
          select: {
            id: true,
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
        // Expect no new notification is created for the same assessment.
        expect(notifications.length).toBe(1);
      },
    );
  },
);
