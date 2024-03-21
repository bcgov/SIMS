import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import * as faker from "faker";
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
import { SearchInstitutionAPIOutDTO } from "../../models/institution.dto";

describe("InstitutionAESTController(e2e)-searchInstitutions", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const FAKE_INSTITUTION_NAME = "Search E2E Test institution name";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return institution(s) when searched by legal name.", async () => {
    // Arrange
    const institution = createFakeInstitution();
    institution.operatingName = FAKE_INSTITUTION_NAME;
    // Using uuid to keep the legal operating name unique for institution.
    institution.legalOperatingName = faker.datatype.uuid();
    await db.institution.save(institution);
    // Modifying the text to uppercase to validate non case sensitive search.
    const legalNameSearchText = institution.legalOperatingName.toUpperCase();
    const mailingAddress = institution.institutionAddress.mailingAddress;
    const expectedSearchResult: SearchInstitutionAPIOutDTO[] = [
      {
        id: institution.id,
        legalName: institution.legalOperatingName,
        operatingName: institution.operatingName,
        address: {
          addressLine1: mailingAddress.addressLine1,
          addressLine2: mailingAddress.addressLine2,
          city: mailingAddress.city,
          provinceState: mailingAddress.provinceState,
          country: mailingAddress.country,
          postalCode: mailingAddress.postalCode,
        },
      },
    ];

    const endpoint = `/aest/institution/search?legalName=${legalNameSearchText}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(expectedSearchResult);
  });

  it("Should return institutions when searched by legal name and operating name.", async () => {
    // Arrange
    const institution = createFakeInstitution();
    institution.operatingName = FAKE_INSTITUTION_NAME;
    // Using uuid to keep the legal operating name unique for institution.
    institution.legalOperatingName = faker.datatype.uuid();
    await db.institution.save(institution);
    const operatingNameSearchText = "Search E2E Test institution";
    const legalNameSearchText = institution.legalOperatingName;
    const mailingAddress = institution.institutionAddress.mailingAddress;
    const expectedSearchResult: SearchInstitutionAPIOutDTO[] = [
      {
        id: institution.id,
        legalName: institution.legalOperatingName,
        operatingName: institution.operatingName,
        address: {
          addressLine1: mailingAddress.addressLine1,
          addressLine2: mailingAddress.addressLine2,
          city: mailingAddress.city,
          provinceState: mailingAddress.provinceState,
          country: mailingAddress.country,
          postalCode: mailingAddress.postalCode,
        },
      },
    ];

    const endpoint = `/aest/institution/search?legalName=${legalNameSearchText}&operatingName=${operatingNameSearchText}`;
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(expectedSearchResult);
  });

  it("Should return empty result when search criteria does not return any institution.", async () => {
    // Arrange
    const searchText = "Institution that does not exist";
    const endpoint = `/aest/institution/search?operatingName=${searchText}`;
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it("Should throw bad request error when no search criteria exist.", async () => {
    // Arrange
    const endpoint = "/aest/institution/search";
    const token = await getAESTToken(AESTGroups.MOFOperations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "legalName must be shorter than or equal to 250 characters",
          "legalName should not be empty",
          "operatingName must be shorter than or equal to 250 characters",
          "operatingName should not be empty",
        ],
        error: "Bad Request",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
