import {
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  Notification,
  NotificationMessage,
  NotificationMessageType,
  OfferingIntensity,
  RelationshipStatus,
  RestrictionActionType,
  RestrictionBypassBehaviors,
  RestrictionType,
  Student,
  User,
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
  saveFakeApplicationRestrictionBypass,
  createFakeUser,
  saveFakeStudentRestriction,
  createFakeDisbursementOveraward,
  RestrictionCode,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import { getUploadedFile } from "@sims/test-utils/mocks";
import { ArrayContains, IsNull, Like, Not } from "typeorm";
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
import {
  AVIATION_CREDENTIAL_TEST_INPUTS,
  awardAssert,
  createBlockedDisbursementTestData,
  loadAwardValues,
  loadDisbursementAndStudentRestrictions,
  loadDisbursementSchedules,
} from "./e-cert-utils";
import { SystemUsersService } from "@sims/services";
import { faker } from "@faker-js/faker";
import { ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP } from "@sims/integrations/esdc-integration";
import { ConfigService } from "@sims/utilities/config";

describe(
  describeQueueProcessorRootTest(QueueNames.PartTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeECertProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let systemUsersService: SystemUsersService;
    let sharedMinistryUser: User;

    beforeAll(async () => {
      // Env variable required for querying the eligible e-Cert records.
      process.env.APPLICATION_ARCHIVE_DAYS = "365";
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(PartTimeECertProcessIntegrationScheduler);
      systemUsersService = app.get(SystemUsersService);
      // Insert fake email contact to send ministry email.
      await db.notificationMessage.update(
        {
          id: NotificationMessageType.MinistryNotificationDisbursementBlocked,
        },
        { emailContacts: ["dummy@some.domain"] },
      );
      // Create a Ministry user to b used, for instance, for audit.
      sharedMinistryUser = await db.user.save(createFakeUser());
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
        { sequenceName: Like("ECERT_PT_SENT_FILE%") },
        { sequenceNumber: "0" },
      );
    });

    it("Should create a notification for the ministry and student for a blocked disbursement when there are no previously existing notifications for the disbursement.", async () => {
      // Arrange
      const { student, disbursement } =
        await createBlockedDisbursementTestData(db);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);

      // Assert
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 0",
      ]);
      expect(
        mockedJob.containLogMessages([
          `Ministry Blocked Disbursement notification created for disbursement ID ${disbursement.id}.`,
          `Student Blocked Disbursement notification created for disbursement ID ${disbursement.id}.`,
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
            disbursementId: disbursement.id,
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

    it(
      "Should create a notification for the ministry and student for a blocked disbursement when it doesn't have estimated awards" +
        " and there are no previously existing notifications for the disbursement.",
      async () => {
        // Arrange
        const { student, disbursement } =
          await createBlockedDisbursementTestData(db, {
            isValidSIN: true,
            disbursementValues: [],
          });
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert uploaded file.
        const uploadedFile = getUploadedFile(sftpClientMock);
        const uploadedFileName = getUploadedFileName();
        expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
        // Assert
        expect(result).toStrictEqual([
          `Generated file: ${uploadedFileName}`,
          "Uploaded records: 0",
        ]);
        expect(
          mockedJob.containLogMessages([
            "Disbursement estimated awards do not contain any amount to be disbursed.",
            `Ministry Blocked Disbursement notification created for disbursement ID ${disbursement.id}.`,
            `Student Blocked Disbursement notification created for disbursement ID ${disbursement.id}.`,
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
              disbursementId: disbursement.id,
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
      },
    );

    it("Should not create a notification for the student for a disbursement when there are already 3 notifications created.", async () => {
      // Arrange
      const { student, disbursement } =
        await createBlockedDisbursementTestData(db);
      // Create pre-existing notificationsToCreate notifications for the student and ministry for the above created disbursement.
      const notificationsToCreate = 3;
      await saveNotifications(notificationsToCreate, student, disbursement.id);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);

      // Assert
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 0",
      ]);
      const notificationsCount = await db.notification.count({
        where: {
          metadata: {
            disbursementId: disbursement.id,
          },
          dateSent: IsNull(),
        },
      });
      expect(notificationsCount).toBe(0);
    });

    it("Should not create a notification for the student for a disbursement when an attempt is made to create the 2nd notification before 7 days from the first notification.", async () => {
      // Arrange
      const { student, disbursement } =
        await createBlockedDisbursementTestData(db);
      // Create 1 pre-existing notification for the student and the ministry 6 days before the current date for the above created disbursement.
      await saveNotifications(1, student, disbursement.id, -6);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);

      // Assert
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 0",
      ]);
      expect(
        mockedJob.containLogMessages([
          "The step determined that the calculation should be interrupted. This disbursement will not be part of the next e-Cert generation.",
          `Ministry Blocked Disbursement notification should not be created at this moment for disbursement ID ${disbursement.id}.`,
          `Student Blocked Disbursement notification should not be created at this moment for disbursement ID ${disbursement.id}.`,
        ]),
      ).toBe(true);
      const notificationsCount = await db.notification.count({
        where: {
          notificationMessage: {
            id: NotificationMessageType.StudentNotificationDisbursementBlocked,
          },
          metadata: {
            disbursementId: disbursement.id,
          },
          dateSent: IsNull(),
        },
      });
      expect(notificationsCount).toBe(0);
    });

    it("Should create a notification for the student for a disbursement when an attempt is made to create the 2nd notification on or after 7 days from the first notification.", async () => {
      // Arrange
      const { student, disbursement } =
        await createBlockedDisbursementTestData(db);
      // Create 1 pre-existing notification for the above created disbursement.
      await saveNotifications(1, student, disbursement.id, -7);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);

      // Assert
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 0",
      ]);
      expect(
        mockedJob.containLogMessages([
          `Ministry Blocked Disbursement notification should not be created at this moment for disbursement ID ${disbursement.id}.`,
          `Student Blocked Disbursement notification created for disbursement ID ${disbursement.id}.`,
        ]),
      ).toBe(true);
      const notificationsCount = await db.notification.count({
        where: {
          metadata: {
            disbursementId: disbursement.id,
          },
          dateSent: IsNull(),
        },
      });
      // Checking 1 created notification for the student only.
      expect(notificationsCount).toBe(1);
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
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              1234.57,
            ),
          ],
        },
        {
          applicationInitialValues: {
            applicationStatus: ApplicationStatus.Completed,
            relationshipStatus: RelationshipStatus.MarriedUnable,
          },
          offeringIntensity: OfferingIntensity.partTime,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
          },
        },
      );
      const eCertLifetimeSequence = 100000;
      await db.sequenceControl.upsert(
        {
          sequenceName: ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP,
          sequenceNumber: eCertLifetimeSequence.toString(),
        },
        ["sequenceName"],
      );
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);

      expect(uploadedFile.fileLines).toHaveLength(3);
      const [header, record, footer] = uploadedFile.fileLines;
      const headerSequence = header.substring(58, 64);
      // Validate header.
      const expectedHeaderSequence = (eCertLifetimeSequence + 1).toString();
      expect(headerSequence).toBe(expectedHeaderSequence);
      expect(header).toContain("01BC  NEW PT ENTITLEMENT");
      // Validate footer.
      // Record Type.
      expect(footer.substring(0, 2)).toBe("99");
      // Total amount disbursed including 2 decimals.
      expect(footer.substring(17, 26)).toBe("000123500");
      // Validate record.
      const recordParsed = new PartTimeCertRecordParser(record);
      expect(recordParsed.recordType).toBe("02");
      expect(recordParsed.hasUser(student.user)).toBe(true);
      expect(recordParsed.gender).toBe("X");
      expect(recordParsed.disbursementAmount).toBe("000123500");
      expect(recordParsed.maritalStatus).toBe("MA");
      // TODO include other fields as needed.

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

    it("Should generate an e-cert file with only header and footer when there is no disbursement to be sent.", async () => {
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 0",
      ]);

      // Assert header and footer
      const [header, footer] = uploadedFile.fileLines;
      // Validate header.
      expect(header).toContain("01BC  NEW PT ENTITLEMENT");
      // Validate footer.
      expect(footer.substring(0, 2)).toBe("99");
    });

    it("Should create an e-Cert with valid student profile data when the student has necessary profile data and gender defined as 'Prefer not to answer'.", async () => {
      // Arrange
      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource, null, {
        initialValue: {
          gender: "preferNotToAnswer",
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
      // Student application eligible for e-Cert.
      await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              1234.57,
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
      await processor.processQueue(job);

      // Assert
      // Assert student profile data.
      const uploadedFile = getUploadedFile(sftpClientMock);
      expect(uploadedFile.fileLines).toHaveLength(3);
      const [, record] = uploadedFile.fileLines;
      // TODO: include other student profile fields as needed.
      const recordParsed = new PartTimeCertRecordParser(record);
      expect(recordParsed.recordType).toBe("02");
      expect(recordParsed.hasUser(student.user)).toBe(true);
      expect(recordParsed.gender).toBe(" ");
    });

    it("Should adjust tuition remittance when requested tuition remittance is greater than the max tuition remittance.", async () => {
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
        {
          student,
          msfaaNumber,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              1000,
            ),
          ],
          secondDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              1000,
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          createSecondDisbursement: true,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            tuitionRemittanceRequestedAmount: 600,
            tuitionRemittanceEffectiveAmount: 500,
            dateSent: new Date(),
            readyToSendDate: new Date(),
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            disbursementDate: getISODateOnlyString(addDays(-30)),
          },
          secondDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            tuitionRemittanceRequestedAmount: 700,
            readyToSendDate: new Date(),
            disbursementDate: getISODateOnlyString(new Date()),
          },
        },
      );
      // Adjust offering values for maxTuitionRemittanceAllowed.
      application.currentAssessment.offering.actualTuitionCosts = 500;
      application.currentAssessment.offering.programRelatedCosts = 400;
      application.currentAssessment.offering.mandatoryFees = 200;
      await db.educationProgramOffering.save(
        application.currentAssessment.offering,
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
        "Uploaded records: 1",
      ]);

      expect(
        mockedJob.containLogMessages([
          "The tuition remittance was adjusted because exceeded the maximum allowed of 600.",
        ]),
      ).toBe(true);

      const [, secondDisbursementSchedule] =
        application.currentAssessment.disbursementSchedules;

      const updatedSecondDisbursementSchedule =
        await db.disbursementSchedule.findOne({
          select: {
            tuitionRemittanceRequestedAmount: true,
            tuitionRemittanceEffectiveAmount: true,
          },
          where: { id: secondDisbursementSchedule.id },
        });

      expect(
        updatedSecondDisbursementSchedule.tuitionRemittanceRequestedAmount,
      ).toBe(700);
      expect(
        updatedSecondDisbursementSchedule.tuitionRemittanceEffectiveAmount,
      ).toBe(600);
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
      const result = await processor.processQueue(job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
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
            // Default test data for CSLP life time maximum same as CSLP balance provided here.
            // When the CSLP balance is equal to maximum limit
            // then any new disbursement with a CSLP award greater than 0 cannot be sent.
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
      const result = await processor.processQueue(job);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);

      // Assert
      expect(result).toStrictEqual([
        `Generated file: ${uploadedFileName}`,
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
      expect(isScheduleNotSent).toBe(true);

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
      const result = await processor.processQueue(job);

      // Assert
      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const uploadedFileName = getUploadedFileName();
      expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
      expect(result).toStrictEqual([
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

    it(
      "Should have the e-Cert generated for a part-time application and the bypass resolved " +
        `when a student has an active 'Stop part time disbursement' restriction and it is bypassed with behavior '${RestrictionBypassBehaviors.NextDisbursementOnly}'.`,
      async () => {
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
          {
            student,
            msfaaNumber,
            firstDisbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLP",
                1234.57,
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
        // Create restriction bypass.
        const restrictionBypass = await saveFakeApplicationRestrictionBypass(
          db,
          {
            application,
            bypassCreatedBy: sharedMinistryUser,
            creator: sharedMinistryUser,
          },
          {
            restrictionActionType:
              RestrictionActionType.StopPartTimeDisbursement,
            initialValues: {
              bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
            },
          },
        );

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessage(
            `Current active restriction bypasses [Restriction Code(Restriction ID)]: ${restrictionBypass.studentRestriction.restriction.restrictionCode}(${restrictionBypass.studentRestriction.id}).`,
          ),
        ).toBe(true);
        expect(
          mockedJob.containLogMessage(
            "There are no active restriction bypasses.",
          ),
        ).toBe(false);

        const [firstSchedule] =
          application.currentAssessment.disbursementSchedules;
        // Assert schedule is updated to 'Sent' with the dateSent defined.
        const scheduleIsSent = await db.disbursementSchedule.exists({
          where: {
            id: firstSchedule.id,
            dateSent: Not(IsNull()),
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        });
        expect(scheduleIsSent).toBe(true);
        // Validate if the restriction was resolved.
        const resolvedBypass = await db.applicationRestrictionBypass.findOne({
          select: {
            id: true,
            isActive: true,
            bypassRemovedDate: true,
            bypassRemovedBy: { id: true },
            removalNote: { description: true },
          },
          relations: {
            bypassRemovedBy: true,
            removalNote: true,
          },
          where: { id: restrictionBypass.id },
        });
        expect(resolvedBypass).toEqual({
          id: restrictionBypass.id,
          isActive: false,
          bypassRemovedDate: expect.any(Date),
          bypassRemovedBy: {
            id: systemUsersService.systemUser.id,
          },
          removalNote: {
            description: `Automatically removing bypass from application number ${application.applicationNumber} after the first e-Cert was generated.`,
          },
        });
      },
    );

    it(
      "Should have the e-Cert generated for a part-time application when an application has an active institution " +
        `'${RestrictionCode.SUS}' restriction and it is bypassed with behavior '${RestrictionBypassBehaviors.NextDisbursementOnly}'.`,
      async () => {
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
          {
            student,
            msfaaNumber,
            firstDisbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLF",
                9999,
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
        // Create an institution restriction.
        const restriction = await db.restriction.findOne({
          select: {
            id: true,
            restrictionCode: true,
          },
          where: {
            restrictionCode: RestrictionCode.SUS,
          },
        });
        const susRestriction = await saveFakeInstitutionRestriction(db, {
          restriction,
          program: application.currentAssessment.offering.educationProgram,
          institution:
            application.currentAssessment.offering.institutionLocation
              .institution,
          location: application.currentAssessment.offering.institutionLocation,
        });
        // Create a bypass for the above created institution restriction.
        const restrictionBypass = await saveFakeApplicationRestrictionBypass(
          db,
          {
            application,
            institutionRestriction: susRestriction,
            bypassCreatedBy: sharedMinistryUser,
            creator: sharedMinistryUser,
          },
          {
            initialValues: {
              bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
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
            `Current active restriction bypasses [Restriction Code(Restriction ID)]: ${restrictionBypass.institutionRestriction.restriction.restrictionCode}(${restrictionBypass.institutionRestriction.id}).`,
          ]),
        ).toBe(true);

        const [firstSchedule] =
          application.currentAssessment.disbursementSchedules;
        // Check if the disbursement was sent.
        const isScheduleSent = await db.disbursementSchedule.exists({
          where: {
            id: firstSchedule.id,
            dateSent: Not(IsNull()),
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        });
        expect(isScheduleSent).toBe(true);
        // Validate if the bypass is still active.
        const isBypassActive = await db.applicationRestrictionBypass.exists({
          where: { id: restrictionBypass.id, isActive: true },
        });
        expect(isBypassActive).toBe(false);
      },
    );

    it(
      "Should prevent an e-Cert generation and keep the bypass active when " +
        `multiple '${RestrictionActionType.StopPartTimeDisbursement}' restrictions exist and only one is bypassed and it is bypassed with behavior '${RestrictionBypassBehaviors.NextDisbursementOnly}'.`,
      async () => {
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
          {
            student,
            msfaaNumber,
            firstDisbursementValues: [
              createFakeDisbursementValue(
                DisbursementValueType.CanadaLoan,
                "CSLP",
                9999,
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
        // Create restriction bypass.
        const restrictionBypass = await saveFakeApplicationRestrictionBypass(
          db,
          {
            application,
            bypassCreatedBy: sharedMinistryUser,
            creator: sharedMinistryUser,
          },
          {
            restrictionActionType:
              RestrictionActionType.StopPartTimeDisbursement,
            initialValues: {
              bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
            },
          },
        );
        // Find another restriction to be associated with the student.
        // This restriction will not be bypassed and should block the disbursement,
        // making the bypass not be resolved.
        const restriction = await db.restriction.findOne({
          select: { id: true },
          where: {
            restrictionType: RestrictionType.Provincial,
            actionType: ArrayContains([
              RestrictionActionType.StopPartTimeDisbursement,
            ]),
            actionEffectiveConditions: IsNull(),
          },
        });
        // Create a non-bypassed student restriction to stop disbursement.
        await saveFakeStudentRestriction(db.dataSource, {
          student: application.student,
          restriction,
        });

        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        await processor.processQueue(mockedJob.job);

        // Assert
        expect(
          mockedJob.containLogMessages([
            `Current active restriction bypasses [Restriction Code(Restriction ID)]: ${restrictionBypass.studentRestriction.restriction.restrictionCode}(${restrictionBypass.studentRestriction.id}).`,
            `Student has an active '${RestrictionActionType.StopPartTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
          ]),
        ).toBe(true);

        const [firstSchedule] =
          application.currentAssessment.disbursementSchedules;
        // Check if the disbursement is still pending.
        const isSchedulePending = await db.disbursementSchedule.exists({
          where: {
            id: firstSchedule.id,
            dateSent: IsNull(),
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        });
        expect(isSchedulePending).toBe(true);
        // Validate if the bypass is still active.
        const isBypassActive = await db.applicationRestrictionBypass.exists({
          where: { id: restrictionBypass.id, isActive: true },
        });
        expect(isBypassActive).toBe(true);
      },
    );

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
                email_address: faker.internet.email(),
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

    it("Should create an e-Cert with no overaward deductions when the student has overawards.", async () => {
      // Overawards deductions should not be considered at this time for part-time applications.

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
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              1000,
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
      // Create fake overawards.
      const fakeCanadaLoanOverawardBalance = createFakeDisbursementOveraward({
        student,
      });
      fakeCanadaLoanOverawardBalance.disbursementValueCode = "CSLP";
      fakeCanadaLoanOverawardBalance.overawardValue = 750;
      const cslpOveraward = await db.disbursementOveraward.save(
        fakeCanadaLoanOverawardBalance,
      );
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      await processor.processQueue(job);

      // Assert
      const [firstSchedule] =
        application.currentAssessment.disbursementSchedules;
      // Assert schedule is updated to 'Sent' and effectiveAmount
      // was not impacted by the existing overaward.
      const schedule = await db.disbursementSchedule.findOne({
        select: {
          id: true,
          disbursementScheduleStatus: true,
          disbursementValues: { effectiveAmount: true },
        },
        relations: {
          disbursementValues: true,
        },
        where: {
          id: firstSchedule.id,
          dateSent: Not(IsNull()),
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          disbursementValues: {
            valueCode: "CSLP",
          },
        },
      });
      expect(schedule.disbursementScheduleStatus).toBe(
        DisbursementScheduleStatus.Sent,
      );
      const [cslpDisbursementValue] = schedule.disbursementValues;
      expect(cslpDisbursementValue.effectiveAmount).toEqual(1000);
      // Validate if overaward was not impacted.
      const nonUpdatedCSLPOveraward = await db.disbursementOveraward.exists({
        where: {
          id: cslpOveraward.id,
          disbursementValueCode: "CSLP",
          overawardValue: 750,
        },
      });
      expect(nonUpdatedCSLPOveraward).toBe(true);
    });

    it(`Should stop disbursing BC funding for a part-time application when a '${RestrictionActionType.StopPartTimeBCGrants}' restriction is applied.`, async () => {
      // Arrange
      // Eligible COE basic properties.
      const eligibleDisbursement: Partial<DisbursementSchedule> = {
        coeStatus: COEStatus.completed,
        coeUpdatedAt: new Date(),
      };

      // Find one restriction to be associated with the student.
      const restriction = await db.restriction.findOne({
        select: { id: true },
        where: {
          restrictionType: RestrictionType.Provincial,
          actionEffectiveConditions: IsNull(),
          actionType: ArrayContains([
            RestrictionActionType.StopPartTimeBCGrants,
          ]),
        },
      });
      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );
      const applicationB = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLP",
              199,
            ),
            // Should be disbursed because it is a federal grant.
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSGP",
              299,
            ),
            // Should not be disbursed due to StopPartTimeBCGrants restriction.
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "SBSD",
              399,
            ),
            // Should not be disbursed due to StopPartTimeBCGrants restriction.
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              499,
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
            ...eligibleDisbursement,
            disbursementDate: getISODateOnlyString(addDays(1)),
          },
        },
      );

      await saveFakeStudentRestriction(db.dataSource, {
        student: applicationB.student,
        restriction,
        resolutionNote: null,
        creator: sharedMinistryUser,
      });

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      await processor.processQueue(mockedJob.job);

      // Assert
      expect(
        mockedJob.containLogMessages([
          "Checking stop funding restriction.",
          "Applying restriction for SBSD.",
          "Applying restriction for BCAG.",
        ]),
      ).toBe(true);
      // Select the SBSD, BCAG, and BCSG to validate the values impacted by the restriction.
      // BCSG is created as the SUM of all BC grants and it must be 0(zero) when there is a
      // StopPartTimeBCGrants restriction.
      const [applicationBDisbursement1] =
        applicationB.currentAssessment.disbursementSchedules;
      const record3Awards = await loadAwardValues(
        db,
        applicationBDisbursement1.id,
        { valueCode: ["SBSD", "BCAG", "BCSG"] },
      );
      expect(
        awardAssert(record3Awards, "SBSD", {
          valueAmount: 399,
          restrictionAmountSubtracted: 399,
          effectiveAmount: 0,
        }),
      ).toBe(true);
      expect(
        awardAssert(record3Awards, "BCAG", {
          valueAmount: 499,
          restrictionAmountSubtracted: 499,
          effectiveAmount: 0,
        }),
      ).toBe(true);
      expect(
        awardAssert(record3Awards, "BCSG", {
          valueAmount: 0,
          restrictionAmountSubtracted: 0,
          effectiveAmount: 0,
        }),
      ).toBe(true);
    });

    it(
      "Should block the disbursement and log the information when the institution" +
        " has an effective institution restriction for the application location and program" +
        ` with action type ${RestrictionActionType.StopPartTimeDisbursement}.`,
      async () => {
        // Arrange
        // Eligible COE basic properties.
        const eligibleDisbursement: Partial<DisbursementSchedule> = {
          coeStatus: COEStatus.completed,
          coeUpdatedAt: new Date(),
        };
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
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
          },
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              ...eligibleDisbursement,
              disbursementDate: getISODateOnlyString(addDays(1)),
            },
          },
        );
        // Institution restriction that blocks disbursement.
        const restriction = await db.restriction.findOne({
          select: { id: true },
          where: {
            restrictionType: RestrictionType.Institution,
            actionType: ArrayContains([
              RestrictionActionType.StopPartTimeDisbursement,
            ]),
          },
        });
        const offering = application.currentAssessment.offering;
        const location = offering.institutionLocation;
        const program = offering.educationProgram;
        const institution = location.institution;
        // Add institution restriction for the application location and program.
        await saveFakeInstitutionRestriction(db, {
          restriction,
          institution,
          program,
          location,
        });
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert
        // Assert uploaded file.
        const uploadedFile = getUploadedFile(sftpClientMock);
        const uploadedFileName = getUploadedFileName();
        expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
        // No records should be sent.
        expect(result).toStrictEqual([
          `Generated file: ${uploadedFileName}`,
          "Uploaded records: 0",
        ]);
        // Assert log messages for the blocked disbursement.
        expect(
          mockedJob.containLogMessages([
            `Institution has an effective '${RestrictionActionType.StopPartTimeDisbursement}' restriction` +
              ` for program ${program.id} and location ${location.id} and the disbursement calculation will not proceed.`,
            "The step determined that the calculation should be interrupted. This disbursement will not be part of the next e-Cert generation.",
          ]),
        ).toBe(true);
        const [disbursement] =
          application.currentAssessment.disbursementSchedules;
        // Assert that the disbursement is still in status 'Pending' with date sent null.
        const scheduleIsPending = await db.disbursementSchedule.exists({
          where: {
            id: disbursement.id,
            dateSent: IsNull(),
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        });
        expect(scheduleIsPending).toBe(true);
      },
    );

    it(
      "Should create the e-Cert and log the information when the institution" +
        " does not have an effective institution restriction for the application location and program" +
        ` with action type ${RestrictionActionType.StopPartTimeDisbursement}.`,
      async () => {
        // Arrange
        // Eligible COE basic properties.
        const eligibleDisbursement: Partial<DisbursementSchedule> = {
          coeStatus: COEStatus.completed,
          coeUpdatedAt: new Date(),
        };
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
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            msfaaNumber,
          },
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentData: { weeks: 5 } as Assessment,
              assessmentDate: new Date(),
            },
            firstDisbursementInitialValues: {
              ...eligibleDisbursement,
              disbursementDate: getISODateOnlyString(addDays(1)),
            },
          },
        );
        // Institution restriction that blocks disbursement.
        const restriction = await db.restriction.findOne({
          select: { id: true },
          where: {
            restrictionType: RestrictionType.Institution,
            actionType: ArrayContains([
              RestrictionActionType.StopPartTimeDisbursement,
            ]),
          },
        });
        const location =
          application.currentAssessment.offering.institutionLocation;
        const institution = location.institution;
        // Add institution restriction for the application location but different program.
        await saveFakeInstitutionRestriction(
          db,
          {
            restriction,
            institution,
            location,
          },
          { createProgram: true },
        );
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert
        // Assert uploaded file.
        const uploadedFile = getUploadedFile(sftpClientMock);
        const uploadedFileName = getUploadedFileName();
        expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
        // No records should be sent.
        expect(result).toStrictEqual([
          `Generated file: ${uploadedFileName}`,
          "Uploaded records: 1",
        ]);
        // Assert log messages for the blocked disbursement.
        expect(
          mockedJob.containLogMessages([
            `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadyToSend}'.`,
          ]),
        ).toBe(true);
        const [disbursement] =
          application.currentAssessment.disbursementSchedules;
        // Assert that the disbursement is updated to status 'sent' with the dateSent defined.
        const scheduleIsSent = await db.disbursementSchedule.exists({
          where: {
            id: disbursement.id,
            dateSent: Not(IsNull()),
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        });
        expect(scheduleIsSent).toBe(true);
      },
    );

    describe("Aviation credential part-time applications e-Cert generation", () => {
      for (const {
        aviationCredentialType,
        restrictionCode,
      } of AVIATION_CREDENTIAL_TEST_INPUTS) {
        it(
          `Should calculate and send the e-cert and create restriction ${restrictionCode} after persisting the e-cert calculations` +
            ` when a student is funded for an aviation credential type '${aviationCredentialType}' for the first time.`,
          async () => {
            // Arrange
            // Eligible COE basic properties.
            const eligibleDisbursement: Partial<DisbursementSchedule> = {
              coeStatus: COEStatus.completed,
              coeUpdatedAt: new Date(),
            };
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
            const aviationCredentialApplication =
              await saveFakeApplicationDisbursements(
                db.dataSource,
                {
                  student,
                  msfaaNumber,
                  firstDisbursementValues: [
                    createFakeDisbursementValue(
                      DisbursementValueType.CanadaLoan,
                      "CSLP",
                      100,
                    ),
                    createFakeDisbursementValue(
                      DisbursementValueType.BCLoan,
                      "CSPT",
                      150,
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
                    ...eligibleDisbursement,
                    disbursementDate: getISODateOnlyString(addDays(1)),
                  },
                  offeringInitialValues: {
                    isAviationOffering: "yes",
                    aviationCredentialType,
                  },
                },
              );

            // Queued job.
            const mockedJob = mockBullJob<void>();

            // Act
            const result = await processor.processQueue(mockedJob.job);

            // Assert
            // Assert uploaded file.
            const uploadedFile = getUploadedFile(sftpClientMock);
            const uploadedFileName = getUploadedFileName();
            expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
            // One record should be sent.
            expect(result).toStrictEqual([
              `Generated file: ${uploadedFileName}`,
              "Uploaded records: 1",
            ]);
            // Assert log messages for the successful disbursement and created restriction.
            expect(
              mockedJob.containLogMessages([
                `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadyToSend}'.`,
                "Checking offering for aviation credential types to add a restriction.",
                `New restriction ${restrictionCode} for the aviation credential type ${aviationCredentialType} was added.`,
              ]),
            ).toBe(true);
            const [disbursement] =
              aviationCredentialApplication.currentAssessment
                .disbursementSchedules;
            // Validate the disbursement schedule status and created student restriction.
            const updatedDisbursement =
              await loadDisbursementAndStudentRestrictions(db, disbursement.id);
            expect(updatedDisbursement).toEqual({
              id: disbursement.id,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              studentAssessment: {
                id: aviationCredentialApplication.currentAssessment.id,
                application: {
                  id: aviationCredentialApplication.id,
                  student: {
                    id: aviationCredentialApplication.student.id,
                    studentRestrictions: [
                      {
                        id: expect.any(Number),
                        isActive: true,
                        restriction: {
                          id: expect.any(Number),
                          restrictionCode: restrictionCode,
                        },
                      },
                    ],
                  },
                },
              },
            });
          },
        );

        it(
          `Should block the disbursement for aviation credential type '${aviationCredentialType}'` +
            ` when the student already has an active restriction ${restrictionCode} added due to previous funding of the same aviation credential type.`,
          async () => {
            // Arrange
            // Eligible COE basic properties.
            const eligibleDisbursement: Partial<DisbursementSchedule> = {
              coeStatus: COEStatus.completed,
              coeUpdatedAt: new Date(),
            };
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
            const aviationCredentialApplication =
              await saveFakeApplicationDisbursements(
                db.dataSource,
                {
                  student,
                  msfaaNumber,
                  firstDisbursementValues: [
                    createFakeDisbursementValue(
                      DisbursementValueType.CanadaLoan,
                      "CSLP",
                      100,
                    ),
                    createFakeDisbursementValue(
                      DisbursementValueType.BCLoan,
                      "CSPT",
                      150,
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
                    ...eligibleDisbursement,
                    disbursementDate: getISODateOnlyString(addDays(1)),
                  },
                  offeringInitialValues: {
                    isAviationOffering: "yes",
                    aviationCredentialType,
                  },
                },
              );
            // Add a student restriction for the same aviation credential type.
            const restriction = await db.restriction.findOne({
              select: { id: true },
              where: { restrictionCode },
            });
            const studentRestriction = await saveFakeStudentRestriction(
              db.dataSource,
              {
                student: aviationCredentialApplication.student,
                restriction,
              },
            );
            // Queued job.
            const mockedJob = mockBullJob<void>();

            // Act
            const result = await processor.processQueue(mockedJob.job);

            // Assert
            // Assert uploaded file.
            const uploadedFile = getUploadedFile(sftpClientMock);
            const uploadedFileName = getUploadedFileName();
            expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
            // No records should be sent.
            expect(result).toStrictEqual([
              `Generated file: ${uploadedFileName}`,
              "Uploaded records: 0",
            ]);
            // Assert log messages for the blocked disbursement.
            expect(
              mockedJob.containLogMessages([
                `Student has an active '${RestrictionActionType.StopPartTimeDisbursement}' restriction and the disbursement calculation will not proceed.`,
                "The step determined that the calculation should be interrupted. This disbursement will not be part of the next e-Cert generation.",
              ]),
            ).toBe(true);
            const [disbursement] =
              aviationCredentialApplication.currentAssessment
                .disbursementSchedules;
            // Validate the disbursement schedule status and existing student restriction.
            const updatedDisbursement =
              await loadDisbursementAndStudentRestrictions(db, disbursement.id);
            expect(updatedDisbursement).toEqual({
              id: disbursement.id,
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
              studentAssessment: {
                id: aviationCredentialApplication.currentAssessment.id,
                application: {
                  id: aviationCredentialApplication.id,
                  student: {
                    id: aviationCredentialApplication.student.id,
                    // Student should have only one student restriction added from previous funding.
                    studentRestrictions: [
                      {
                        id: studentRestriction.id,
                        isActive: true,
                        restriction: {
                          id: restriction.id,
                          restrictionCode: restrictionCode,
                        },
                      },
                    ],
                  },
                },
              },
            });
          },
        );
      }

      it(
        "Should generate e-cert and not block the disbursement for aviation credential type 'commercialPilotTraining'" +
          ` and create an aviation restriction ${RestrictionCode.AVCP} for 'commercialPilotTraining' after persisting the calculations` +
          " when the student already has an active restriction AVEN added due to previous funding but for different aviation credential type.",
        async () => {
          // Arrange
          const aviationCredentialType = "commercialPilotTraining";
          // Restriction code for a different aviation credential.
          const differentAviationCredentialRestrictionCode =
            RestrictionCode.AVEN;
          // Eligible COE basic properties.
          const eligibleDisbursement: Partial<DisbursementSchedule> = {
            coeStatus: COEStatus.completed,
            coeUpdatedAt: new Date(),
          };
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
          const aviationCredentialApplication =
            await saveFakeApplicationDisbursements(
              db.dataSource,
              {
                student,
                msfaaNumber,
                firstDisbursementValues: [
                  createFakeDisbursementValue(
                    DisbursementValueType.CanadaLoan,
                    "CSLP",
                    100,
                  ),
                  createFakeDisbursementValue(
                    DisbursementValueType.BCLoan,
                    "CSPT",
                    150,
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
                  ...eligibleDisbursement,
                  disbursementDate: getISODateOnlyString(addDays(1)),
                },
                offeringInitialValues: {
                  isAviationOffering: "yes",
                  aviationCredentialType,
                },
              },
            );
          // Add a student restriction for the different aviation credential type.
          const restriction = await db.restriction.findOne({
            select: { id: true },
            where: {
              restrictionCode: differentAviationCredentialRestrictionCode,
            },
          });
          const differentAviationCredentialRestriction =
            await saveFakeStudentRestriction(db.dataSource, {
              student: aviationCredentialApplication.student,
              restriction,
            });
          // Queued job.
          const mockedJob = mockBullJob<void>();

          // Act
          const result = await processor.processQueue(mockedJob.job);

          // Assert
          // Assert uploaded file.
          const uploadedFile = getUploadedFile(sftpClientMock);
          const uploadedFileName = getUploadedFileName();
          expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
          // One record should be sent.
          expect(result).toStrictEqual([
            `Generated file: ${uploadedFileName}`,
            "Uploaded records: 1",
          ]);
          // Assert log messages for the successful disbursement and created restriction for the aviation credential.
          expect(
            mockedJob.containLogMessages([
              `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadyToSend}'.`,
              "Checking offering for aviation credential types to add a restriction.",
              `New restriction ${RestrictionCode.AVCP} for the aviation credential type ${aviationCredentialType} was added.`,
            ]),
          ).toBe(true);
          const [disbursement] =
            aviationCredentialApplication.currentAssessment
              .disbursementSchedules;
          // Validate the disbursement schedule status and existing and new student restriction.
          const updatedDisbursement =
            await loadDisbursementAndStudentRestrictions(db, disbursement.id);
          expect(updatedDisbursement).toEqual({
            id: disbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            studentAssessment: {
              id: aviationCredentialApplication.currentAssessment.id,
              application: {
                id: aviationCredentialApplication.id,
                student: {
                  id: aviationCredentialApplication.student.id,
                  // Student should have 2 student restrictions where one is added from previous funding
                  // and the other one is added from the current e-cert generation.
                  studentRestrictions: [
                    {
                      id: differentAviationCredentialRestriction.id,
                      isActive: true,
                      restriction: {
                        id: restriction.id,
                        restrictionCode:
                          differentAviationCredentialRestrictionCode,
                      },
                    },
                    {
                      id: expect.any(Number),
                      isActive: true,
                      restriction: {
                        id: expect.any(Number),
                        restrictionCode: RestrictionCode.AVCP,
                      },
                    },
                  ],
                },
              },
            },
          });
        },
      );

      it(
        "Should generate e-cert and not block the disbursement for aviation credential type 'commercialPilotTraining'" +
          ` when the student already has an active restriction ${RestrictionCode.AVCP} added due to previous funding of the same aviation credential type` +
          " but the restriction was bypassed.",
        async () => {
          // Arrange
          const aviationCredentialType = "commercialPilotTraining";
          // Eligible COE basic properties.
          const eligibleDisbursement: Partial<DisbursementSchedule> = {
            coeStatus: COEStatus.completed,
            coeUpdatedAt: new Date(),
          };
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
          const aviationCredentialApplication =
            await saveFakeApplicationDisbursements(
              db.dataSource,
              {
                student,
                msfaaNumber,
                firstDisbursementValues: [
                  createFakeDisbursementValue(
                    DisbursementValueType.CanadaLoan,
                    "CSLP",
                    100,
                  ),
                  createFakeDisbursementValue(
                    DisbursementValueType.BCLoan,
                    "CSPT",
                    150,
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
                  ...eligibleDisbursement,
                  disbursementDate: getISODateOnlyString(addDays(1)),
                },
                offeringInitialValues: {
                  isAviationOffering: "yes",
                  aviationCredentialType,
                },
              },
            );
          // Add a student restriction for the same aviation credential type.
          const restriction = await db.restriction.findOne({
            select: { id: true },
            where: { restrictionCode: RestrictionCode.AVCP },
          });
          const studentRestriction = await saveFakeStudentRestriction(
            db.dataSource,
            {
              student: aviationCredentialApplication.student,
              restriction,
            },
          );
          // Create restriction bypass.
          await saveFakeApplicationRestrictionBypass(db, {
            application: aviationCredentialApplication,
            studentRestriction,
          });
          // Queued job.
          const mockedJob = mockBullJob<void>();

          // Act
          const result = await processor.processQueue(mockedJob.job);

          // Assert
          // Assert uploaded file.
          const uploadedFile = getUploadedFile(sftpClientMock);
          const uploadedFileName = getUploadedFileName();
          expect(uploadedFile.remoteFilePath).toBe(uploadedFileName);
          // One record should be sent.
          expect(result).toStrictEqual([
            `Generated file: ${uploadedFileName}`,
            "Uploaded records: 1",
          ]);
          // Assert log messages for the successful disbursement and existing student restriction.
          expect(
            mockedJob.containLogMessages([
              `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadyToSend}'.`,
              "Checking offering for aviation credential types to add a restriction.",
              `Student already has a ${RestrictionCode.AVCP} restriction for the aviation credential type commercialPilotTraining.`,
            ]),
          ).toBe(true);
          const [disbursement] =
            aviationCredentialApplication.currentAssessment
              .disbursementSchedules;
          // Validate the disbursement schedule status and existing student restriction.
          const updatedDisbursement =
            await loadDisbursementAndStudentRestrictions(db, disbursement.id);
          expect(updatedDisbursement).toEqual({
            id: disbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            studentAssessment: {
              id: aviationCredentialApplication.currentAssessment.id,
              application: {
                id: aviationCredentialApplication.id,
                student: {
                  id: aviationCredentialApplication.student.id,
                  // Student should have only one student restriction added from previous funding.
                  studentRestrictions: [
                    {
                      id: studentRestriction.id,
                      isActive: true,
                      restriction: {
                        id: restriction.id,
                        restrictionCode: RestrictionCode.AVCP,
                      },
                    },
                  ],
                },
              },
            },
          });
        },
      );
    });

    /**
     * Helper function to get the uploaded file name.
     * @returns The uploaded file name
     */
    function getUploadedFileName(): string {
      const ftpRequestFolder = new ConfigService().esdcIntegration
        .ftpRequestFolder;
      const fileDate = dayjs().format("YYYYMMDD");
      const uploadedFileName = `${ftpRequestFolder}\\DPBC.EDU.NEW.PTCERTS.D${fileDate}.001`;
      return uploadedFileName;
    }
  },
);
