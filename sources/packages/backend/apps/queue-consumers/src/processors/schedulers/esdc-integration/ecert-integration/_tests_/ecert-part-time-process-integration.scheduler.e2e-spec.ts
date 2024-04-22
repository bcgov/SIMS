import {
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  Notification,
  NotificationMessage,
  NotificationMessageType,
  OfferingIntensity,
  Student,
} from "@sims/sims-db";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeMSFAANumber,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
  createFakeNotification,
  createFakeStudentLoanBalance,
  createFakeDisbursementValue,
} from "@sims/test-utils";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { IsNull, Like, Not } from "typeorm";
import {
  createTestingAppModule,
  describeQueueProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import { QueueNames, addDays, getISODateOnlyString } from "@sims/utilities";
import { DeepMocked } from "@golevelup/ts-jest";
import { PartTimeECertProcessIntegrationScheduler } from "../ecert-part-time-process-integration.scheduler";
import * as Client from "ssh2-sftp-client";
import * as dayjs from "dayjs";
import { DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS } from "@sims/services/constants";
import { PartTimeCertRecordParser } from "./parsers/part-time-e-cert-record-parser";
import { loadDisbursementSchedules } from "./e-cert-utils";
import { GCNotifyService, SystemUsersService } from "@sims/services";

describe(
  describeQueueProcessorRootTest(QueueNames.PartTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeECertProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let systemUsersService: SystemUsersService;
    let gcNotifyService: GCNotifyService;

    beforeAll(async () => {
      // Env variable required for querying the eligible e-Cert records.
      process.env.APPLICATION_ARCHIVE_DAYS = "42";
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(PartTimeECertProcessIntegrationScheduler);
      systemUsersService = app.get(SystemUsersService);
      gcNotifyService = app.get(GCNotifyService);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Ensures that every disbursement on database is cancelled allowing the e-Certs to
      // be generated with the data created for every specific scenario.
      await db.disbursementSchedule.update(
        {
          disbursementScheduleStatus: Not(DisbursementScheduleStatus.Cancelled),
        },
        { disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled },
      );
      // Reset sequence number to control the file name generated.
      await db.sequenceControl.update(
        { sequenceName: Like("ECERT_PT_SENT_FILE_%") },
        { sequenceNumber: "0" },
      );
    });

    it("Should create a notification for the ministry and student for a blocked disbursement when there are no previously existing notifications for the disbursement.", async () => {
      // Arrange
      const { student, disbursementId } = await createTestData();
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processECert(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Generated file: none",
        "Uploaded records: 0",
      ]);
      expect(
        mockedJob.containLogMessages([
          `Creating notifications for disbursement id: ${disbursementId} for student and ministry.`,
          `Completed creating notifications for disbursement id: ${disbursementId} for student and ministry.`,
        ]),
      ).toBe(true);
      const notifications = await db.notification.find({
        select: {
          id: true,
          user: { id: true },
          notificationMessage: { id: true },
        },
        relations: { user: true, notificationMessage: true },
        where: {
          metadata: {
            disbursementId,
          },
          dateSent: IsNull(),
        },
        order: { notificationMessage: { id: "ASC" } },
      });
      expect(notifications).toEqual([
        {
          id: expect.any(Number),
          notificationMessage: {
            id: NotificationMessageType.StudentNotificationDisbursementBlocked,
          },
          user: { id: student.user.id },
        },
        {
          id: expect.any(Number),
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationDisbursementBlocked,
          },
          user: { id: systemUsersService.systemUser.id },
        },
      ]);
    });

    it("Should not create a notification for the student for a disbursement when there are already 3 notifications created.", async () => {
      // Arrange
      const { student, disbursementId } = await createTestData();
      // Create pre-existing notificationsToCreate notifications for the student and ministry for the above created disbursement.
      const notificationsToCreate = 3;
      await saveNotifications(notificationsToCreate, student, disbursementId);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processECert(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Generated file: none",
        "Uploaded records: 0",
      ]);
      const notificationsCount = await db.notification.count({
        where: {
          metadata: {
            disbursementId,
          },
          dateSent: IsNull(),
        },
      });
      expect(notificationsCount).toBe(0);
    });

    it("Should not create a notification for the student for a disbursement when an attempt is made to create the 2nd notification before 7 days from the first notification.", async () => {
      // Arrange
      const { student, disbursementId } = await createTestData();
      // Create 1 pre-existing notification for the student and the ministry 6 days before the current date for the above created disbursement.
      await saveNotifications(1, student, disbursementId, -6);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processECert(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Generated file: none",
        "Uploaded records: 0",
      ]);
      const notificationsCount = await db.notification.count({
        where: {
          notificationMessage: {
            id: NotificationMessageType.StudentNotificationDisbursementBlocked,
          },
          metadata: {
            disbursementId,
          },
          dateSent: IsNull(),
        },
      });
      expect(notificationsCount).toBe(0);
    });

    it("Should create a notification for the student for a disbursement when an attempt is made to create the 2nd notification on or after 7 days from the first notification.", async () => {
      // Arrange
      const { student, disbursementId } = await createTestData();
      // Create 1 pre-existing notification for the above created disbursement.
      await saveNotifications(1, student, disbursementId, -7);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processECert(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Generated file: none",
        "Uploaded records: 0",
      ]);
      expect(
        mockedJob.containLogMessages([
          `Creating notifications for disbursement id: ${disbursementId} for student and ministry.`,
          `Completed creating notifications for disbursement id: ${disbursementId} for student and ministry.`,
        ]),
      ).toBe(true);
      const notificationsCount = await db.notification.count({
        where: {
          metadata: {
            disbursementId,
          },
          dateSent: IsNull(),
        },
      });
      // Checking 1 created notification for the student and 1 notification for the ministry.
      expect(notificationsCount).toBe(2);
    });

    it("Should create an e-Cert with one disbursement record for one student with one eligible schedule.", async () => {
      // Arrange

      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student },
          {
            msfaaState: MSFAAStates.Signed,
            msfaaInitialValues: {
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );
      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      // Assert

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      const uploadedFileName = `MSFT-Request\\DPBC.EDU.NEW.PTCERTS.D${fileDate}.001`;
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        "Process finalized with success.",
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);

      expect(uploadedFile.fileLines).toHaveLength(3);
      const [header, record, footer] = uploadedFile.fileLines;
      // Validate header.
      expect(header).toContain("01BC  NEW PT ENTITLEMENT");
      // Validate record.
      expect(record.substring(0, 2)).toBe("02");
      // Validate footer.
      expect(footer.substring(0, 2)).toBe("99");

      // Assert Canada Loan overawards were deducted.
      const [firstSchedule] =
        application.currentAssessment.disbursementSchedules;
      // Assert schedule is updated to 'sent' with the dateSent defined.
      const scheduleIsSent = await db.disbursementSchedule.exists({
        where: {
          id: firstSchedule.id,
          dateSent: Not(IsNull()),
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      });
      expect(scheduleIsSent).toBe(true);
    });

    it("Should create an e-Cert with three disbursements for two different students with two disbursements each where three records are eligible.", async () => {
      // Arrange

      const coeUpdatedAt = new Date();

      // Student A with valid SIN.
      const studentA = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumberA = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student: studentA },
          {
            msfaaState: MSFAAStates.Signed,
            msfaaInitialValues: {
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );

      // Student A with valid SIN.
      const studentB = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumberB = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student: studentB },
          {
            msfaaState: MSFAAStates.Signed,
            msfaaInitialValues: {
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );

      // Student A application eligible for e-Cert with 2 disbursements.
      const applicationStudentA = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student: studentA, msfaaNumber: msfaaNumberA },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            coeUpdatedAt,
            disbursementDate: getISODateOnlyString(new Date()),
          },
          secondDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            coeUpdatedAt,
            disbursementDate: getISODateOnlyString(new Date()),
          },
        },
      );

      // Student B application eligible for e-Cert with 1 disbursements.
      const applicationStudentB = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student: studentB, msfaaNumber: msfaaNumberB },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            coeUpdatedAt,
            disbursementDate: getISODateOnlyString(new Date()),
          },
          // Force the second disbursement to not be eligible due to the disbursement date.
          secondDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            coeUpdatedAt,
            disbursementDate: getISODateOnlyString(
              addDays(DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS + 1),
            ),
          },
        },
      );

      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      // Assert

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      const uploadedFileName = `MSFT-Request\\DPBC.EDU.NEW.PTCERTS.D${fileDate}.001`;
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        "Process finalized with success.",
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 3",
      ]);

      expect(uploadedFile.fileLines).toHaveLength(5);
      const [header, record1, record2, record3, footer] =
        uploadedFile.fileLines;
      // Validate header.
      expect(header).toContain("01BC  NEW PT ENTITLEMENT");
      // Validate footer.
      expect(footer.substring(0, 2)).toBe("99");
      // Student A
      const [studentAFirstSchedule, studentASecondSchedule] =
        await loadDisbursementSchedules(
          db,
          applicationStudentA.currentAssessment.id,
        );
      // Disbursement 1.
      const studentADisbursement1 = new PartTimeCertRecordParser(record1);
      expect(studentADisbursement1.recordType).toBe("02");
      expect(studentADisbursement1.hasUser(studentA.user)).toBe(true);
      expect(studentAFirstSchedule.disbursementScheduleStatus).toBe(
        DisbursementScheduleStatus.Sent,
      );
      // Disbursement 2.
      const studentADisbursement2 = new PartTimeCertRecordParser(record2);
      expect(studentADisbursement2.recordType).toBe("02");
      expect(studentADisbursement2.hasUser(studentA.user)).toBe(true);
      expect(studentASecondSchedule.disbursementScheduleStatus).toBe(
        DisbursementScheduleStatus.Sent,
      );
      // Student B
      const [studentBFirstSchedule, studentBSecondSchedule] =
        await loadDisbursementSchedules(
          db,
          applicationStudentB.currentAssessment.id,
        );
      // Disbursement 1.
      const studentBDisbursement1 = new PartTimeCertRecordParser(record3);
      expect(studentBDisbursement1.recordType).toBe("02");
      expect(studentBDisbursement1.hasUser(studentB.user)).toBe(true);
      expect(studentBFirstSchedule.disbursementScheduleStatus).toBe(
        DisbursementScheduleStatus.Sent,
      );
      // Disbursement 2.
      expect(studentBSecondSchedule.disbursementScheduleStatus).toBe(
        DisbursementScheduleStatus.Pending,
      );
    });

    it("Should not create an e-Cert record for student when the maximum lifetime CSLP amount is less than the sum of latest CSLP balance and the disbursement amount.", async () => {
      // Arrange

      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student },
          {
            msfaaState: MSFAAStates.Signed,
            msfaaInitialValues: {
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );

      // Update CSLP balance for the student.
      await db.studentLoanBalance.insert(
        createFakeStudentLoanBalance(
          { student },
          {
            initialValues: {
              cslBalance: 10000,
            },
          },
        ),
      );

      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, msfaaNumber },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;

      const notifications = await db.notification.find({
        select: {
          id: true,
          user: { id: true },
          notificationMessage: { id: true },
        },
        relations: { user: true, notificationMessage: true },
        where: {
          metadata: { disbursementId: firstDisbursement.id },
          dateSent: IsNull(),
        },
        order: { notificationMessage: { id: "ASC" } },
      });

      // Assert
      expect(result).toStrictEqual([
        "Process finalized with success.",
        "Generated file: none",
        "Uploaded records: 0",
      ]);
      const [disbursement] =
        application.currentAssessment.disbursementSchedules;
      const isScheduleNotSent = await db.disbursementSchedule.exists({
        where: {
          id: disbursement.id,
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
        },
      });

      expect(notifications).toEqual([
        {
          id: expect.any(Number),
          notificationMessage: {
            id: NotificationMessageType.StudentNotificationDisbursementBlocked,
          },
          user: { id: student.user.id },
        },
        {
          id: expect.any(Number),
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationDisbursementBlocked,
          },
          user: { id: systemUsersService.systemUser.id },
        },
      ]);

      expect(isScheduleNotSent).toBe(true);
    });

    it("Should create an e-Cert record for student when the maximum lifetime CSLP amount is greater than or equal to the sum of latest CSLP balance and the disbursement amount.", async () => {
      // Arrange

      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student },
          {
            msfaaState: MSFAAStates.Signed,
            msfaaInitialValues: {
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );

      // Update CSLP balance for the student.
      await db.studentLoanBalance.insert(
        createFakeStudentLoanBalance(
          { student },
          {
            initialValues: {
              cslBalance: 9700,
            },
          },
        ),
      );

      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              300,
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processECert(job);

      // Assert
      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      const uploadedFileName = `MSFT-Request\\DPBC.EDU.NEW.PTCERTS.D${fileDate}.001`;
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        "Process finalized with success.",
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);

      const [firstSchedule] =
        application.currentAssessment.disbursementSchedules;
      // Assert schedule is updated to 'sent' with the dateSent defined.
      const scheduleIsSent = await db.disbursementSchedule.exists({
        where: {
          id: firstSchedule.id,
          dateSent: Not(IsNull()),
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      });
      expect(scheduleIsSent).toBe(true);
    });

    /**
     * Create and save required number of notifications for student and ministry.
     * @param notificationsCounter number of notifications to create.
     * @param student related student.
     * @param disbursementId related disbursement id.
     * @param daysAhead optional daysAhead to add the specified number of days.
     */
    async function saveNotifications(
      notificationsCounter: number,
      student: Student,
      disbursementId: number,
      daysAhead?: number,
    ): Promise<void> {
      let notificationsCount = notificationsCounter;
      const notifications: Notification[] = [];
      while (notificationsCount > 0) {
        const studentNotification = createFakeNotification(
          {
            user: student.user,
            auditUser: systemUsersService.systemUser,
            notificationMessage: {
              id: NotificationMessageType.StudentNotificationDisbursementBlocked,
            } as NotificationMessage,
          },
          {
            initialValue: {
              messagePayload: {
                email_address: student.user.email,
                template_id:
                  NotificationMessageType.StudentNotificationDisbursementBlocked,
                personalisation: {
                  givenNames: student.user.firstName ?? "",
                  lastName: student.user.lastName,
                },
              },
              metadata: {
                disbursementId,
              },
              createdAt: daysAhead ? addDays(daysAhead) : new Date(),
              dateSent: new Date(),
            },
          },
        );
        const ministryNotification = createFakeNotification(
          {
            user: systemUsersService.systemUser,
            auditUser: systemUsersService.systemUser,
            notificationMessage: {
              id: NotificationMessageType.MinistryNotificationDisbursementBlocked,
            } as NotificationMessage,
          },
          {
            initialValue: {
              messagePayload: {
                email_address: gcNotifyService.ministryToAddress(),
                template_id:
                  NotificationMessageType.MinistryNotificationDisbursementBlocked,
                personalisation: {
                  givenNames: student.user.firstName ?? "",
                  lastName: student.user.lastName,
                },
              },
              metadata: {
                disbursementId,
              },
              createdAt: daysAhead ? addDays(daysAhead) : new Date(),
              dateSent: new Date(),
            },
          },
        );
        notifications.push(studentNotification);
        notifications.push(ministryNotification);
        notificationsCount--;
      }
      await db.notification.save(notifications);
    }

    /**
     * Creates the test data required for the individual tests.
     * @returns the required test data.
     */
    async function createTestData(): Promise<{
      student: Student;
      disbursementId: number;
    }> {
      // Student with invalid SIN to block the disbursement.
      const student = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: {
          isValidSIN: false,
        },
      });
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student },
          {
            msfaaState: MSFAAStates.Signed,
            msfaaInitialValues: {
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );
      // Student application.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              300,
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );
      return {
        student,
        disbursementId:
          application.currentAssessment.disbursementSchedules[0].id,
      };
    }
  },
);
