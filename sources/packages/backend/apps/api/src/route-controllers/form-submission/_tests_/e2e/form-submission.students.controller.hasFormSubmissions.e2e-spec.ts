import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  saveFakeFormSubmissionFromInputTestData,
} from "@sims/test-utils";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
} from "./form-submission-utils";
import { FormCategory, FormSubmissionStatus } from "@sims/sims-db";

describe("FormSubmissionStudentsController(e2e)-hasFormSubmissions", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let formConfigs: DynamicConfigurationTestData;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    formConfigs = await createFakeFormConfigurations(app, db);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it(`Should return true when the application has form submissions.`, async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
          decisions: [],
        },
      ],
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, application.student.user);
    const endpoint = getEndpoint(application.id);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ hasFormSubmissions: true });
  });

  it("Should return false when the application has no form submissions.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, application.student.user);
    const endpoint = getEndpoint(application.id);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ hasFormSubmissions: false });
  });

  it("Should throw a bad request exception when no applicationId is provided.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, application.student.user);
    const endpoint = getEndpoint();

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "applicationId must be a positive number",
          "applicationId should not be empty",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Returns the endpoint URL for checking if a student has form submissions.
 * @param applicationId The ID of the application to check.
 * @returns The endpoint URL as a string.
 */
function getEndpoint(applicationId?: number): string {
  let url = `/students/form-submission/exists`;
  if (applicationId) {
    url += `?applicationId=${applicationId}`;
  }
  return url;
}
