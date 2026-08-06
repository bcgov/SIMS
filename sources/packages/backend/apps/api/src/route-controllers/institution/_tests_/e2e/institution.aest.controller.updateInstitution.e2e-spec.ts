import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitution,
} from "@sims/test-utils";
import { InstitutionClassification } from "@sims/sims-db";
import {
  CANADA_COUNTRY_CODE,
  BC_PROVINCE_CODE,
  UNITED_STATES_COUNTRY_CODE,
} from "@sims/sims-db/constant";
import { ONTARIO_PROVINCE_CODE } from "@sims/test-utils/constants";
import { getInstitutionProfilePayload } from "./institution.utils";
import { InstitutionService } from "../../../../../src/services";

describe("InstitutionAESTController(e2e)-updateInstitution", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let institutionService: InstitutionService;
  const OUT_OF_PROVINCE_PUBLIC_INSTITUTION_ID = 3;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    institutionService = (module as TestingModule).get(InstitutionService);
  });

  it("Should update institution when valid update payload is provided.", async () => {
    // Arrange
    const institution = await db.institution.save(
      createFakeInstitution(undefined, {
        initialValues: {
          legalOperatingName: "Institution legal operating name",
        },
      }),
    );
    const payload = getInstitutionProfilePayload();
    // Set country and province to be out of province public institution.
    payload.country = CANADA_COUNTRY_CODE;
    payload.province = ONTARIO_PROVINCE_CODE;
    payload.classification = InstitutionClassification.Public;
    const endpoint = `/aest/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Warms up the institution type cache with the original institution type.
    const originalInstitutionType =
      await institutionService.getInstitutionTypeById(institution.id);
    expect(originalInstitutionType.institutionType.id).not.toBe(
      OUT_OF_PROVINCE_PUBLIC_INSTITUTION_ID,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // The cached institution type must reflect the new type right away instead
    // of continuing to report the previous one until the cache expires.
    const updatedInstitutionType =
      await institutionService.getInstitutionTypeById(institution.id);
    expect(updatedInstitutionType.institutionType.id).toBe(
      OUT_OF_PROVINCE_PUBLIC_INSTITUTION_ID,
    );

    const savedInstitution = await db.institution.findOne({
      select: {
        id: true,
        establishedDate: true,
        institutionAddress: {
          mailingAddress: {
            addressLine1: true,
            addressLine2: true,
            city: true,
            country: true,
            postalCode: true,
            provinceState: true,
            selectedCountry: true,
          },
        },
        institutionPrimaryContact: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
        institutionType: {
          id: true,
        },
        legalOperatingName: true,
        operatingName: true,
        otherRegulatingBody: true,
        primaryEmail: true,
        primaryPhone: true,
        regulatingBody: true,
        website: true,
        country: true,
        province: true,
        classification: true,
        organizationStatus: true,
        medicalSchoolStatus: true,
      },
      where: { id: institution.id },
      relations: { institutionType: true },
    });
    expect(savedInstitution).toEqual({
      id: institution.id,
      establishedDate: payload.establishedDate,
      institutionAddress: {
        mailingAddress: {
          addressLine1: payload.mailingAddress.addressLine1,
          addressLine2: payload.mailingAddress.addressLine2,
          city: payload.mailingAddress.city,
          country: payload.mailingAddress.country,
          postalCode: payload.mailingAddress.postalCode,
          provinceState: payload.mailingAddress.provinceState,
          selectedCountry: payload.mailingAddress.selectedCountry,
        },
      },
      institutionPrimaryContact: {
        email: payload.primaryContactEmail,
        firstName: payload.primaryContactFirstName,
        lastName: payload.primaryContactLastName,
        phone: payload.primaryContactPhone,
      },
      institutionType: {
        id: OUT_OF_PROVINCE_PUBLIC_INSTITUTION_ID,
      },
      legalOperatingName: institution.legalOperatingName,
      operatingName: payload.operatingName,
      otherRegulatingBody: null,
      primaryEmail: payload.primaryEmail,
      primaryPhone: payload.primaryPhone,
      regulatingBody: payload.regulatingBody,
      website: payload.website,
      country: payload.country,
      province: payload.province,
      classification: payload.classification,
      organizationStatus: payload.organizationStatus,
      medicalSchoolStatus: payload.medicalSchoolStatus,
    });
  });

  it("Should throw unprocessable entity error when invalid country is provided in the update payload.", async () => {
    // Arrange
    const institution = await db.institution.save(
      createFakeInstitution(undefined, {
        initialValues: {
          legalOperatingName: "Institution legal operating name",
        },
      }),
    );
    const payload = getInstitutionProfilePayload();
    // Set country with invalid value.
    payload.country = "ZZ";
    payload.province = undefined;
    const endpoint = `/aest/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Invalid value(s) found for: Country.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw unprocessable entity error when invalid province is provided in the update payload.", async () => {
    // Arrange
    const institution = await db.institution.save(
      createFakeInstitution(undefined, {
        initialValues: {
          legalOperatingName: "Institution legal operating name",
        },
      }),
    );
    const payload = getInstitutionProfilePayload();
    // Set province with invalid value.
    payload.country = CANADA_COUNTRY_CODE;
    payload.province = "QQ";
    const endpoint = `/aest/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Invalid value(s) found for: Province.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw bad request error when province is provided for a country which is not Canada.", async () => {
    // Arrange
    const institution = await db.institution.save(
      createFakeInstitution(undefined, {
        initialValues: {
          legalOperatingName: "Institution legal operating name",
        },
      }),
    );
    const payload = getInstitutionProfilePayload();
    // Set country with invalid value.
    payload.country = UNITED_STATES_COUNTRY_CODE;
    payload.province = BC_PROVINCE_CODE;
    const endpoint = `/aest/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["province input is not allowed."],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
