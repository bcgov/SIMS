import {
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeMSFAANumber,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
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

describe(
  describeQueueProcessorRootTest(QueueNames.PartTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeECertProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

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
      const scheduleIsSent = await db.disbursementSchedule.exist({
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
  },
);
