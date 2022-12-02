require("../../../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  DisbursementOveraward,
  DisbursementScheduleStatus,
  DisbursementValueType,
  EducationProgramOffering,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import {
  createFakeApplication,
  createFakeEducationProgramOffering,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
} from "@sims/test-utils";
import { createFakeDisbursementSchedule } from "@sims/test-utils/factories/disbursement-schedule";
import { createFakeDisbursementValue } from "@sims/test-utils/factories/disbursement-value";
import { DataSource, Repository } from "typeorm";
import { ZBClient } from "zeebe-node";
import { WorkersModule } from "../../../workers.module";
import { DisbursementScheduleService } from "../disbursement-schedule-service";
import { createFakeDisbursementPayload } from "./disbursement-payloads";

jest.setTimeout(15000);

describe("Disbursement Schedule Service - Create disbursement", () => {
  let userRepo: Repository<User>;
  let studentRepo: Repository<Student>;
  let applicationRepo: Repository<Application>;
  let studentAssessmentRepo: Repository<StudentAssessment>;
  let educationProgramOfferingRepo: Repository<EducationProgramOffering>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;
  let disbursementScheduleService: DisbursementScheduleService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkersModule],
    })
      .overrideProvider(ZBClient)
      .useValue({})
      .compile();
    const app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get(DataSource);
    userRepo = dataSource.getRepository(User);
    studentRepo = dataSource.getRepository(Student);
    applicationRepo = dataSource.getRepository(Application);
    studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
    educationProgramOfferingRepo = dataSource.getRepository(
      EducationProgramOffering,
    );
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
    disbursementScheduleService = app.get(DisbursementScheduleService);
  });

  it("Should generate an overaward when a reassessment happens and the student is entitled to less money", async () => {
    // Arrange
    const disbursementSchedulesPayload = createFakeDisbursementPayload();
    const savedUser = await userRepo.save(createFakeUser());
    const savedStudent = await studentRepo.save(createFakeStudent(savedUser));
    const fakeApplication = createFakeApplication(savedStudent);
    fakeApplication.applicationNumber = "OA_TEST001";
    const savedApplication = await applicationRepo.save(fakeApplication);
    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
    });
    fakeOriginalAssessment.application = savedApplication;
    // Original assessment - first disbursement (Sent).
    const firstSchedule = createFakeDisbursementSchedule({
      auditUser: savedUser,
      disbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSLF",
          "1000",
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCLoan,
          "BCSL",
          "500",
        ),
      ],
    });
    firstSchedule.disbursementScheduleStatus = DisbursementScheduleStatus.Sent;
    // Original assessment - second disbursement (Pending).
    const secondSchedule = createFakeDisbursementSchedule({
      auditUser: savedUser,
      disbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSLF",
          "1000",
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCLoan,
          "BCSL",
          "500",
        ),
      ],
    });
    secondSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Pending;
    fakeOriginalAssessment.disbursementSchedules = [
      firstSchedule,
      secondSchedule,
    ];
    // Reassessment.
    const savedOffering = await educationProgramOfferingRepo.save(
      createFakeEducationProgramOffering({ auditUser: savedUser }),
    );
    const fakeReassessment = createFakeStudentAssessment({
      auditUser: savedUser,
      offering: savedOffering,
    });
    fakeReassessment.triggerType = AssessmentTriggerType.OfferingChange;
    fakeReassessment.application = savedApplication;
    const [, savedReassessment] = await studentAssessmentRepo.save([
      fakeOriginalAssessment,
      fakeReassessment,
    ]);
    savedApplication.currentAssessment = fakeReassessment;
    savedApplication.applicationStatus = ApplicationStatus.completed;
    await applicationRepo.save(savedApplication);

    // Act
    const createdDisbursements =
      await disbursementScheduleService.createDisbursementSchedules(
        savedReassessment.id,
        disbursementSchedulesPayload,
      );

    // Asserts

    // Assert disbursement already paid subtracted.
    expect(createdDisbursements).toBeDefined();
    expect(createdDisbursements).toHaveLength(2);
    // Check Canada Loan, an overaward should be generated.
    const subtractedCanadaLoanAward = createdDisbursements
      .flatMap((disbursement) => disbursement.disbursementValues)
      .find(
        (scheduleValue) =>
          scheduleValue.valueType === DisbursementValueType.CanadaLoan &&
          scheduleValue.valueAmount === "500" &&
          scheduleValue.disbursedAmountSubtracted === "500",
      );
    expect(subtractedCanadaLoanAward).toBeDefined();
    expect(subtractedCanadaLoanAward).toHaveLength(1);
    // Check BC Loan, no overaward, just already paid award.
    const subtractedAward = createdDisbursements
      .flatMap((disbursement) => disbursement.disbursementValues)
      .find(
        (scheduleValue) =>
          scheduleValue.valueType === DisbursementValueType.BCLoan &&
          scheduleValue.valueAmount === "500" &&
          scheduleValue.disbursedAmountSubtracted === "500",
      );
    expect(subtractedAward).toBeDefined();
    expect(subtractedAward).toHaveLength(1);

    // Assert overaward creation.
    const overawards = await disbursementOverawardRepo.find({
      where: { student: { id: savedStudent.id } },
    });
    expect(overawards).toBeDefined();
    expect(overawards).toHaveLength(1);
    const [overaward] = overawards;
    expect(overaward.overawardValue).toBe("500");
    expect(overaward.disbursementValueCode).toBe("CSLF");
  });
});
