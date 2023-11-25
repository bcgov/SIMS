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
  getUploadedFile,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { IsNull, Like, Not } from "typeorm";
import {
  createTestingAppModule,
  describeQueueProcessorRootTest,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { Job } from "bull";
import { PartTimeECertProcessIntegrationScheduler } from "../ecert-part-time-process-integration.scheduler";
import * as Client from "ssh2-sftp-client";
import * as dayjs from "dayjs";

describe(
  describeQueueProcessorRootTest(QueueNames.PartTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeECertProcessIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(PartTimeECertProcessIntegrationScheduler);
    });

    beforeEach(async () => {
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
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
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
      // id and name defined to make the console log looks better only.
      const job = createMock<Job<void>>({
        id: "FakeJobId",
        name: "FakeProcessPartTimeECertJobName",
      });

      // Act
      const result = await processor.processPartTimeECert(job);

      // Assert
      expect(result).toStrictEqual(["Process finalized with success."]);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      expect(uploadedFile.remoteFilePath).toBe(
        `MSFT-Request\\DPBC.EDU.PTCERTS.D${fileDate}.001`,
      );
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
  },
);
