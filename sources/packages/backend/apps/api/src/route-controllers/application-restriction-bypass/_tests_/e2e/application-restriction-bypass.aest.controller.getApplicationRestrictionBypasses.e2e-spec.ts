import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeUser,
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
import {
  ApplicationStatus,
  OfferingIntensity,
  RestrictionActionType,
  User,
} from "@sims/sims-db";

describe("ApplicationRestrictionBypassAESTController(e2e)-getApplicationRestrictionBypasses.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedMinistryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedMinistryUser = await db.user.save(createFakeUser());
  });

  it("Should not get any application restriction bypass for a completed part-time application when there is no restriction bypass associated with it.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
      offeringIntensity: OfferingIntensity.partTime,
    });
    const endpoint = `/aest/application-restriction-bypass/application/${application.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toEqual({
          bypasses: [],
        });
      });
  });

  it("Should get a list of application restriction bypasses for a submitted part-time application when there is restriction bypass associated with it.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });
    const restrictionBypass = await saveFakeApplicationRestrictionBypass(
      db,
      {
        application,
        bypassCreatedBy: sharedMinistryUser,
        creator: sharedMinistryUser,
      },
      {
        restrictionActionType: RestrictionActionType.StopPartTimeDisbursement,
        restrictionCode: RestrictionCode.PTSSR,
      },
    );
    const endpoint = `/aest/application-restriction-bypass/application/${application.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toEqual({
          bypasses: [
            {
              id: restrictionBypass.id,
              restrictionCategory:
                restrictionBypass.studentRestriction.restriction
                  .restrictionCategory,
              restrictionCode: RestrictionCode.PTSSR,
              isRestrictionActive:
                restrictionBypass.studentRestriction.isActive,
              isBypassActive: restrictionBypass.isActive,
            },
          ],
        });
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
