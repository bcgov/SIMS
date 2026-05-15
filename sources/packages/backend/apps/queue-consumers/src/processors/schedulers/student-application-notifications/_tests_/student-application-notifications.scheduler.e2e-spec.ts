import { INestApplication } from "@nestjs/common";
import {
  addDays,
  getISODateOnlyString,
  getPSTPDTDateTime,
  QueueNames,
} from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeCRAIncomeVerification,
  createFakeDisbursementSchedule,
  createFakeNotification,
  createFakeSINValidation,
  createFakeStudentAssessment,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisabilityStatus,
  DisbursementScheduleStatus,
  Notification,
  NotificationMessage,
  NotificationMessageType,
  WorkflowData,
} from "@sims/sims-db";
import { IsNull, Not } from "typeorm";
import { StudentApplicationNotificationsScheduler } from "../../student-application-notifications/student-application-notifications.scheduler";
import { FileProcessingIssueType, SystemUsersService } from "@sims/services";

describe(
  describeProcessorRootTest(QueueNames.StudentApplicationNotifications),
  () => {
    let app: INestApplication;
    let processor: StudentApplicationNotificationsScheduler;
    let db: E2EDataSources;
    let systemUsersService: SystemUsersService;
    const MINISTRY_EMAIL_ADDRESS = "dummy@some.domain";

    beforeAll(async () => {
      // Setup the app and data sources.
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      systemUsersService = app.get(SystemUsersService);
      // Processor under test.
      processor = app.get(StudentApplicationNotificationsScheduler);
      // Update fake email contacts to send ministry notifications.
      await db.notificationMessage.update(
        {
          id: NotificationMessageType.MinistryFileProcessingIssue,
        },
        { emailContacts: [MINISTRY_EMAIL_ADDRESS] },
      );
    });

    beforeEach(async () => {
      // Cancel all applications to ensure tha existing data will not affect these tests.
      await db.application.update(
        { applicationStatus: Not(ApplicationStatus.Cancelled) },
        { applicationStatus: ApplicationStatus.Cancelled },
      );
      // Set the date sent for any Notifications to ensure they are ignored in the tests.
      await db.notification.update(
        {
          notificationMessage: {
            id: NotificationMessageType.MinistryFileProcessingIssue,
          },
        },
        { dateSent: new Date() },
      );
      // Set the date received for any CRA Verifications to ensure they are ignored in the tests.
      await db.craIncomeVerification.update(
        {
          dateReceived: IsNull(),
        },
        { dateReceived: new Date() },
      );
      // Set the date received for any SIN Validations to ensure they are ignored in the tests.
      await db.sinValidation.update(
        {
          dateReceived: IsNull(),
        },
        { dateReceived: new Date() },
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
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `PD/PPD mismatch assessments that generated notifications: ${application.currentAssessment!.id}`,
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
        expect(notification!.messagePayload).toStrictEqual({
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
                assessmentId: application.currentAssessment!.id,
              },
            },
          },
        );

        await db.notification.save(studentNotification);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

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
            metadata: { assessmentId: application.currentAssessment!.id },
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
                assessmentId: application.currentAssessment!.id,
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
            applicationEditStatusUpdatedBy: application.student.user,
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
        await processor.processQueue(mockedJob.job);

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

    it(
      "Should generate a second disbursement reminder notification for a student when the " +
        "application is Completed and the second disbursement with Required COE status " +
        "is still pending when its disbursement date has passed.",
      async () => {
        // Arrange
        // Create an application with the second disbursement still pending with Required COE
        // status and disbursement date has passed.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            applicationStatus: ApplicationStatus.Completed,
            createSecondDisbursement: true,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              disbursementDate: getISODateOnlyString(addDays(-10)),
            },
            secondDisbursementInitialValues: {
              coeStatus: COEStatus.required,
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
              disbursementDate: getISODateOnlyString(addDays(-2)),
            },
          },
        );

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `Second disbursements with pending status that generated notifications: ${application.currentAssessment!.id}`,
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
              id: NotificationMessageType.StudentSecondDisbursementNotification,
            },
            dateSent: IsNull(),
            user: { id: application.student.user.id },
          },
        });
        expect(notification).toBeDefined();
        expect(notification!.messagePayload).toStrictEqual({
          email_address: application.student.user.email,
          template_id: "55fcf228-b899-49a7-ab80-9b854c0bd884",
          personalisation: {
            lastName: application.student.user.lastName,
            givenNames: application.student.user.firstName,
          },
        });
      },
    );

    it(
      "Should not generate a second disbursement reminder notification for a student " +
        "when a notification is already sent for the second disbursement still pending.",
      async () => {
        // Arrange
        // Create an application with the second disbursement still pending with Required COE
        // status and disbursement date has passed.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            applicationStatus: ApplicationStatus.Completed,
            createSecondDisbursement: true,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              disbursementDate: getISODateOnlyString(addDays(-10)),
            },
            secondDisbursementInitialValues: {
              coeStatus: COEStatus.required,
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
              disbursementDate: getISODateOnlyString(addDays(-2)),
            },
          },
        );
        // Create a notification for assessment associated with the second disbursement.
        const notification = createFakeNotification(
          {
            user: application.student.user,
            notificationMessage: {
              id: NotificationMessageType.StudentSecondDisbursementNotification,
            } as NotificationMessage,
          },
          {
            initialValue: {
              metadata: { assessmentId: application.currentAssessment!.id },
            },
          },
        );
        await db.notification.save(notification);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "No disbursements found to generate second disbursement reminder notifications.",
          ]),
        ).toBe(true);
      },
    );

    it(
      "Should not generate a second disbursement reminder notification for a student when an application " +
        "has two disbursements with both COEs completed but the second disbursement is still pending.",
      async () => {
        // Arrange
        // Create an application with two disbursements where both COEs are completed
        // and the second disbursement is pending and disbursement date has passed.
        await saveFakeApplicationDisbursements(db.dataSource, undefined, {
          applicationStatus: ApplicationStatus.Completed,
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: getISODateOnlyString(addDays(-10)),
          },
          secondDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            disbursementDate: getISODateOnlyString(addDays(-2)),
          },
        });

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "No disbursements found to generate second disbursement reminder notifications.",
          ]),
        ).toBe(true);
      },
    );

    it(
      "Should generate a notification for a student when the study end date is within 10 days " +
        "and at least one COE is required on the most recent assessment.",
      async () => {
        // Arrange
        // Create an application with study end date within 10 days and COE required.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            applicationStatus: ApplicationStatus.Enrolment,
            offeringInitialValues: {
              studyStartDate: getISODateOnlyString(addDays(-30)),
              studyEndDate: getISODateOnlyString(addDays(7)),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.required,
            },
          },
        );

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `Assessments with COE required near end date that generated notifications: ${application.currentAssessment!.id}.`,
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
              id: NotificationMessageType.StudentCOERequiredNearEndDateNotification,
            },
            dateSent: IsNull(),
            user: { id: application.student.user.id },
          },
        });
        expect(notification).toBeDefined();
        expect(notification!.messagePayload).toStrictEqual({
          email_address: application.student.user.email,
          template_id: "4da67f87-ec53-4d9b-809c-4610e1c76362",
          personalisation: {
            lastName: application.student.user.lastName,
            givenNames: application.student.user.firstName,
            applicationNumber: application.applicationNumber,
          },
        });
      },
    );

    it(
      "Should not generate a notification for a student when the study end date is within 10 days " +
        "and all COEs are completed.",
      async () => {
        // Arrange
        // Create an application with study end date within 10 days but all COEs completed.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            applicationStatus: ApplicationStatus.Completed,
            offeringInitialValues: {
              studyStartDate: getISODateOnlyString(addDays(-30)),
              studyEndDate: getISODateOnlyString(addDays(7)),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
            },
          },
        );

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "No applications found with COE required near study end date.",
          ]),
        ).toBe(true);

        const notificationExists = await db.notification.exists({
          relations: { notificationMessage: true },
          where: {
            notificationMessage: {
              id: NotificationMessageType.StudentCOERequiredNearEndDateNotification,
            },
            metadata: { assessmentId: application.currentAssessment!.id },
            user: { id: application.student.user.id },
            dateSent: IsNull(),
          },
        });

        expect(notificationExists).toBe(false);
      },
    );

    it(
      "Should not generate a notification for a student when a notification has already been sent " +
        "for the current assessment with COE required near study end date.",
      async () => {
        // Arrange
        // Create an application with study end date within 10 days and COE required.
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            applicationStatus: ApplicationStatus.Enrolment,
            offeringInitialValues: {
              studyStartDate: getISODateOnlyString(addDays(-30)),
              studyEndDate: getISODateOnlyString(addDays(7)),
            },
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.required,
            },
          },
        );

        // Create a notification for the assessment.
        const notification = createFakeNotification(
          {
            user: application.student.user,
            notificationMessage: {
              id: NotificationMessageType.StudentCOERequiredNearEndDateNotification,
            } as NotificationMessage,
          },
          {
            initialValue: {
              metadata: { assessmentId: application.currentAssessment!.id },
            },
          },
        );
        await db.notification.save(notification);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "No applications found with COE required near study end date.",
          ]),
        ).toBe(true);
      },
    );

    it("Should not generate a notification for a student when the study end date is more than 10 days away.", async () => {
      // Arrange
      // Create an application with study end date more than 10 days away (11 days).
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Enrolment,
          offeringInitialValues: {
            studyStartDate: getISODateOnlyString(addDays(-30)),
            studyEndDate: getISODateOnlyString(addDays(11)),
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.required,
          },
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      expect(
        mockedJob.containLogMessages([
          "No applications found with COE required near study end date.",
        ]),
      ).toBe(true);

      const notificationExists = await db.notification.exists({
        relations: { notificationMessage: true },
        where: {
          notificationMessage: {
            id: NotificationMessageType.StudentCOERequiredNearEndDateNotification,
          },
          metadata: { assessmentId: application.currentAssessment!.id },
          user: { id: application.student.user.id },
          dateSent: IsNull(),
        },
      });

      expect(notificationExists).toBe(false);
    });

    // The following scenarios should generate notifications.
    const positiveNotificationData = [
      {
        daysPastSent: 5,
      },
      {
        daysPastSent: 6,
      },
    ];

    // The following scenarios should not generate notifications.
    const negativeNotificationData = [
      {
        daysPastSent: 4,
        dateReceived: undefined,
      },
      {
        daysPastSent: 6,
        dateReceived: addDays(-2, new Date()),
      },
    ];

    positiveNotificationData.forEach(({ daysPastSent }) => {
      it(`Should generate a notification for CRA file processing issues when the file was sent ${daysPastSent} days ago with no response file received.`, async () => {
        // Arrange

        // Create an in progress application.
        const application = await saveFakeApplication(
          db.dataSource,
          {},
          {
            applicationStatus: ApplicationStatus.InProgress,
          },
        );

        const dateSent = addDays(-daysPastSent);
        // Add two records for the same file. Only a single notification should be generated.
        const craVerification1 = createFakeCRAIncomeVerification(
          {
            application: application,
          },
          {
            initialValues: {
              dateSent,
              fileSent: "DUMMY_BYPASS_CRA_SENT_FILE.txt",
            },
          },
        );
        await db.craIncomeVerification.save(craVerification1);
        const craVerification2 = createFakeCRAIncomeVerification(
          {
            application: application,
          },
          {
            initialValues: {
              dateSent,
              fileSent: "DUMMY_BYPASS_CRA_SENT_FILE.txt",
            },
          },
        );
        await db.craIncomeVerification.save(craVerification2);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        expect(result).toStrictEqual(["Process finalized with success."]);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "Total overdue CRA income verifications that generated notifications: 1",
          ]),
        ).toBe(true);

        const notification = await findNotification();
        expect(notification).toBeDefined();
        expect(notification!.messagePayload).toStrictEqual({
          email_address: MINISTRY_EMAIL_ADDRESS,
          template_id: "cb0efb5a-7540-4925-b017-e9d96852368f",
          personalisation: {
            dateSent: getPSTPDTDateTime(craVerification1.dateSent!),
            fileName: craVerification1.fileSent,
            type: FileProcessingIssueType.CRA,
          },
        });
      });
    });

    positiveNotificationData.forEach(({ daysPastSent }) => {
      it(`Should generate a notification for SIN file processing issues when the file was sent ${daysPastSent} days ago with no response file received.`, async () => {
        // Arrange

        // Create two in progress applications.
        const application1 = await saveFakeApplication(
          db.dataSource,
          {},
          {
            applicationStatus: ApplicationStatus.InProgress,
          },
        );
        const application2 = await saveFakeApplication(
          db.dataSource,
          {},
          {
            applicationStatus: ApplicationStatus.InProgress,
          },
        );

        const student1 = application1.student;
        const student2 = application2.student;

        const dateSent = addDays(-daysPastSent);
        // Add two records for the same file. Only a single notification should be generated since the fileName is the same.
        const sinValidation1 = createFakeSINValidation(
          {
            student: student1,
          },
          {
            initialValue: {
              dateSent,
              fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
            },
          },
        );
        await db.sinValidation.save(sinValidation1);
        const sinValidation2 = createFakeSINValidation(
          {
            student: student2,
          },
          {
            initialValue: {
              dateSent,
              fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
            },
          },
        );
        await db.sinValidation.save(sinValidation2);
        // Add an older side validation for student1 to ensure only the most recent one is considered.
        createFakeSINValidation(
          {
            student: student1,
          },
          {
            initialValue: {
              dateSent: addDays(-3, dateSent),
              fileSent: "DUMMY_BYPASS_SIN_SENT_FILE_OLD.txt",
            },
          },
        );
        await db.sinValidation.save(sinValidation1);

        student1.sinValidation = sinValidation1;
        await db.student.save(student1);
        student2.sinValidation = sinValidation2;
        await db.student.save(student2);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        expect(result).toStrictEqual(["Process finalized with success."]);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "Total overdue SIN validations that generated notifications: 1",
          ]),
        ).toBe(true);

        const notification = await findNotification();
        expect(notification).toBeDefined();
        expect(notification!.messagePayload).toStrictEqual({
          email_address: MINISTRY_EMAIL_ADDRESS,
          template_id: "cb0efb5a-7540-4925-b017-e9d96852368f",
          personalisation: {
            dateSent: getPSTPDTDateTime(sinValidation1.dateSent!),
            fileName: sinValidation1.fileSent,
            type: FileProcessingIssueType.SIN,
          },
        });
      });
    });

    negativeNotificationData.forEach(({ daysPastSent, dateReceived }) => {
      it(`Should not generate a notification for CRA file processing issues when the file was sent ${daysPastSent} days ago with response file received ${dateReceived ? getPSTPDTDateTime(dateReceived) : "never"}.`, async () => {
        // Arrange

        // Create an in progress application.
        const application = await saveFakeApplication(
          db.dataSource,
          {},
          {
            applicationStatus: ApplicationStatus.InProgress,
          },
        );

        const craVerification = createFakeCRAIncomeVerification(
          {
            application: application,
          },
          {
            initialValues: {
              dateReceived: dateReceived,
              dateSent: addDays(-daysPastSent),
              fileSent: "DUMMY_BYPASS_CRA_SENT_FILE.txt",
            },
          },
        );
        await db.craIncomeVerification.save(craVerification);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        expect(result).toStrictEqual(["Process finalized with success."]);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "No CRA income verifications 5 days past due found to generate notifications.",
          ]),
        ).toBe(true);
        const hasNotification = await notificationExists();
        expect(hasNotification).toBe(false);
      });
    });

    negativeNotificationData.forEach(({ daysPastSent, dateReceived }) => {
      it(`Should not generate a notification for CRA file processing issues when the file was sent ${daysPastSent} days ago with response file received ${dateReceived ? getPSTPDTDateTime(dateReceived) : "never"}.`, async () => {
        // Arrange

        // Create an in progress application.
        const application = await saveFakeApplication(
          db.dataSource,
          {},
          {
            applicationStatus: ApplicationStatus.InProgress,
          },
        );

        const sinValidation = createFakeSINValidation(
          {
            student: application.student,
          },
          {
            initialValue: {
              dateReceived,
              dateSent: addDays(-daysPastSent),
              fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
            },
          },
        );
        await db.sinValidation.save(sinValidation);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        expect(result).toStrictEqual(["Process finalized with success."]);

        // Assert
        expect(
          mockedJob.containLogMessages([
            "No SIN validations 5 days past due found to generate notifications.",
          ]),
        ).toBe(true);
        const hasNotification = await notificationExists();
        expect(hasNotification).toBe(false);
      });
    });

    async function findNotification(): Promise<Notification | null> {
      return await db.notification.findOne({
        select: {
          id: true,
          messagePayload: true,
        },
        relations: { notificationMessage: true },
        where: {
          notificationMessage: {
            id: NotificationMessageType.MinistryFileProcessingIssue,
          },
          dateSent: IsNull(),
          user: { id: systemUsersService.systemUser.id },
        },
      });
    }

    async function notificationExists(): Promise<boolean> {
      return await db.notification.exists({
        select: {
          id: true,
          messagePayload: true,
        },
        relations: { notificationMessage: true },
        where: {
          notificationMessage: {
            id: NotificationMessageType.MinistryFileProcessingIssue,
          },
          dateSent: IsNull(),
          user: { id: systemUsersService.systemUser.id },
        },
      });
    }
  },
);
