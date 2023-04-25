import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeDisbursementOveraward,
  createFakeStudentAssessment,
  createFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import {
  Application,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  IdentityProviders,
  StudentAssessment,
} from "@sims/sims-db";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getProviderInstanceForModule,
  getStudentToken,
} from "../../../../testHelpers";
import { UserService } from "../../../../services";
import { TestingModule } from "@nestjs/testing";
import { AuthModule } from "../../../../auth/auth.module";

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

    // Mock user service for auth module
    const userService = await getProviderInstanceForModule<UserService>(
      appModule,
      AuthModule,
      UserService,
    );
    userService.getUserLoginInfo = jest.fn(() =>
      Promise.resolve({
        id: student.user.id,
        isActive: true,
        studentId: student.id,
        identityProviderType: IdentityProviders.BCSC,
      }),
    );

    // Get any student user token
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Prepare the student assessment to create overaward.
    const application = await applicationRepo.save(
      createFakeApplication({
        student,
      }),
    );
    const studentAssessment = await assessmentRepo.save(
      createFakeStudentAssessment({ auditUser: student.user, application }),
    );
    application.currentAssessment = studentAssessment;
    await applicationRepo.save(application);
    // Create an overaward.
    let reassessmentOveraward = createFakeDisbursementOveraward({ student });
    reassessmentOveraward.studentAssessment = studentAssessment;
    reassessmentOveraward.disbursementValueCode = "CSLP";
    reassessmentOveraward.overawardValue = 500;
    reassessmentOveraward.originType =
      DisbursementOverawardOriginType.ReassessmentOveraward;
    reassessmentOveraward.addedDate = new Date();
    reassessmentOveraward = await disbursementOverawardRepo.save(
      reassessmentOveraward,
    );
    // Create a manual overaward deduction.
    let manualOveraward = createFakeDisbursementOveraward({ student });
    manualOveraward.disbursementValueCode = "CSLP";
    manualOveraward.overawardValue = -123;
    manualOveraward.originType = DisbursementOverawardOriginType.ManualRecord;
    manualOveraward.addedDate = new Date();
    manualOveraward = await disbursementOverawardRepo.save(manualOveraward);

    const endpoint = "/students/overaward";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          dateAdded: manualOveraward.addedDate.toISOString(),
          createdAt: manualOveraward.createdAt.toISOString(),
          overawardOrigin: manualOveraward.originType,
          awardValueCode: manualOveraward.disbursementValueCode,
          overawardValue: manualOveraward.overawardValue,
        },
        {
          dateAdded: reassessmentOveraward.addedDate.toISOString(),
          createdAt: reassessmentOveraward.createdAt.toISOString(),
          overawardOrigin: reassessmentOveraward.originType,
          awardValueCode: reassessmentOveraward.disbursementValueCode,
          overawardValue: reassessmentOveraward.overawardValue,
          applicationNumber: application.applicationNumber,
          assessmentTriggerType: studentAssessment.triggerType,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
