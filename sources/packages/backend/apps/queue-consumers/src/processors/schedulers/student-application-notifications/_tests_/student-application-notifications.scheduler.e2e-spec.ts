import { INestApplication } from "@nestjs/common";
import {
  addDays,
  getDateOnlyFormat,
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
  MSFAAStates,
  createE2EDataSources,
  createFakeCRAIncomeVerification,
  createFakeDisbursementSchedule,
  createFakeEducationProgramOffering,
  createFakeMSFAANumber,
  createFakeNotification,
  createFakeSINValidation,
  createFakeStudentAssessment,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeApplicationRestrictionBypass,
  saveFakeInstitutionRestriction,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  Assessment,
  AssessmentStatus,
  AssessmentTriggerType,
  COEStatus,
  DisabilityStatus,
  DisbursementScheduleStatus,
  FormYesNoOptions,
  ModifiedIndependentStatus,
  Notification,
  NotificationMessage,
  NotificationMessageType,
  OfferingIntensity,
  Restriction,
  WorkflowData,
} from "@sims/sims-db";
import { IsNull, Not } from "typeorm";
import MockDate from "mockdate";
import { StudentApplicationNotificationsScheduler } from "../../student-application-notifications/student-application-notifications.scheduler";
import {
  FileProcessingIssueType,
  RestrictionCode,
  SystemUsersService,
} from "@sims/services";
import { GC_NOTIFY_TEMPLATE_IDS } from "@sims/test-utils/constants";

