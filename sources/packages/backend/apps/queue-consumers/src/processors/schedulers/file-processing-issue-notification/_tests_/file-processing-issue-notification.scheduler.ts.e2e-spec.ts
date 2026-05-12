import { INestApplication } from "@nestjs/common";
import { addDays, getPSTPDTDateTime, QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeCRAIncomeVerification,
  createFakeSINValidation,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  NotificationMessageType,
  Student,
} from "@sims/sims-db";
import { IsNull } from "typeorm";
import { FileProcessingIssueNotificationScheduler } from "../file-processing-issue-notification.scheduler";
import { SystemUsersService } from "@sims/services";

describe(
  describeProcessorRootTest(QueueNames.FileProcessingIssueNotification),
  () => {
    let app: INestApplication;
    let processor: FileProcessingIssueNotificationScheduler;
    let db: E2EDataSources;
    let systemUsersService: SystemUsersService;
    let student: Student;
    const MINISTRY_EMAIL_ADDRESS = "dummy@some.domain";

    beforeAll(async () => {
      // Setup the app and data sources.
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      systemUsersService = app.get(SystemUsersService);
      // Processor under test.
      processor = app.get(FileProcessingIssueNotificationScheduler);
      student = await saveFakeStudent(db.dataSource);
      // Update fake email contacts to send ministry notifications.
      await db.notificationMessage.update(
        {
          id: NotificationMessageType.MinistryFileProcessingIssue,
        },
        { emailContacts: [MINISTRY_EMAIL_ADDRESS] },
      );
    });

    beforeEach(async () => {
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

    it("Should generate a notification for a CRA file processing issue when the CRA Verification was sent 6 days ago with no file received.", async () => {
      // Arrange

      // Create an in progress application.
      const application = await saveFakeApplication(
        db.dataSource,
        { student },
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
            dateReceived: undefined,
            dateSent: addDays(-6, new Date()),
            fileSent: "DUMMY_BYPASS_CRA_SENT_FILE.txt",
          },
        },
      );
      await db.craIncomeVerification.save(craVerification);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      expect(result).toStrictEqual([
        "Completed file processing issue notifications.",
      ]);

      // Assert
      expect(
        mockedJob.containLogMessages([
          "Total overdue CRA income verifications: 1",
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
            id: NotificationMessageType.MinistryFileProcessingIssue,
          },
          dateSent: IsNull(),
          user: { id: systemUsersService.systemUser.id },
        },
      });
      expect(notification).toBeDefined();
      expect(notification!.messagePayload).toStrictEqual({
        email_address: MINISTRY_EMAIL_ADDRESS,
        template_id: "cb0efb5a-7540-4925-b017-e9d96852368f",
        personalisation: {
          dateSent: getPSTPDTDateTime(craVerification.dateSent!),
          fileName: craVerification.fileSent,
          type: "CRA",
        },
      });
    });

    it("Should not generate a notification for a CRA file processing issue when the CRA Verification was sent 4 days ago with no file received.", async () => {
      // Arrange

      // Create an in progress application.
      const application = await saveFakeApplication(
        db.dataSource,
        { student },
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
            dateReceived: undefined,
            dateSent: addDays(-4, new Date()),
            fileSent: "DUMMY_BYPASS_CRA_SENT_FILE.txt",
          },
        },
      );
      await db.craIncomeVerification.save(craVerification);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      expect(result).toStrictEqual([
        "Completed file processing issue notifications.",
      ]);

      // Assert
      expect(
        mockedJob.containLogMessages([
          "Total overdue CRA income verifications: 0",
        ]),
      ).toBe(true);
      const notificationExists = await db.notification.exists({
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
      expect(notificationExists).toBe(false);
    });

    it("Should not generate a notification for a CRA file processing issue when the CRA Verification was sent 6 days ago with a file received.", async () => {
      // Arrange

      // Create an in progress application.
      const application = await saveFakeApplication(
        db.dataSource,
        { student },
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
            dateReceived: addDays(-2, new Date()),
            dateSent: addDays(-6, new Date()),
            fileSent: "DUMMY_BYPASS_CRA_SENT_FILE.txt",
          },
        },
      );
      await db.craIncomeVerification.save(craVerification);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      expect(result).toStrictEqual([
        "Completed file processing issue notifications.",
      ]);

      // Assert
      expect(
        mockedJob.containLogMessages([
          "Total overdue CRA income verifications: 0",
        ]),
      ).toBe(true);
      const notificationExists = await db.notification.exists({
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
      expect(notificationExists).toBe(false);
    });

    it("Should generate a notification for a SIN file processing issue when the SIN Validation was sent 6 days ago with no file received.", async () => {
      // Arrange
      const sinValidation = createFakeSINValidation(
        {
          student,
        },
        {
          initialValue: {
            dateReceived: null,
            dateSent: addDays(-6, new Date()),
            fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
          },
        },
      );
      await db.sinValidation.save(sinValidation);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      expect(result).toStrictEqual([
        "Completed file processing issue notifications.",
      ]);

      // Assert
      expect(
        mockedJob.containLogMessages(["Total overdue SIN validations: 1"]),
      ).toBe(true);
      const notification = await db.notification.findOne({
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
      expect(notification).toBeDefined();
      expect(notification!.messagePayload).toStrictEqual({
        email_address: MINISTRY_EMAIL_ADDRESS,
        template_id: "cb0efb5a-7540-4925-b017-e9d96852368f",
        personalisation: {
          dateSent: getPSTPDTDateTime(sinValidation.dateSent!),
          fileName: sinValidation.fileSent,
          type: "SIN",
        },
      });
    });

    it("Should not generate a notification for a SIN file processing issue when the SIN Validation was sent 4 days ago with no file received.", async () => {
      // Arrange
      const sinValidation = createFakeSINValidation(
        {
          student,
        },
        {
          initialValue: {
            dateReceived: null,
            dateSent: addDays(-4, new Date()),
            fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
          },
        },
      );
      await db.sinValidation.save(sinValidation);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      expect(result).toStrictEqual([
        "Completed file processing issue notifications.",
      ]);

      // Assert
      expect(
        mockedJob.containLogMessages(["Total overdue SIN validations: 0"]),
      ).toBe(true);
      const notificationExists = await db.notification.exists({
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
      expect(notificationExists).toBe(false);
    });

    it("Should not generate a notification for a SIN file processing issue when the SIN Validation was sent 6 days ago with a file received.", async () => {
      // Arrange
      const sinValidation = createFakeSINValidation(
        {
          student,
        },
        {
          initialValue: {
            dateReceived: addDays(-2, new Date()),
            dateSent: addDays(-6, new Date()),
            fileSent: "DUMMY_BYPASS_SIN_SENT_FILE.txt",
          },
        },
      );
      await db.sinValidation.save(sinValidation);

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      expect(result).toStrictEqual([
        "Completed file processing issue notifications.",
      ]);

      // Assert
      expect(
        mockedJob.containLogMessages(["Total overdue SIN validations: 0"]),
      ).toBe(true);
      const notificationExists = await db.notification.exists({
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
      expect(notificationExists).toBe(false);
    });
  },
);
