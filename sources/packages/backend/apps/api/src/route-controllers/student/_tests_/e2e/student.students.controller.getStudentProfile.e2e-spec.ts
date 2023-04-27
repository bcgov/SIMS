import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import { saveFakeStudent } from "@sims/test-utils";
import { determinePDStatus, getUserFullName } from "../../../../utilities";
import { TestingModule } from "@nestjs/testing";

describe("StudentInstitutionsController(e2e)-searchStudents", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  const endpoint = "/students/student";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    appModule = module;
  });

  it("Should get the student profile when a student account exists.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);

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
        pdStatus: determinePDStatus(student),
        validSin: student.sinValidation.isValidSIN,
        sin: student.sinValidation.sin,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
