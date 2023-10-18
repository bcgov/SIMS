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
import { SearchInstitutionAPIOutDTO } from "../../models/institution.dto";

describe("InstitutionAESTController(e2e)-searchInstitutions", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const FAKE_INSTITUTION_NAME = "Search E2E Test institution name";
  const FAKE_INSTITUTION_LEGAL_NAME = "Search E2E Test institution legal name";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return institutions when searched by legal name and operating name.", async () => {
    // Arrange
    const institution = createFakeInstitution();
    institution.operatingName = FAKE_INSTITUTION_NAME;
    institution.legalOperatingName = FAKE_INSTITUTION_LEGAL_NAME;
    await db.institution.save(institution);
    const legalNameSearchText = "Search E2E Test institution legal";
    console.log(institution);
    const expectedSearchResult: SearchInstitutionAPIOutDTO[] = [
      {
        id: institution.id,
        legalName: institution.legalOperatingName,
        operatingName: institution.operatingName,
        address: institution.institutionAddress.mailingAddress,
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

  afterAll(async () => {
    await app?.close();
  });
});
