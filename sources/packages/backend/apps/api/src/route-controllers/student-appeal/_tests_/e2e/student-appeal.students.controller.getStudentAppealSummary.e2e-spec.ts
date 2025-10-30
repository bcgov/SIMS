import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { MoreThanOrEqual } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { ProgramYear, StudentAppealStatus } from "@sims/sims-db";
import { PROGRAM_YEAR_2025_26_START_DATE } from "../../../../services/student-appeal/constants";

describe("StudentAppealStudentsController(e2e)-getStudentAppealSummary", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let eligibleProgramYear: ProgramYear;
  const endpoint = "/students/appeal";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    eligibleProgramYear = await db.programYear.findOne({
      where: { startDate: MoreThanOrEqual(PROGRAM_YEAR_2025_26_START_DATE) },
    });
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it("Should get student appeal summary when the student has one or more appeals.", async () => {
    // Arrange
    console.log(eligibleProgramYear);
    const student = await saveFakeStudent(db.dataSource);
    // Create an approved student appeal for the student.
    const studentAppealRequest = createFakeStudentAppealRequest(undefined, {
      initialValues: {
        appealStatus: StudentAppealStatus.Approved,
        assessedDate: new Date(),
      },
    });
    const studentAppeal = createFakeStudentAppeal({
      student,
      appealRequests: [studentAppealRequest],
    });
    await db.studentAppeal.save(studentAppeal);
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        appeals: [
          {
            id: studentAppeal.id,
            appealStatus: StudentAppealStatus.Approved,
            appealRequestNames: [studentAppealRequest.submittedFormName],
            assessedDate: studentAppealRequest.assessedDate.toISOString(),
          },
        ],
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
