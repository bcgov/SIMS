import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
      createFakeStudentAssessment({ auditUser: student.user, application }),
    );
    application.currentAssessment = studentAssessment;
    await applicationRepo.save(application);
    // Create an overaward.
    const reassessmentOveraward = createFakeDisbursementOveraward({ student });
    reassessmentOveraward.studentAssessment = studentAssessment;
    reassessmentOveraward.disbursementValueCode = "CSLP";
    reassessmentOveraward.overawardValue = 500;
    reassessmentOveraward.originType =
      DisbursementOverawardOriginType.ReassessmentOveraward;
    reassessmentOveraward.addedDate = new Date();
    const savedReassessmentOveraward = await disbursementOverawardRepo.save(
      reassessmentOveraward,
    );
    // Create a manual overaward deduction.
    const manualOveraward = createFakeDisbursementOveraward({ student });
    manualOveraward.disbursementValueCode = "CSLP";
    manualOveraward.overawardValue = -123;
    manualOveraward.originType = DisbursementOverawardOriginType.ManualRecord;
    manualOveraward.addedDate = new Date();
    const savedManualOveraward = await disbursementOverawardRepo.save(
      manualOveraward,
    );

    const endpoint = "/students/overaward";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          dateAdded: savedManualOveraward.addedDate.toISOString(),
          createdAt: savedManualOveraward.createdAt.toISOString(),
          overawardOrigin: savedManualOveraward.originType,
          awardValueCode: savedManualOveraward.disbursementValueCode,
          overawardValue: savedManualOveraward.overawardValue,
        },
        {
          dateAdded: savedReassessmentOveraward.addedDate.toISOString(),
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
