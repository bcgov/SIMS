import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentByFakeStudentUserType,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import { KnownSupplementaryDataKey } from "../../../../services";
import {
  createE2EDataSources,
  createFakeSupportingUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing/testing-module";
import { SupportingUserType } from "@sims/sims-db";

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

  beforeEach(() => {
    resetMockJWTUserInfo(appModule);
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

  it(`Should throw a not found exception when the application is not associated with the student requesting the supplementary data for ${KnownSupplementaryDataKey.ProgramYear}.`, async () => {
    const application = await saveFakeApplication(db.dataSource);

    // Arrange
    const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.ProgramYear}&applicationId=${application.id}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Authenticated student is different from the student associated with the application.
    const student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      db.dataSource,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: `Supplementary data '${KnownSupplementaryDataKey.ProgramYear}' not found. Student ID ${student.id}, application ID ${application.id}.`,
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it(`Should get supplementary data for ${KnownSupplementaryDataKey.Parents} when the application has supporting users parents.`, async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    // Create supporting users.
    const [parent1, parent2] = Array.from({ length: 2 }, () =>
      createFakeSupportingUser(
        { application },
        { initialValues: { supportingUserType: SupportingUserType.Parent } },
      ),
    );
    await db.supportingUser.save([parent1, parent2]);

    const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.Parents}&applicationId=${application.id}`;
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
      .expect({
        formData: {
          parents: [
            { id: parent1.id, fullName: parent1.fullName },
            { id: parent2.id, fullName: parent2.fullName },
          ],
        },
      });
  });

  it(`Should throw a not found exception when requesting supplementary data for ${KnownSupplementaryDataKey.Parents} for a application that has no supporting users.`, async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const endpoint = `/students/form-submission/supplementary-data?dataKeys=${KnownSupplementaryDataKey.Parents}&applicationId=${application.id}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: `Supplementary data '${KnownSupplementaryDataKey.Parents}' not found. Student ID ${application.student.id}, application ID ${application.id}.`,
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
