require("../../../../../../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ECertFileHandler } from "@sims/integrations/esdc-integration";
import { SshService } from "@sims/integrations/services";
import {
  Application,
  ApplicationStatus,
  Assessment,
  COEStatus,
  DisbursementOveraward,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  EducationProgramOffering,
  MSFAANumber,
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
  createFakeMSFAANumber,
  createFakeStudent,
  createFakeStudentAssessment,
  createFakeUser,
} from "@sims/test-utils";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import sshServiceMock from "@sims/test-utils/mocks/ssh-service.mock";
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
  let msfaaNumberRepo: Repository<MSFAANumber>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [QueueConsumersModule],
    })
      .overrideProvider(SshService)
      .useValue(sshServiceMock)
      .compile();
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
    msfaaNumberRepo = dataSource.getRepository(MSFAANumber);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
    disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
  });

  it("Should initialize ECertIntegrationModule", async () => {
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
      createFakeMSFAANumber({ student: savedStudent }),
    );
    // Create and save application.
    const fakeApplication = createFakeApplication({ student: savedStudent });
    fakeApplication.applicationNumber = "ECERT_TEST";
    fakeApplication.msfaaNumber = savedMSFAANumber;
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
          "5000",
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCLoan,
          "BCSL",
          "4000",
          { disbursedAmountSubtracted: "1000" },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          "2000",
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BCAG",
          "1500",
          { disbursedAmountSubtracted: "500" },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BGPD",
          "2500",
        ),
      ],
    });
    firstSchedule.coeStatus = COEStatus.completed;
    firstSchedule.disbursementScheduleStatus =
      DisbursementScheduleStatus.Pending;
    fakeOriginalAssessment.disbursementSchedules = [firstSchedule];
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
