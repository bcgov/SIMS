import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
} from "../../../../testHelpers";
import { KnownSupplementaryDataKey } from "../../../../services";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing/testing-module";

describe("FormSubmissionStudentsController(e2e)-getSupplementaryData", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  it(`Should get supplementary data for ${KnownSupplementaryDataKey.ProgramYear} when the application exists.`, async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ProgramYear}&applicationId=${application.id}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ formData: { programYear: "2022-2023" } });
  });

  it("Should throw a not found exception when the application is not associated with the student requesting the supplementary data for ProgramYear.", async () => {
    const application = await saveFakeApplication(db.dataSource);

    // Arrange
    const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ProgramYear}&applicationId=${application.id}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Application ID ${application.id} not found or program year data is not available.`,
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
