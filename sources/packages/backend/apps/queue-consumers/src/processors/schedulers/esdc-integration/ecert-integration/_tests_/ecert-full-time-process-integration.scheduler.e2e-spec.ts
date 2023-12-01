import {
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementOverawardOriginType,
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
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { IsNull, Not } from "typeorm";
import {
  createTestingAppModule,
  describeQueueProcessorRootTest,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import { FullTimeECertProcessIntegrationScheduler } from "../ecert-full-time-process-integration.scheduler";
import { createMock } from "@golevelup/ts-jest";
import { Job } from "bull";

describe(
  describeQueueProcessorRootTest(QueueNames.FullTimeECertIntegration),
  () => {
    let app: INestApplication;
    let processor: FullTimeECertProcessIntegrationScheduler;
    let db: E2EDataSources;

    beforeAll(async () => {
      // Env variable required for querying the eligible e-Cert records.
      process.env.APPLICATION_ARCHIVE_DAYS = "42";
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      // Processor under test.
      processor = app.get(FullTimeECertProcessIntegrationScheduler);
      db = createE2EDataSources(dataSource);
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
  },
);
