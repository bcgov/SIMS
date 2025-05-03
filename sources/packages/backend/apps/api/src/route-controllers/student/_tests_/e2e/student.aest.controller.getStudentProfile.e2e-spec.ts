import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  AESTGroups,
  getAESTToken,
} from "../../../../testHelpers";
import {
  createFakeUser,
  saveFakeSFASIndividual,
  saveFakeStudent,
} from "@sims/test-utils";
import { getUserFullName } from "../../../../utilities";
import { getISODateOnlyString } from "@sims/utilities";
import { IdentityProviders } from "@sims/sims-db";

describe("StudentAESTController(e2e)-getStudentProfile", () => {
  let app: INestApplication;
  let db: DataSource;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = dataSource;
  });

  it("Should get the student profile when the student exists and no legacy profile is associated.", async () => {
    // Arrange
    const user = createFakeUser();
    user.identityProviderType = IdentityProviders.BCSC;
    const student = await saveFakeStudent(db, { user });
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
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
        hasRestriction: false,
        identityProviderType: IdentityProviders.BCSC,
        sin: student.sinValidation.sin,
      });
  });

  it("Should get the student profile when the student exists and legacy profile is associated.", async () => {
    // Arrange
    const user = createFakeUser();
    user.identityProviderType = IdentityProviders.BCSC;
    const student = await saveFakeStudent(db, { user });
    const legacyProfile = await saveFakeSFASIndividual(db, {
      initialValues: { student },
    });
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
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
        hasRestriction: false,
        identityProviderType: IdentityProviders.BCSC,
        sin: student.sinValidation.sin,
        legacyProfile: {
          id: legacyProfile.id,
          firstName: legacyProfile.firstName,
          lastName: legacyProfile.lastName,
          dateOfBirth: legacyProfile.birthDate,
          sin: legacyProfile.sin,
        },
      });
  });

  it("Should throw a NotFoundException when the student was not found.", async () => {
    // Arrange
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/999999`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Student not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
