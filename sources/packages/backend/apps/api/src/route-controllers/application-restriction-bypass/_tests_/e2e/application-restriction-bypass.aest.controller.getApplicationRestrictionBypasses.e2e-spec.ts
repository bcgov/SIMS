import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  saveFakeApplication,
  saveFakeApplicationRestrictionBypass,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { ApplicationStatus } from "@sims/sims-db";

describe("ApplicationRestrictionBypassAESTController(e2e)-getApplicationRestrictionBypasses.", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should not get any application restriction bypass for a draft application when it has restriction bypasses.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Draft,
    });
    await saveFakeApplicationRestrictionBypass(
      db,
      {
        application,
      },
      { restrictionCode: RestrictionCode.PTSSR },
    );
    const endpoint = `/aest/application-restriction-bypass/application/${application.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toEqual([]);
      });
  });

  it("Should get application restriction bypasses for a submitted application when it has restriction bypasses.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const restrictionBypass = await saveFakeApplicationRestrictionBypass(
      db,
      {
        application,
      },
      { restrictionCode: RestrictionCode.PTWTHD },
    );
    const endpoint = `/aest/application-restriction-bypass/application/${application.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toEqual([
          {
            id: restrictionBypass.id,
            restrictionType:
              restrictionBypass.studentRestriction.restriction.restrictionType,
            restrictionCode: RestrictionCode.PTWTHD,
            createdAt: restrictionBypass.createdAt.toISOString(),
            isActive: restrictionBypass.studentRestriction.isActive,
          },
        ]);
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
