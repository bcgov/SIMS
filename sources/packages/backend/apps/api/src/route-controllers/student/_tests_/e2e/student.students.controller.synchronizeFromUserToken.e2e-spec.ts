import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { MISSING_USER_INFO } from "../../../../constants";

describe("StudentStudentsController(e2e)-synchronizeFromUserToken", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  const endpoint = "/students/student/sync";

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
  });

  it("Should return a bad request error when the BCSC authentication token is missing the mandatory profile information.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Mock the user service to return the saved student.
    await mockUserLoginInfo(appModule, student);
    // Mocked BCSC token without a verified email address.
    await mockJWTToken(appModule, (jwtPayload) => {
      jwtPayload.email = undefined;
      jwtPayload.lastName = "Doe";
      jwtPayload.birthdate = "2000-01-01";
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message:
          "Some mandatory profile information (e-mail, last name, or date of birth) was not " +
          "provided by the identity provider. Please ensure your BC Services Card identity " +
          "information, including a verified e-mail address, is complete and try again.",
        errorType: MISSING_USER_INFO,
      });
  });

  it("Should synchronize the student and user data when the BCSC authentication token has all the mandatory profile information.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: { birthDate: "1990-01-01" },
    });
    // Mock the user service to return the saved student.
    await mockUserLoginInfo(appModule, student);
    // Mocked BCSC token with updated profile information to be synchronized.
    const updatedEmail = `updated.${student.user.email}`;
    const updatedLastName = `Updated${student.user.lastName}`;
    const updatedGivenNames = `Updated${student.user.firstName}`;
    const updatedBirthdate = "1995-05-05";
    await mockJWTToken(appModule, (jwtPayload) => {
      jwtPayload.email = updatedEmail;
      jwtPayload.lastName = updatedLastName;
      jwtPayload.givenNames = updatedGivenNames;
      jwtPayload.birthdate = updatedBirthdate;
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert that the student and user data were updated with the token information.
    const updatedStudent = await db.student.findOne({
      select: {
        id: true,
        birthDate: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      relations: { user: true },
      where: { id: student.id },
      loadEagerRelations: false,
    });
    expect(updatedStudent).toEqual({
      id: student.id,
      birthDate: updatedBirthdate,
      user: {
        id: student.user.id,
        firstName: updatedGivenNames,
        lastName: updatedLastName,
        email: updatedEmail,
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