describe(
  describeProcessorRootTest(QueueNames.StudentApplicationNotifications),
  () => {
    let app: INestApplication;
    let processor: StudentApplicationNotificationsScheduler;
    let db: E2EDataSources;
    let systemUsersService: SystemUsersService;
    let susRestriction: Restriction;
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
      susRestriction = await db.restriction.findOne({
        select: { id: true },
        where: {
          restrictionCode: RestrictionCode.SUS,
        },
      });
    });

    beforeEach(async () => {
      MockDate.reset();
      // Cancel all applications to ensure that existing data will not affect these tests.
      await db.application.update(
        { applicationStatus: Not(ApplicationStatus.Cancelled) },
        { applicationStatus: ApplicationStatus.Cancelled },
      );
      // Mark all notifications as sent to ensure that existing data will not affect these tests.
      await db.notification.update(
        {
          dateSent: IsNull(),
        },
        { dateSent: new Date() },
      );
    });

    describe("StudentPDPPDReminderNotification", () => {
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
          const notification = await findNotification(
            NotificationMessageType.StudentPDPPDApplicationNotification,
            application.student.user.id,
          );
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
          const hasNotification = await notificationExists(
            NotificationMessageType.StudentPDPPDApplicationNotification,
            student.user.id,
          );
          expect(hasNotification).toBe(false);
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
              offering: application.currentAssessment!.offering,
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
          const notification = await findNotification(
            NotificationMessageType.StudentPDPPDApplicationNotification,
            application.student.user.id,
          );
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
    });

    describe("StudentSecondDisbursementReminderNotification", () => {
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
          const notification = await findNotification(
            NotificationMessageType.StudentSecondDisbursementNotification,
            application.student.user.id,
          );
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
                dateSent: new Date(),
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
          const hasNotification = await notificationExists(
            NotificationMessageType.StudentSecondDisbursementNotification,
            application.student.user.id,
          );
          expect(hasNotification).toBe(false);
        },
      );

      it(
        "Should not generate a second disbursement reminder notification for a student when an application " +
          "has two disbursements with both COEs completed but the second disbursement is still pending.",
        async () => {
          // Arrange
          // Create an application with two disbursements where both COEs are completed
          // and the second disbursement is pending and disbursement date has passed.
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
                coeStatus: COEStatus.completed,
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
              "No disbursements found to generate second disbursement reminder notifications.",
            ]),
          ).toBe(true);
          const hasNotification = await notificationExists(
            NotificationMessageType.StudentSecondDisbursementNotification,
            application.student.user.id,
          );
          expect(hasNotification).toBe(false);
        },
      );
    });

    describe("StudentCOERequiredNearEndDateReminderNotification", () => {
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
          const notification = await findNotification(
            NotificationMessageType.StudentCOERequiredNearEndDateNotification,
            application.student.user.id,
          );
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

          const hasNotification = await notificationExists(
            NotificationMessageType.StudentCOERequiredNearEndDateNotification,
            application.student.user.id,
          );
          expect(hasNotification).toBe(false);
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
                dateSent: new Date(),
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
          const hasNotification = await notificationExists(
            NotificationMessageType.StudentCOERequiredNearEndDateNotification,
            application.student.user.id,
          );
          expect(hasNotification).toBe(false);
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
        const hasNotification = await notificationExists(
          NotificationMessageType.StudentCOERequiredNearEndDateNotification,
          application.student.user.id,
        );
        expect(hasNotification).toBe(false);
      });
    });

    // The following scenarios should generate notifications.
    const positiveCRASINNotificationData = [
      {
        daysPastSent: 5,
      },
      {
        daysPastSent: 6,
      },
    ];

    // The following scenarios should not generate notifications.
    const negativeCRASINNotificationData = [
      {
        daysPastSent: 4,
        dateReceived: undefined,
      },
      {
        daysPastSent: 6,
        dateReceived: addDays(-2, new Date()),
      },
    ];

    describe("MinistryCRAFileProcessingIssueNotification", () => {
      positiveCRASINNotificationData.forEach(({ daysPastSent }) => {
        beforeEach(async () => {
          // Set the date received for any CRA Verifications to ensure they are ignored in the tests.
          await db.craIncomeVerification.update(
            {
              dateReceived: IsNull(),
            },
            { dateReceived: new Date() },
          );
        });
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
              "Overdue CRA income verifications that generated notifications: DUMMY_BYPASS_CRA_SENT_FILE.txt",
            ]),
          ).toBe(true);

          const notification = await findNotification(
            NotificationMessageType.MinistryFileProcessingIssue,
          );
          expect(notification).toBeDefined();
          expect(notification!.messagePayload).toStrictEqual({
            email_address: MINISTRY_EMAIL_ADDRESS,
            template_id: GC_NOTIFY_TEMPLATE_IDS.MinistryFileProcessingIssue,
            personalisation: {
              dateSent: getPSTPDTDateTime(craVerification1.dateSent!),
              fileName: craVerification1.fileSent,
              type: FileProcessingIssueType.CRA,
            },
          });
        });
      });

      negativeCRASINNotificationData.forEach(
        ({ daysPastSent, dateReceived }) => {
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
            const hasNotification = await notificationExists(
              NotificationMessageType.MinistryFileProcessingIssue,
            );
            expect(hasNotification).toBe(false);
          });
        },
      );
    });

    describe("MinistrySINFileProcessingIssueNotification", () => {
      beforeEach(async () => {
        // Set the date received for any SIN Validations to ensure they are ignored in the tests.
        await db.sinValidation.update(
          {
            dateReceived: IsNull(),
          },
          { dateReceived: new Date() },
        );
      });
      positiveCRASINNotificationData.forEach(({ daysPastSent }) => {
        it(`Should generate a notification for SIN file processing issues when the file was sent ${daysPastSent} days ago with no response file received.`, async () => {
          // Arrange
          const dateSent = addDays(-daysPastSent);

          // Create students with SIN validations with the same sent file and date to ensure only a single notification is generated.
          const student1 = await saveFakeStudent(
            db.dataSource,
            {},
            {
              sinValidationInitialValue: {
                dateSent,
                fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
              },
            },
          );
          await saveFakeStudent(
            db.dataSource,
            {},
            {
              sinValidationInitialValue: {
                dateSent,
                fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
              },
            },
          );

          // Add an older side validation for student1 to ensure only the most recent one is considered.
          const olderSinValidation = createFakeSINValidation(
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
          await db.sinValidation.save(olderSinValidation);

          // Queued job.
          const mockedJob = mockBullJob<void>();

          // Act
          const result = await processor.processQueue(mockedJob.job);

          expect(result).toStrictEqual(["Process finalized with success."]);

          // Assert
          expect(
            mockedJob.containLogMessages([
              "Overdue SIN validations that generated notifications: DUMMY_BYPASS_SIN_SENT_FILE.txt",
            ]),
          ).toBe(true);

          const notification = await findNotification(
            NotificationMessageType.MinistryFileProcessingIssue,
          );
          expect(notification).toBeDefined();
          expect(notification!.messagePayload).toStrictEqual({
            email_address: MINISTRY_EMAIL_ADDRESS,
            template_id: GC_NOTIFY_TEMPLATE_IDS.MinistryFileProcessingIssue,
            personalisation: {
              dateSent: getPSTPDTDateTime(student1.sinValidation.dateSent!),
              fileName: student1.sinValidation.fileSent,
              type: FileProcessingIssueType.SIN,
            },
          });
        });
      });

      negativeCRASINNotificationData.forEach(
        ({ daysPastSent, dateReceived }) => {
          it(`Should not generate a notification for SIN file processing issues when the file was sent ${daysPastSent} days ago with response file received ${dateReceived ? getPSTPDTDateTime(dateReceived) : "never"}.`, async () => {
            // Arrange

            // Create a student with a SIN validation
            await saveFakeStudent(
              db.dataSource,
              {},
              {
                sinValidationInitialValue: {
                  dateReceived,
                  dateSent: addDays(-daysPastSent),
                  fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
                },
              },
            );

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
            const hasNotification = await notificationExists(
              NotificationMessageType.MinistryFileProcessingIssue,
            );
            expect(hasNotification).toBe(false);
          });
        },
      );
    });

    describe("StudentAssessmentReminderNotification", () => {
      // The following scenarios should generate notifications.
      const positiveAssessmentNotificationData = [
        {
          overdueDays: 7,
        },
        {
          overdueDays: 8,
        },
      ];

      positiveAssessmentNotificationData.forEach(({ overdueDays }) => {
        it(`Should generate a notification for overdue assessment reminder when the application status is assessment and the NOA status is required and the assessment is overdue by ${overdueDays} days.`, async () => {
          // Arrange
          // Create an application
          const application = await saveFakeApplication(
            db.dataSource,
            {},
            {
              applicationStatus: ApplicationStatus.Assessment,
              currentAssessmentInitialValues: {
                noaApprovalStatus: AssessmentStatus.required,
                noaApprovalStatusUpdatedOn: addDays(-overdueDays),
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
              `Overdue assessments awaiting acceptance that generated reminder notifications: ${application.applicationNumber}`,
            ]),
          ).toBe(true);
          const notification = await findNotification(
            NotificationMessageType.StudentAssessmentReminder,
            application.student.user.id,
          );
          expect(notification).toBeDefined();
          expect(notification!.messagePayload).toStrictEqual({
            email_address: application.student.user.email,
            template_id: GC_NOTIFY_TEMPLATE_IDS.StudentAcceptAssessmentOverdue,
            personalisation: {
              lastName: application.student.user.lastName,
              givenNames: application.student.user.firstName,
              applicationNumber: application.applicationNumber,
            },
          });
          expect(notification!.metadata).toStrictEqual({
            assessmentId: application.currentAssessment!.id,
          });
        });
      });

      it("Should not generate a notification for overdue assessment reminder when the application status is assessment and the NOA status is required and the assessment is overdue by 6 days.", async () => {
        // Arrange
        // Create an application
        const application = await saveFakeApplication(
          db.dataSource,
          {},
          {
            applicationStatus: ApplicationStatus.Assessment,
            currentAssessmentInitialValues: {
              noaApprovalStatus: AssessmentStatus.required,
              noaApprovalStatusUpdatedOn: addDays(-6),
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
            `No assessments awaiting acceptance 7 days past due found to generate reminder notifications.`,
          ]),
        ).toBe(true);

        const hasNotification = await notificationExists(
          NotificationMessageType.StudentAssessmentReminder,
          application.student.user.id,
        );
        expect(hasNotification).toBe(false);
      });

      it("Should not generate a notification for overdue assessment reminder when the application status is assessment and the NOA status is required and the assessment is overdue by 10 days and a notification has already been sent.", async () => {
        // Arrange
        // Create an application
        const application = await saveFakeApplication(
          db.dataSource,
          {},
          {
            applicationStatus: ApplicationStatus.Assessment,
            currentAssessmentInitialValues: {
              noaApprovalStatus: AssessmentStatus.required,
              noaApprovalStatusUpdatedOn: addDays(-10),
            },
          },
        );

        // Create an existing notification
        const notification = createFakeNotification(
          {
            user: application.student.user,
            notificationMessage: {
              id: NotificationMessageType.StudentAssessmentReminder,
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
        await db.notification.save(notification);

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `No assessments awaiting acceptance 7 days past due found to generate reminder notifications.`,
          ]),
        ).toBe(true);
        const hasNotification = await notificationExists(
          NotificationMessageType.StudentAssessmentReminder,
          application.student.user.id,
        );
        expect(hasNotification).toBe(false);
      });

      it("Should not generate a notification for overdue assessment reminder when the application status is enrolment and the NOA status is complete.", async () => {
        // Arrange
        // Create an application
        const application = await saveFakeApplication(
          db.dataSource,
          {},
          {
            applicationStatus: ApplicationStatus.Enrolment,
            currentAssessmentInitialValues: {
              noaApprovalStatus: AssessmentStatus.completed,
              noaApprovalStatusUpdatedOn: addDays(-10),
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
            `No assessments awaiting acceptance 7 days past due found to generate reminder notifications.`,
          ]),
        ).toBe(true);
        const hasNotification = await notificationExists(
          NotificationMessageType.StudentAssessmentReminder,
          application.student.user.id,
        );
        expect(hasNotification).toBe(false);
      });

      it("Should not generate a notification for overdue assessment reminder when the application status is assessment and the NOA status is required and the offering end date has passed.", async () => {
        // Arrange
        // Create an expired offering
        const offering = createFakeEducationProgramOffering(
          { auditUser: systemUsersService.systemUser },
          {
            initialValues: {
              studyStartDate: getISODateOnlyString(addDays(-30)),
              studyEndDate: getISODateOnlyString(addDays(-1)),
            },
          },
        );
        await db.educationProgramOffering.save(offering);

        // Create an application
        const application = await saveFakeApplication(
          db.dataSource,
          { offering },
          {
            applicationStatus: ApplicationStatus.Assessment,
            currentAssessmentInitialValues: {
              noaApprovalStatus: AssessmentStatus.required,
              noaApprovalStatusUpdatedOn: addDays(-10),
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
            `No assessments awaiting acceptance 7 days past due found to generate reminder notifications.`,
          ]),
        ).toBe(true);
        const hasNotification = await notificationExists(
          NotificationMessageType.StudentAssessmentReminder,
          application.student.user.id,
        );
        expect(hasNotification).toBe(false);
      });

      it("Should not generate a notification for overdue assessment reminder when the disbursement is blocked because the student is estranged from parents but the modified independent status is Not requested.", async () => {
        // Arrange
        const student = await saveFakeStudent(db.dataSource, undefined, {
          initialValue: {
            modifiedIndependentStatus: ModifiedIndependentStatus.NotRequested,
          },
        });

        // Create an application with disbursements.
        await saveFakeApplicationDisbursements(
          db.dataSource,
          { student },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Assessment,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
              noaApprovalStatus: AssessmentStatus.required,
              noaApprovalStatusUpdatedOn: addDays(-10),
              workflowData: {
                studentData: {
                  estrangedFromParents: FormYesNoOptions.Yes,
                },
                calculatedData: {
                  pdppdStatus: false,
                },
              } as WorkflowData,
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
            `No assessments awaiting acceptance 7 days past due found to generate reminder notifications.`,
          ]),
        ).toBe(true);
        const hasNotification = await notificationExists(
          NotificationMessageType.StudentAssessmentReminder,
          student.user.id,
        );
        expect(hasNotification).toBe(false);
      });
    });

    describe("ProgramSuspensionBlockingAssessmentNotification", () => {
      it(`Should generate program suspension blocking application notification when an application is blocked from confirming assessment due to effective ${RestrictionCode.SUS} restriction.`, async () => {
        // Arrange
        // Create an application pending assessment confirmation.
        const application = await createApplicationPendingAcceptAssessment();
        const offering = application.currentAssessment.offering;
        const location = offering.institutionLocation;
        const program = offering.educationProgram;
        const institution = location.institution;
        // Add institution restriction for the application location and program.
        await saveFakeInstitutionRestriction(db, {
          restriction: susRestriction,
          institution,
          program,
          location,
        });

        // Queued job.
        const mockedJob = mockBullJob<void>();
        const now = new Date();
        MockDate.set(now);

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `Program suspension blocking application notifications created for the assessments: ${application.currentAssessment.id}`,
          ]),
        ).toBe(true);
        const notification = await findNotification(
          NotificationMessageType.ProgramSuspensionBlockingApplication,
        );
        expect(notification).toBeDefined();
        const student = application.student;
        expect(notification!.messagePayload).toStrictEqual({
          email_address: MINISTRY_EMAIL_ADDRESS,
          template_id: expect.any(String),
          personalisation: {
            dateTime: `${getPSTPDTDateTime(now)} PST/PDT`,
            lastName: student.user.lastName,
            birthDate: getDateOnlyFormat(student.birthDate),
            givenNames: student.user.firstName,
            programName: program.name,
            studentEmail: student.user.email,
            applicationNumber: application.applicationNumber,
            institutionOperatingName: institution.operatingName,
          },
        });
        expect(notification!.metadata).toStrictEqual({
          assessmentId: application.currentAssessment!.id,
        });
      });
      it(
        `Should not generate program suspension blocking application notification when an application is blocked from confirming assessment due to effective ${RestrictionCode.SUS} restriction` +
          " and a notification has already been sent for the assessment.",
        async () => {
          // Arrange
          // Create an application pending assessment confirmation.
          const application = await createApplicationPendingAcceptAssessment();
          const offering = application.currentAssessment.offering;
          const location = offering.institutionLocation;
          const program = offering.educationProgram;
          const institution = location.institution;
          // Add institution restriction for the application location and program.
          await saveFakeInstitutionRestriction(db, {
            restriction: susRestriction,
            institution,
            program,
            location,
          });
          // Create an existing notification for the assessment.
          const existingNotification = createFakeNotification(
            {
              user: systemUsersService.systemUser,
              auditUser: systemUsersService.systemUser,
              notificationMessage: {
                id: NotificationMessageType.ProgramSuspensionBlockingApplication,
              } as NotificationMessage,
            },
            {
              initialValue: {
                metadata: {
                  assessmentId: application.currentAssessment!.id,
                },
                dateSent: new Date(),
              },
            },
          );
          await db.notification.save(existingNotification);
          // Queued job.
          const mockedJob = mockBullJob<void>();

          // Act
          await processor.processQueue(mockedJob.job);

          // Assert
          expect(
            mockedJob.containLogMessages([
              "No applications blocked by program suspension restriction without an existing notification are found.",
            ]),
          ).toBe(true);
          const isNewNotificationCreated = await notificationExists(
            NotificationMessageType.ProgramSuspensionBlockingApplication,
          );
          expect(isNewNotificationCreated).toBe(false);
        },
      );
      it(
        `Should not generate program suspension blocking application notification when an application is blocked from confirming assessment due to ${RestrictionCode.SUS} restriction` +
          " and the restriction is bypassed.",
        async () => {
          // Arrange
          // Create an application pending assessment confirmation.
          const application = await createApplicationPendingAcceptAssessment();
          const offering = application.currentAssessment.offering;
          const location = offering.institutionLocation;
          const program = offering.educationProgram;
          const institution = location.institution;
          // Add institution restriction for the application location and program.
          const institutionRestriction = await saveFakeInstitutionRestriction(
            db,
            {
              restriction: susRestriction,
              institution,
              program,
              location,
            },
          );
          // Create an application restriction bypass.
          await saveFakeApplicationRestrictionBypass(db, {
            application,
            institutionRestriction,
          });
          // Queued job.
          const mockedJob = mockBullJob<void>();

          // Act
          await processor.processQueue(mockedJob.job);

          // Assert
          expect(
            mockedJob.containLogMessages([
              "No applications blocked by program suspension restriction without an existing notification are found.",
            ]),
          ).toBe(true);
          const isNewNotificationCreated = await notificationExists(
            NotificationMessageType.ProgramSuspensionBlockingApplication,
          );
          expect(isNewNotificationCreated).toBe(false);
        },
      );
    });

    /**
     * Helper function to find a notification for assertions.
     * @param messageType The type of notification message to find.
     * @returns The notification if found, otherwise null.
     */
    async function findNotification(
      messageType: NotificationMessageType,
      userId: number = systemUsersService.systemUser.id,
    ): Promise<Notification | null> {
      return await db.notification.findOne({
        select: {
          id: true,
          messagePayload: true,
          metadata: true,
        },
        relations: { notificationMessage: true },
        where: {
          notificationMessage: {
            id: messageType,
          },
          dateSent: IsNull(),
          user: { id: userId },
        },
      });
    }

    /**
     * Helper function to check if a notification exists for assertions.
     * @param messageType The type of notification message to check.
     * @returns True if the notification exists, otherwise false.
     */
    async function notificationExists(
      messageType: NotificationMessageType,
      userId: number = systemUsersService.systemUser.id,
    ): Promise<boolean> {
      return await db.notification.exists({
        where: {
          notificationMessage: {
            id: messageType,
          },
          dateSent: IsNull(),
          user: { id: userId },
        },
      });
    }

    /**
     * Creates an application pending accept assessment with the specified offering intensity.
     * @param offeringIntensity application offering intensity.
     * @returns application.
     */
    async function createApplicationPendingAcceptAssessment(
      offeringIntensity = OfferingIntensity.fullTime,
    ): Promise<Application> {
      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student },
          {
            msfaaState: MSFAAStates.Signed,
            msfaaInitialValues: {
              offeringIntensity,
            },
          },
        ),
      );
      return saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber },
        {
          offeringIntensity,
          applicationStatus: ApplicationStatus.Assessment,
          currentAssessmentInitialValues: {
            noaApprovalStatus: AssessmentStatus.required,
          },
        },
      );
    }
  },
);
