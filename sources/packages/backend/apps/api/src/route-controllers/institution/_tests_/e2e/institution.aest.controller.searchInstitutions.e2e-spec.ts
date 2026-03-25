import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { faker } from "@faker-js/faker";
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
  createFakeInstitutionLocation,
} from "@sims/test-utils";
import { SearchInstitutionAPIOutDTO } from "../../models/institution.dto";
import { InstitutionClassification } from "@sims/sims-db";

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
    const institution = createFakeInstitution(undefined, {
      initialValues: { legalOperatingName: faker.string.uuid() },
    });
    institution.operatingName = FAKE_INSTITUTION_NAME;
    await db.institution.save(institution);
    // Modifying the text to uppercase to validate non case sensitive search.
    const legalNameSearchText = institution.legalOperatingName.toUpperCase();
    const expectedSearchResult: SearchInstitutionAPIOutDTO[] = [
      {
        id: institution.id,
        legalName: institution.legalOperatingName,
        operatingName: institution.operatingName,
        country: "Canada",
        classification: InstitutionClassification.Private,
      },
    ];

    const endpoint = `/aest/institution/search?legalName=${legalNameSearchText}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body).toEqual(expectedSearchResult);
      });
  });

  it("Should return institutions when searched by legal name and operating name.", async () => {
    // Arrange
    const institution = createFakeInstitution(undefined, {
      initialValues: { legalOperatingName: faker.string.uuid() },
    });
    institution.operatingName = FAKE_INSTITUTION_NAME;
    await db.institution.save(institution);
    const operatingNameSearchText = "Search E2E Test institution";
    const legalNameSearchText = institution.legalOperatingName;
    const expectedSearchResult: SearchInstitutionAPIOutDTO[] = [
      {
        id: institution.id,
        legalName: institution.legalOperatingName,
        operatingName: institution.operatingName,
        country: "Canada",
        classification: InstitutionClassification.Private,
      },
    ];

    const endpoint = `/aest/institution/search?legalName=${legalNameSearchText}&operatingName=${operatingNameSearchText}`;
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body).toEqual(expectedSearchResult);
      });
  });

  it("Should return institution when searched by institution location code.", async () => {
    // Arrange
    const institution = createFakeInstitution(undefined, {
      initialValues: { legalOperatingName: faker.string.uuid() },
    });
    await db.institution.save(institution);
    const institutionLocation = createFakeInstitutionLocation({ institution });
    await db.institutionLocation.save(institutionLocation);
    // Modifying the text to lowercase to validate non case sensitive search.
    const locationCodeSearchText =
      institutionLocation.institutionCode.toLowerCase();
    const expectedSearchResult: SearchInstitutionAPIOutDTO[] = [
      {
        id: institution.id,
        legalName: institution.legalOperatingName,
        operatingName: institution.operatingName,
        country: "Canada",
        classification: InstitutionClassification.Private,
      },
    ];

    const endpoint = `/aest/institution/search?institutionLocationCode=${locationCodeSearchText}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body).toEqual(expectedSearchResult);
      });
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
      .expect(({ body }) => {
        expect(body).toEqual([]);
      });
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
      .expect(({ body }) => {
        expect(body).toEqual({
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
  });

  afterAll(async () => {
    await app?.close();
  });
});
