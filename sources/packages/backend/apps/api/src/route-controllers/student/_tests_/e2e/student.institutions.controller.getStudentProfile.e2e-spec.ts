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
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeStudent,
  saveFakeApplication,
} from "@sims/test-utils";
import { Institution, InstitutionLocation } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";
import { getISODateOnlyString } from "@sims/utilities";
import { saveStudentApplicationForCollegeC } from "./student.institutions.utils";

describe("StudentInstitutionsController(e2e)-getStudentProfile", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should get the student profile when student has at least one application submitted for the institution.", async () => {
    // Arrange

    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);
    await saveFakeApplication(appDataSource, {
      institutionLocation: collegeFLocation,
      student,
    });
    const endpoint = `/institutions/student/${student.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
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
        disabilityStatus: student.disabilityStatus,
        validSin: student.sinValidation.isValidSIN,
        sin: student.sinValidation.sin,
      });
  });

  it("Should throw forbidden error when the institution type is not BC Public.", async () => {
    // Arrange
    // Student submitting an application to College C.
    const { student, collegeCApplication } =
      await saveStudentApplicationForCollegeC(appDataSource);

    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCApplication.location,
    );

    // College C is not a BC Public institution.
    const collegeCInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    const endpoint = `/institutions/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(collegeCInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should throw forbidden error when student does not have at least one application submitted for the institution.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);

    // College F is a BC Public institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
