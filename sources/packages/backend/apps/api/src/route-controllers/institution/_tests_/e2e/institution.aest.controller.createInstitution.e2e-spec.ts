import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";

describe("InstitutionAESTController(e2e)-createInstitution", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should create institution when validate is passed.", async () => {
    // Arrange
    const payload = {
      legalOperatingName: "Create Institution legal operating name",
      operatingName: "Create Institution operating name",
      institutionType: 1,
      regulatingBody: "icbc",
      establishedDate: "2023-06-01",
      primaryEmail: "test@test.ca",
      primaryPhone: "7785367878",
      website: "http://www.test.ca",
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
      mode: "create",
      clientType: "aest",
    };
    const endpoint = "/aest/institution";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    let institutionId;
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
      where: { id: institutionId },
    });
    expect(savedInstitution).toEqual(
      expect.objectContaining({
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
        institutionTypeId: payload.institutionType,
        legalOperatingName: payload.legalOperatingName,
        operatingName: payload.operatingName,
        otherRegulatingBody: null,
        primaryEmail: payload.primaryEmail,
        primaryPhone: payload.primaryPhone,
        regulatingBody: payload.regulatingBody,
        website: payload.website,
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
