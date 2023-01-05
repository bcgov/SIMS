require("../../../../../../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ECertFileHandler } from "@sims/integrations/esdc-integration";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  DisbursementOveraward,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  EducationProgramOffering,
  OfferingIntensity,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import {
  createFakeApplication,
  createFakeDisbursementSchedule,
  createFakeDisbursementValue,
  createFakeEducationProgramOffering,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import { QueueConsumersModule } from "../../../../../queue-consumers.module";

jest.setTimeout(60000);

describe("Schedulers - e-Cert full time integration - Create e-Cert file", () => {
  let eCertFileHandler: ECertFileHandler;
  let userRepo: Repository<User>;
  let studentRepo: Repository<Student>;
  let applicationRepo: Repository<Application>;
  let studentAssessmentRepo: Repository<StudentAssessment>;
  let educationProgramOfferingRepo: Repository<EducationProgramOffering>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [QueueConsumersModule],
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = app.get(DataSource);
    eCertFileHandler = app.get(ECertFileHandler);
    userRepo = dataSource.getRepository(User);
    studentRepo = dataSource.getRepository(Student);
    applicationRepo = dataSource.getRepository(Application);
    studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
    educationProgramOfferingRepo = dataSource.getRepository(
      EducationProgramOffering,
    );
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
    disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
  });

  it("Should initialize ECertIntegrationModule", async () => {
    // Arrange
    const savedUser = await userRepo.save(createFakeUser());
    const savedStudent = await studentRepo.save(createFakeStudent(savedUser));
    const fakeApplication = createFakeApplication({ student: savedStudent });
    fakeApplication.applicationNumber = "OA_TEST001";
    const savedApplication = await applicationRepo.save(fakeApplication);
    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      auditUser: savedUser,
    });
    fakeOriginalAssessment.application = savedApplication;
    // Original assessment - first disbursement.
    const firstSchedule = createFakeDisbursementSchedule({
      auditUser: savedUser,
      disbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          "1250",
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCLoan,
          "BCSL",
          "800",
          { disbursedAmountSubtracted: "50" },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          "1500",
        ),
      ],
    });
    firstSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Pending;
    // Original assessment - second disbursement.
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
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    fakeOffering.offeringIntensity = OfferingIntensity.fullTime;
    const savedOffering = await educationProgramOfferingRepo.save(fakeOffering);
    fakeOriginalAssessment.offering = savedOffering;
    const savedOriginalAssessment = await studentAssessmentRepo.save(
      fakeOriginalAssessment,
    );
    savedApplication.currentAssessment = savedOriginalAssessment;
    savedApplication.applicationStatus = ApplicationStatus.completed;
    await applicationRepo.save(savedApplication);

    const eCertResult = await eCertFileHandler.generateFullTimeECert();
    expect(eCertResult).toBeDefined();
  });
});
