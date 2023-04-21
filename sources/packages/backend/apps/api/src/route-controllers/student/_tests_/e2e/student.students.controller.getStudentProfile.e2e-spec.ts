import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  MockedMethods,
} from "../../../../testHelpers";
import { saveFakeStudent } from "@sims/test-utils";
import { determinePDStatus, getUserFullName } from "../../../../utilities";
import { mockStudentUserAndGetUserToken } from "../../../../testHelpers/user/student-user-mock";

describe("StudentInstitutionsController(e2e)-searchStudents", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appMockedMethods: MockedMethods;
  const endpoint = "/students/student";

  beforeAll(async () => {
    const { nestApplication, dataSource, mockedMethods } =
      await createTestingAppModule({ mockGetUserLoginInfo: true });
    app = nestApplication;
    appDataSource = dataSource;
    appMockedMethods = mockedMethods;
  });

  it("Should get the student profile when student requests.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const studentToken = await mockStudentUserAndGetUserToken(
      student,
      appMockedMethods,
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
