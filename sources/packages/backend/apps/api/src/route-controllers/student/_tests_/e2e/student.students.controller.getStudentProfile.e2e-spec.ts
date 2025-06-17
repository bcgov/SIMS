import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { getUserFullName } from "../../../../utilities";
import { TestingModule } from "@nestjs/testing";
import { addDays } from "@sims/utilities";

describe("StudentInstitutionsController(e2e)-getStudentProfile", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  const endpoint = "/students/student";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  it("Should get the student profile when a student account exists.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);

    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        fullName: getUserFullName(student.user),
        email: student.user.email,
        gender: student.gender,
        dateOfBirth: student.birthDate,
        contact: {
          address: {
            addressLine1: student.contactInfo.address.addressLine1,
            provinceState: student.contactInfo.address.provinceState,
            country: student.contactInfo.address.country,
            city: student.contactInfo.address.city,
            postalCode: student.contactInfo.address.postalCode,
            canadaPostalCode: student.contactInfo.address.postalCode,
            selectedCountry: student.contactInfo.address.selectedCountry,
          },
          phone: student.contactInfo.phone,
        },
        disabilityStatus: student.disabilityStatus,
        validSin: student.sinValidation.isValidSIN,
        hasFulltimeAccess: false,
      });
  });

  it("Should get the student profile with the hasFulltimeAccess as true user when the student was added to the beta users table.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Register the student as a beta user for full-time.
    await db.betaUsersAuthorizations.save({
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      enabledFrom: new Date(),
    });

    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);

    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((response) => expect(response.body.hasFulltimeAccess).toBe(true));
  });

  it("Should get the student profile with hasFulltimeAccess as false when the student was added to the beta users table with a future date.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Register the student as a beta user for full-time.
    await db.betaUsersAuthorizations.save({
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      enabledFrom: addDays(1),
    });

    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);

    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((response) =>
        expect(response.body.hasFulltimeAccess).toBe(false),
      );
  });

  afterAll(async () => {
    await app?.close();
  });
});
