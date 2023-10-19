import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
import { InstitutionDetailAPIOutDTO } from "../../models/institution.dto";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  INSTITUTION_TYPE_BC_PUBLIC,
} from "@sims/sims-db/constant";
import { getISODateOnlyString } from "@sims/utilities";

describe("InstitutionAESTController(e2e)-getInstitutionDetailById", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return institution details when an institution with given institution id exist.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    const mailingAddress = institution.institutionAddress.mailingAddress;
    const institutionType = await db.institutionType.findOne({
      select: { id: true, name: true },
      where: { id: institution.institutionType.id },
    });
    const isBCPrivate =
      INSTITUTION_TYPE_BC_PRIVATE === institution.institutionType.id;
    const isBCPublic =
      INSTITUTION_TYPE_BC_PUBLIC === institution.institutionType.id;
    const expectedInstitutionDetails: InstitutionDetailAPIOutDTO = {
      legalOperatingName: institution.legalOperatingName,
      operatingName: institution.operatingName,
      primaryPhone: institution.primaryPhone,
      primaryEmail: institution.primaryEmail,
      website: institution.website,
      regulatingBody: institution.regulatingBody,
      otherRegulatingBody: institution.otherRegulatingBody ?? null,
      institutionType: institutionType.id,
      institutionTypeName: institutionType.name,
      establishedDate: getISODateOnlyString(institution.establishedDate),
      primaryContactEmail: institution.institutionPrimaryContact.email,
      primaryContactFirstName: institution.institutionPrimaryContact.firstName,
      primaryContactLastName: institution.institutionPrimaryContact.lastName,
      primaryContactPhone: institution.institutionPrimaryContact.phone,
      mailingAddress: {
        addressLine1: mailingAddress.addressLine1,
        addressLine2: mailingAddress.addressLine2,
        provinceState: mailingAddress.provinceState,
        country: mailingAddress.country,
        city: mailingAddress.city,
        postalCode: mailingAddress.postalCode,
        canadaPostalCode: mailingAddress.postalCode,
        selectedCountry: mailingAddress.selectedCountry,
      },
      isBCPrivate,
      isBCPublic,
      hasBusinessGuid: !!institution.businessGuid,
    };
    const endpoint = `/aest/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(expectedInstitutionDetails);
  });

  it("Should throw not found error when an institution with given institution id dos not exist.", async () => {
    // Arrange
    const endpoint = "/aest/institution/9999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Institution not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
