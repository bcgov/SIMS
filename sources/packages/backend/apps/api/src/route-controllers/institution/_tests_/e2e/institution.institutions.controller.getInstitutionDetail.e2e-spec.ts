import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
  mockInstitutionUserAuthorization,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitution,
} from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
  InstitutionOrganizationStatus,
  InstitutionUserTypes,
} from "@sims/sims-db";
import {
  CANADA_COUNTRY_CODE,
  BC_PROVINCE_CODE,
  INSTITUTION_TYPE_BC_PUBLIC,
} from "@sims/sims-db/constant";
import { getISODateOnlyString } from "@sims/utilities";
import { InstitutionUserAuthorizations } from "../../../../services";
import { TestingModule } from "@nestjs/testing";

describe("InstitutionInstitutionsController(e2e)-getInstitutionDetail", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  const endpoint = "/institutions/institution";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  it("Should return details of the institution associated to the institution user from the user token when the institution is already set up.", async () => {
    // Arrange
    const institutionType = await db.institutionType.findOne({
      select: { id: true, name: true },
      where: { id: INSTITUTION_TYPE_BC_PUBLIC },
    });
    const institution = await db.institution.save(
      createFakeInstitution(
        { institutionType },
        {
          initialValues: {
            country: CANADA_COUNTRY_CODE,
            province: BC_PROVINCE_CODE,
            classification: InstitutionClassification.Public,
            organizationStatus: InstitutionOrganizationStatus.NotForProfit,
            medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
          },
        },
      ),
    );
    const mailingAddress = institution.institutionAddress.mailingAddress;
    const expectedInstitutionDetails = {
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
      isBCPrivate: false,
      isBCPublic: true,
      hasBusinessGuid: true,
      country: CANADA_COUNTRY_CODE,
      province: BC_PROVINCE_CODE,
      classification: InstitutionClassification.Public,
      organizationStatus: InstitutionOrganizationStatus.NotForProfit,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
    };
    // Mock institution user authorization so that the user token will return the fake institution id and mocked roles.
    await mockInstitutionUserAuthorization(
      appModule,
      new InstitutionUserAuthorizations(institution.id, [
        {
          locationId: null,
          userRole: null,
          userType: InstitutionUserTypes.admin,
        },
      ]),
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(expectedInstitutionDetails);
  });

  afterAll(async () => {
    await app?.close();
  });
});
