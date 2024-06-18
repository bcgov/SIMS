import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";

describe("InstitutionAESTController(e2e)-getInstitutionNameOptions", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return an array of institutions when there are institutions in the database.", async () => {
    // Arrange
    const institutions = await db.institution.find({
      select: { id: true, operatingName: true },
      order: { operatingName: "asc" },
    });

    const responseData = institutions.map((institution) => ({
      id: institution.id,
      description: institution.operatingName,
    }));

    const endpoint = "/aest/institution/name/options-list";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(responseData);
  });

  afterAll(async () => {
    await app?.close();
  });
});
