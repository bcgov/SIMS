import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";
import {
  CANADA_COUNTRY_CODE,
  BC_PROVINCE_CODE,
  INSTITUTION_TYPE_BC_PUBLIC,
} from "@sims/sims-db/constant";

describe("InstitutionAESTController(e2e)-createInstitution", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should create institution when valid data is passed.", async () => {
    // Arrange
    const payload = {
      legalOperatingName: "Create Institution legal operating name",
      operatingName: "Create Institution operating name",
      regulatingBody: "icbc",
      establishedDate: "2023-06-01",
      primaryEmail: "test@test.ca",
      primaryPhone: "7785367878",
      website: "https://www.test.ca",
      country: CANADA_COUNTRY_CODE,
      province: BC_PROVINCE_CODE,
      classification: InstitutionClassification.Public,
      organizationStatus: InstitutionOrganizationStatus.Profit,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
      primaryContactFirstName: "Primary",
      primaryContactLastName: "Contact",
      primaryContactEmail: "test@test.ca",
      primaryContactPhone: "7785367878",
      mailingAddress: {
        addressLine1: "123 Gorge Rd E",
        addressLine2: "",
        selectedCountry: "Canada",
        country: "Canada",
        city: "Victoria",
        postalCode: "V1V1V1",
        provinceState: "BC",
        canadaPostalCode: "V1V1V1",
      },
    };
    const endpoint = "/aest/institution";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    let institutionId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        institutionId = response.body.id;
      });
    const savedInstitution = await db.institution.findOne({
      select: {
        id: true,
        businessGuid: true,
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
      where: { id: institutionId },
      relations: { institutionType: true },
    });
    expect(savedInstitution).toEqual({
      id: institutionId,
      businessGuid: null,
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
        id: INSTITUTION_TYPE_BC_PUBLIC,
      },
      legalOperatingName: payload.legalOperatingName,
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

  afterAll(async () => {
    await app?.close();
  });
});
