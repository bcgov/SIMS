import {
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeDisbursementOveraward,
  createFakeDisbursementValue,
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
import { QueueNames, addDays, getISODateOnlyString } from "@sims/utilities";
import { FullTimeECertProcessIntegrationScheduler } from "../ecert-full-time-process-integration.scheduler";
import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { Job } from "bull";
import * as Client from "ssh2-sftp-client";
import * as dayjs from "dayjs";

jest.setTimeout(1200000);

describe(
  describeQueueProcessorRootTest(QueueNames.FullTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: FullTimeECertProcessIntegrationScheduler;
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
      processor = app.get(FullTimeECertProcessIntegrationScheduler);
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
        { sequenceName: Like("ECERT_FT_SENT_FILE_%") },
        { sequenceNumber: "0" },
      );
    });

    it("Should execute overawards deductions and calculate awards effective value", async () => {
      // Arrange

      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );
      // Original assessment - first disbursement.
      const firstDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          5000,
          { disbursedAmountSubtracted: 1000 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCLoan,
          "BCSL",
          4000,
          { disbursedAmountSubtracted: 500 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          2000,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BCAG",
          1500,
          { disbursedAmountSubtracted: 500 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BGPD",
          2500,
        ),
      ];
      // Student application eligible for e-Cert.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student, disbursementValues: firstDisbursementValues, msfaaNumber },
        {
          offeringIntensity: OfferingIntensity.fullTime,
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
      fakeCanadaLoanOverawardBalance.disbursementValueCode = "CSLF";
      fakeCanadaLoanOverawardBalance.overawardValue = 4500;
      await db.disbursementOveraward.save(fakeCanadaLoanOverawardBalance);
      // Queued job.
      // id and name defined to make the console log looks better only.
      const job = createMock<Job<void>>({
        id: "FakeJobId",
        name: "FakeJobName",
      });

      // Act
      const result = await processor.processFullTimeECert(job);

      // Assert
      expect(result).toStrictEqual(["Process finalized with success."]);

      // Assert

      // Assert Canada Loan overawards were deducted.
      const hasCanadaLoanOverawardDeduction =
        await db.disbursementOveraward.exist({
          where: {
            student: {
              id: student.id,
            },
            overawardValue: -4000,
            disbursementValueCode: "CSLF",
            originType: DisbursementOverawardOriginType.AwardDeducted,
          },
        });
      expect(hasCanadaLoanOverawardDeduction).toBe(true);

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

      // Assert awards

      // Select all awards generated for the schedule.
      const awards = await db.disbursementValue.find({
        where: { disbursementSchedule: { id: firstSchedule.id } },
      });
      // Assert CSLF.
      const hasExpectedCSLF = awards.filter(
        (award) =>
          award.valueCode === "CSLF" &&
          award.disbursedAmountSubtracted === 1000 &&
          award.overawardAmountSubtracted === 4000 &&
          award.effectiveAmount === 0,
      );
      expect(hasExpectedCSLF.length).toBe(1);
      // Assert BCSL.
      const hasExpectedBCSL = awards.filter(
        (award) =>
          award.valueCode === "BCSL" &&
          award.disbursedAmountSubtracted === 500 &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 3500,
      );
      expect(hasExpectedBCSL.length).toBe(1);
      // Assert CSGP.
      const hasExpectedCSGP = awards.filter(
        (award) =>
          award.valueCode === "CSGP" &&
          !award.disbursedAmountSubtracted &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 2000,
      );
      expect(hasExpectedCSGP.length).toBe(1);
      // Assert BCAG.
      const hasExpectedBCAG = awards.filter(
        (award) =>
          award.valueCode === "BCAG" &&
          award.disbursedAmountSubtracted === 500 &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 1000,
      );
      expect(hasExpectedBCAG.length).toBe(1);
      // Assert BGPD.
      const hasExpectedBGPD = awards.filter(
        (award) =>
          award.valueCode === "BGPD" &&
          !award.disbursedAmountSubtracted &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 2500,
      );
      expect(hasExpectedBGPD.length).toBe(1);
      // The BC total grant (BCSG) will be generated and
      // inserted during the e-Cert process.
      const hasExpectedBCSG = awards.filter(
        (award) =>
          award.valueCode === "BCSG" &&
          !award.disbursedAmountSubtracted &&
          !award.overawardAmountSubtracted &&
          award.effectiveAmount === 3500,
      );
      expect(hasExpectedBCSG.length).toBe(1);
    });

    it.only("Should reduce BCSL award for first disbursement and withhold BC funding from second disbursement when the student reaches the maximum configured value for the year.", async () => {
      // Arrange
      const MAX_LIFE_TIME_BC_LOAN_AMOUNT = 50000;
      // Ensure the right disbursement order for the 3 disbursements.
      const [disbursementDate1, disbursementDate2, disbursementDate3] = [
        getISODateOnlyString(addDays(1)),
        getISODateOnlyString(addDays(2)),
        getISODateOnlyString(addDays(3)),
      ];

      const eligibleDisbursement: Partial<DisbursementSchedule> = {
        coeStatus: COEStatus.completed,
        coeUpdatedAt: new Date(),
      };

      // Student with valid SIN.
      const student = await saveFakeStudent(db.dataSource);
      // Valid MSFAA Number.
      const msfaaNumber = await db.msfaaNumber.save(
        createFakeMSFAANumber({ student }, { msfaaState: MSFAAStates.Signed }),
      );

      const applicationA = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              100,
            ),
            // Force the BCSL to be close to the limit (leave 500 for upcoming disbursement).
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "BCSL",
              MAX_LIFE_TIME_BC_LOAN_AMOUNT - 500,
            ),
          ],
          secondDisbursementValues: [
            // Force the BCSL to exceed the limit by 250 (previous disbursement left 500 room).
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "BCSL",
              750,
            ),
            // BC Grants should still be disbursed since BCSL has some value.
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              1500,
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            ...eligibleDisbursement,
            disbursementDate: disbursementDate1,
          },
          secondDisbursementInitialValues: {
            ...eligibleDisbursement,
            disbursementDate: disbursementDate2,
          },
        },
      );

      // Second application for the student when all BC funding will be withhold due to BCLM restriction
      // that must be created for the application A second disbursement.
      const applicationB = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber,
          firstDisbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              199,
            ),
            // Should be disbursed because it is a federal grant.
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSGP",
              299,
            ),
            // Should not be disbursed due to BCLM restriction.
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "BCSL",
              399,
            ),
            // Should not be disbursed due to BCLM restriction.
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              499,
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentData: { weeks: 5 } as Assessment,
            assessmentDate: new Date(),
          },
          firstDisbursementInitialValues: {
            ...eligibleDisbursement,
            disbursementDate: disbursementDate3,
          },
        },
      );

      // Application A and B shares the same program year.
      // Updating program year maximum to ensure the expect value.
      applicationA.programYear.maxLifetimeBCLoanAmount =
        MAX_LIFE_TIME_BC_LOAN_AMOUNT;
      await db.programYear.save(applicationA.programYear);

      // Queued job.
      // id and name defined to make the console log looks better only.
      const job = createMock<Job<void>>({
        id: "FakeJobId",
        name: "FakeProcessPartTimeECertJobName",
      });

      // Act
      const result = await processor.processFullTimeECert(job);

      // Assert
      expect(result).toStrictEqual(["Process finalized with success."]);

      // Assert uploaded file.
      const uploadedFile = getUploadedFile(sftpClientMock);
      const fileDate = dayjs().format("YYYYMMDD");
      expect(uploadedFile.remoteFilePath).toBe(
        `MSFT-Request\\DPBC.EDU.FTECERTS.${fileDate}.001`,
      );
      expect(uploadedFile.fileLines).toHaveLength(5);
      const [header, record1, record2, record3, footer] =
        uploadedFile.fileLines;
      // Validate header.
      expect(header).toContain("100BC  NEW ENTITLEMENT");
      // Validate footer.
      expect(footer.substring(0, 3)).toBe("999");
      // // Student A
      // const [studentAFirstSchedule, studentASecondSchedule] =
      //   await loadDisbursementSchedules(
      //     applicationStudentA.currentAssessment.id,
      //   );
      // // Disbursement 1.
      // const studentADisbursement1 = new PartTimeCertRecordParser(record1);
      // expect(studentADisbursement1.recordType).toBe("02");
      // expect(studentADisbursement1.containsStudent(studentA)).toBe(true);
      // expect(studentAFirstSchedule.disbursementScheduleStatus).toBe(
      //   DisbursementScheduleStatus.Sent,
      // );
      // // Disbursement 2.
      // const studentADisbursement2 = new PartTimeCertRecordParser(record2);
      // expect(studentADisbursement2.recordType).toBe("02");
      // expect(studentADisbursement2.containsStudent(studentA)).toBe(true);
      // expect(studentASecondSchedule.disbursementScheduleStatus).toBe(
      //   DisbursementScheduleStatus.Sent,
      // );
    });
  },
);
