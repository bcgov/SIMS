import {
  Application,
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
  DisbursementValueType,
  EducationProgramOffering,
  MSFAANumber,
  OfferingIntensity,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  MSFAAStates,
  createE2EDataSources,
  createFakeApplication,
  createFakeDisbursementOveraward,
  createFakeDisbursementSchedule,
  createFakeDisbursementValue,
  createFakeEducationProgramOffering,
  createFakeMSFAANumber,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
} from "@sims/test-utils";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import { IsNull, Not, Repository } from "typeorm";
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
    let userRepo: Repository<User>;
    let studentRepo: Repository<Student>;
    let applicationRepo: Repository<Application>;
    let studentAssessmentRepo: Repository<StudentAssessment>;
    let educationProgramOfferingRepo: Repository<EducationProgramOffering>;
    let msfaaNumberRepo: Repository<MSFAANumber>;
    let disbursementOverawardRepo: Repository<DisbursementOveraward>;
    let disbursementScheduleRepo: Repository<DisbursementSchedule>;
    let disbursementValueRepo: Repository<DisbursementValue>;
    let db: E2EDataSources;

    beforeAll(async () => {
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      userRepo = dataSource.getRepository(User);
      studentRepo = dataSource.getRepository(Student);
      applicationRepo = dataSource.getRepository(Application);
      studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
      educationProgramOfferingRepo = dataSource.getRepository(
        EducationProgramOffering,
      );
      msfaaNumberRepo = dataSource.getRepository(MSFAANumber);
      disbursementOverawardRepo = dataSource.getRepository(
        DisbursementOveraward,
      );
      disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
      disbursementValueRepo = dataSource.getRepository(DisbursementValue);
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

      // User
      const savedUser = await userRepo.save(createFakeUser());
      // Student.
      const savedStudent = await studentRepo.save(createFakeStudent(savedUser));
      // Student SIN Validation
      savedStudent.sinValidation = createFakeSINValidation({
        student: savedStudent,
      });
      await studentRepo.save(savedStudent);
      // MSFAA Number.
      const savedMSFAANumber = await msfaaNumberRepo.save(
        createFakeMSFAANumber(
          { student: savedStudent },
          { msfaaState: MSFAAStates.Signed },
        ),
      );
      // Create and save application.
      const fakeApplication = createFakeApplication({ student: savedStudent });
      const savedApplication = await applicationRepo.save(fakeApplication);
      // Original assessment.
      const fakeOriginalAssessment = createFakeStudentAssessment({
        auditUser: savedUser,
      });
      // Weeks are needed for the e-Cert generation but does not matter for this test.
      fakeOriginalAssessment.assessmentData = { weeks: 5 } as Assessment;
      fakeOriginalAssessment.application = savedApplication;
      // Original assessment - first disbursement.
      const firstSchedule = createFakeDisbursementSchedule({
        auditUser: savedUser,
        disbursementValues: [
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
        ],
      });
      firstSchedule.coeStatus = COEStatus.completed;
      firstSchedule.disbursementScheduleStatus =
        DisbursementScheduleStatus.Pending;
      firstSchedule.msfaaNumber = savedMSFAANumber;
      fakeOriginalAssessment.disbursementSchedules = [firstSchedule];
      // Offering.
      const fakeOffering = createFakeEducationProgramOffering({
        auditUser: savedUser,
      });
      fakeOffering.offeringIntensity = OfferingIntensity.fullTime;
      const savedOffering = await educationProgramOfferingRepo.save(
        fakeOffering,
      );
      fakeOriginalAssessment.offering = savedOffering;
      const savedOriginalAssessment = await studentAssessmentRepo.save(
        fakeOriginalAssessment,
      );
      savedApplication.currentAssessment = savedOriginalAssessment;
      savedApplication.applicationStatus = ApplicationStatus.Completed;
      await applicationRepo.save(savedApplication);
      // Create fake overawards.
      const fakeCanadaLoanOverawardBalance = createFakeDisbursementOveraward({
        student: savedStudent,
      });
      fakeCanadaLoanOverawardBalance.disbursementValueCode = "CSLF";
      fakeCanadaLoanOverawardBalance.overawardValue = 4500;
      await disbursementOverawardRepo.save(fakeCanadaLoanOverawardBalance);
      // Queued job.
      // id and name defined to make the console log looks better only.
      const job = createMock<Job<void>>({
        id: "FakeJobId",
        name: "FakeJobName",
      });

      // Act
      await processor.processFullTimeECert(job);

      // Assert

      // Assert Canada Loan overawards were deducted.
      const hasCanadaLoanOverawardDeduction =
        await disbursementOverawardRepo.exist({
          where: {
            student: {
              id: savedStudent.id,
            },
            overawardValue: -4000,
            disbursementValueCode: "CSLF",
            originType: DisbursementOverawardOriginType.AwardDeducted,
          },
        });
      expect(hasCanadaLoanOverawardDeduction).toBe(true);

      // Assert schedule is updated to 'sent' with the dateSent defined.
      const scheduleIsSent = await disbursementScheduleRepo.exist({
        where: {
          id: firstSchedule.id,
          dateSent: Not(IsNull()),
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      });
      expect(scheduleIsSent).toBe(true);

      // Assert awards

      // Select all awards generated for the schedule.
      const awards = await disbursementValueRepo.find({
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
      // At least one file must be generated.
      // TODO: test the uploaded file using the SSH mock.
      //expect(result.generatedFile).toBeTruthy();
      //expect(result.uploadedRecords).toBeGreaterThanOrEqual(1);
    });
  },
);
