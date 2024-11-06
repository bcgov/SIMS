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
import { OfferingIntensity, RestrictionActionType, User } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";

describe("ApplicationRestrictionBypassAESTController(e2e)-getApplicationRestrictionBypass.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedMinistryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedMinistryUser = await db.user.save(createFakeUser());
  });

  it("Should get an application restriction bypass for a submitted part-time application when there is an application restriction bypass with the required id.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });
    const applicationRestrictionBypass =
      await saveFakeApplicationRestrictionBypass(
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
    const endpoint = `/aest/application-restriction-bypass/${applicationRestrictionBypass.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationRestrictionBypassId: applicationRestrictionBypass.id,
        studentRestrictionId:
          applicationRestrictionBypass.studentRestriction.id,
        restrictionCode:
          applicationRestrictionBypass.studentRestriction.restriction
            .restrictionCode,
        applicationRestrictionBypassCreationNote:
          applicationRestrictionBypass.creationNote.description,
        applicationRestrictionBypassCreatedBy: getUserFullName(
          applicationRestrictionBypass.bypassCreatedBy,
        ),
        applicationRestrictionBypassCreatedDate:
          applicationRestrictionBypass.bypassCreatedDate.toISOString(),
        applicationRestrictionBypassBehavior:
          applicationRestrictionBypass.bypassBehavior,
      });
  });

  it("Should get an inactive application restriction bypass for a submitted part-time application when there is an application restriction bypass with the required id.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });
    const applicationRestrictionBypass =
      await saveFakeApplicationRestrictionBypass(
        db,
        {
          application,
          bypassCreatedBy: sharedMinistryUser,
          creator: sharedMinistryUser,
          bypassRemovedBy: sharedMinistryUser,
        },
        {
          restrictionActionType: RestrictionActionType.StopPartTimeDisbursement,
          restrictionCode: RestrictionCode.PTSSR,

          isRemoved: true,
        },
      );
    const endpoint = `/aest/application-restriction-bypass/${applicationRestrictionBypass.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationRestrictionBypassId: applicationRestrictionBypass.id,
        studentRestrictionId:
          applicationRestrictionBypass.studentRestriction.id,
        restrictionCode:
          applicationRestrictionBypass.studentRestriction.restriction
            .restrictionCode,
        applicationRestrictionBypassCreationNote:
          applicationRestrictionBypass.creationNote.description,
        applicationRestrictionBypassRemovalNote:
          applicationRestrictionBypass.removalNote.description,
        applicationRestrictionBypassCreatedBy: getUserFullName(
          applicationRestrictionBypass.bypassCreatedBy,
        ),
        applicationRestrictionBypassCreatedDate:
          applicationRestrictionBypass.bypassCreatedDate.toISOString(),
        applicationRestrictionBypassRemovedBy: getUserFullName(
          applicationRestrictionBypass.bypassRemovedBy,
        ),
        applicationRestrictionBypassRemovedDate:
          applicationRestrictionBypass.bypassRemovedDate.toISOString(),
        applicationRestrictionBypassBehavior:
          applicationRestrictionBypass.bypassBehavior,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
