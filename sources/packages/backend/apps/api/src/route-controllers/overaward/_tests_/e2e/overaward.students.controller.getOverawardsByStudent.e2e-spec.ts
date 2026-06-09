import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  createFakeDisbursementOveraward,
  createFakeStudentAssessment,
  saveFakeStudent,
  saveFakeApplication,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import {
  Application,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  StudentAssessment,
} from "@sims/sims-db";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import { TestingModule } from "@nestjs/testing";

describe("OverawardStudentsController(e2e)-getOverawardsByStudent", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let assessmentRepo: Repository<StudentAssessment>;
  let applicationRepo: Repository<Application>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    assessmentRepo = dataSource.getRepository(StudentAssessment);
    applicationRepo = dataSource.getRepository(Application);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
    appDataSource = dataSource;
    appModule = module;
  });

  it("Should return student overawards when available.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);

    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);

    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Prepare the student assessment to create overaward.
    const application = await saveFakeApplication(appDataSource, {
      student,
    });
    const studentAssessment = await assessmentRepo.save(
      createFakeStudentAssessment({
        auditUser: student.user,
        application,
        applicationEditStatusUpdatedBy: student.user,
      }),
    );
    application.currentAssessment = studentAssessment;
    await applicationRepo.save(application);
    // Create a reassessment CSLF overaward.
    const reassessmentOveraward = createFakeDisbursementOveraward({ student });
    reassessmentOveraward.studentAssessment = studentAssessment;
    reassessmentOveraward.disbursementValueCode = "CSLF";
    reassessmentOveraward.overawardValue = 500;
    reassessmentOveraward.originType =
      DisbursementOverawardOriginType.ReassessmentOveraward;
    reassessmentOveraward.addedDate = new Date();
    const savedReassessmentOveraward = await disbursementOverawardRepo.save(
      reassessmentOveraward,
    );
    // Create a manual CSLF overaward deduction.
    const manualOveraward = createFakeDisbursementOveraward({ student });
    manualOveraward.disbursementValueCode = "CSLF";
    manualOveraward.overawardValue = -123;
    manualOveraward.originType = DisbursementOverawardOriginType.ManualRecord;
    manualOveraward.addedDate = new Date();
    const savedManualOveraward =
      await disbursementOverawardRepo.save(manualOveraward);

    // Create an award deducted CSLP overaward. CSLP should not be returned in the overawards.
    const awardDeductedCSLP = createFakeDisbursementOveraward({ student });
    awardDeductedCSLP.disbursementValueCode = "CSLP";
    awardDeductedCSLP.overawardValue = 300;
    awardDeductedCSLP.originType =
      DisbursementOverawardOriginType.AwardDeducted;
    await disbursementOverawardRepo.save(awardDeductedCSLP);

    const endpoint = "/students/overaward";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          dateAdded: savedManualOveraward.addedDate!.toISOString(),
          createdAt: savedManualOveraward.createdAt.toISOString(),
          overawardOrigin: savedManualOveraward.originType,
          awardValueCode: savedManualOveraward.disbursementValueCode,
          overawardValue: savedManualOveraward.overawardValue,
        },
        {
          dateAdded: savedReassessmentOveraward.addedDate!.toISOString(),
          createdAt: savedReassessmentOveraward.createdAt.toISOString(),
          overawardOrigin: savedReassessmentOveraward.originType,
          awardValueCode: savedReassessmentOveraward.disbursementValueCode,
          overawardValue: savedReassessmentOveraward.overawardValue,
          applicationNumber: application.applicationNumber,
          assessmentTriggerType: studentAssessment.triggerType,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
