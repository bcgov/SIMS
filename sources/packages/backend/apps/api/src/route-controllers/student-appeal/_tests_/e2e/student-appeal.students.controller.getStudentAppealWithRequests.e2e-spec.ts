import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
  saveFakeAppealWithAppealRequests,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { StudentAppealStatus } from "@sims/sims-db";

describe("StudentAppealStudentsController(e2e)-getStudentAppealWithRequests", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it("Should get student appeal with request details when the student has an appeal.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const submittedData = { fakeData: "fakeData" };
    const studentAppeal = await saveFakeAppealWithAppealRequests(db, student, [
      { appealStatus: StudentAppealStatus.Approved, submittedData },
    ]);
    const [studentAppealRequest] = studentAppeal.appealRequests;
    await mockJWTUserInfo(appModule, student.user);
    const endpoint = `/students/appeal/${studentAppeal.id}/requests`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: studentAppeal.id,
        submittedDate: studentAppeal.submittedDate.toISOString(),
        status: StudentAppealStatus.Approved,
        appealRequests: [
          {
            id: studentAppealRequest.id,
            submittedData,
            submittedFormName: studentAppealRequest.submittedFormName,
            appealStatus: StudentAppealStatus.Approved,
          },
        ],
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
