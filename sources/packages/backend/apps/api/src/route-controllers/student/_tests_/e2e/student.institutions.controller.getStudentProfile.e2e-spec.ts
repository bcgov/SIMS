import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { Institution, InstitutionLocation } from "@sims/sims-db";
import { determinePDStatus, getUserFullName } from "../../../../utilities";
import { getISODateOnlyString } from "@sims/utilities";

describe("StudentInstitutionsController(e2e)-getStudentProfile", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCLocation = createFakeInstitutionLocation(collegeC);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
  });

  it("Should get the student profile when student has at least one application submitted for the institution.", async () => {
    // Arrange

    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);
    await saveFakeApplication(appDataSource, {
      institutionLocation: collegeCLocation,
      student,
    });
    const endpoint = `/institutions/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect({
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        fullName: getUserFullName(student.user),
        email: student.user.email,
        gender: student.gender,
        dateOfBirth: getISODateOnlyString(student.birthDate),
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
  // TODO: When the authorization is implemented for institution student search,
  // validate the scenario when a student exist but does not have any submitted applications
  // for the institution.
  it("Should get not found error when student is not found.", async () => {
    // Arrange
    const endpoint = "/institutions/student/999999";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Student not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
