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
  NoteType,
  OfferingIntensity,
  RestrictionActionType,
  User,
} from "@sims/sims-db";
import { APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE } from "../../../../constants";

describe("ApplicationRestrictionBypassAESTController(e2e)-removeBypassRestriction", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedMinistryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedMinistryUser = await db.user.save(createFakeUser());
  });

  it("Should be able to remove an active bypass when there is an active bypass.", async () => {
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

    const payload = {
      note: "Removal note",
    };
    const endpoint = `/aest/application-restriction-bypass/${restrictionBypass.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const applicationRestrictionBypass =
      await db.applicationRestrictionBypass.findOne({
        select: {
          id: true,
          removalNote: { noteType: true, description: true },
          bypassRemovedDate: true,
          bypassRemovedBy: { id: true },
          isActive: true,
          updatedAt: true,
          modifier: { id: true },
        },
        relations: {
          bypassRemovedBy: true,
          removalNote: true,
          modifier: true,
        },
        where: { id: restrictionBypass.id },
      });

    expect(applicationRestrictionBypass).toMatchObject({
      id: restrictionBypass.id,
      removalNote: {
        noteType: NoteType.Application,
        description: payload.note,
      },
      bypassRemovedDate: expect.any(Date),
      bypassRemovedBy: { id: expect.any(Number) },
      isActive: false,
      updatedAt: expect.any(Date),
      modifier: { id: expect.any(Number) },
    });
  });

  it("Should throw an HTTP error while removing a bypass when the bypass is not active.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });
    const restrictionBypass = await saveFakeApplicationRestrictionBypass(
      db,
      {
        application,
        bypassCreatedBy: sharedMinistryUser,
        bypassRemovedBy: sharedMinistryUser,
        creator: sharedMinistryUser,
      },
      {
        restrictionActionType: RestrictionActionType.StopPartTimeDisbursement,
        restrictionCode: RestrictionCode.PTSSR,
        isRemoved: true,
      },
    );
    const payload = {
      note: "Removal note",
    };
    const endpoint = `/aest/application-restriction-bypass/${restrictionBypass.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Cannot remove a bypass when application restriction bypass is not active.",
        errorType: APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
      });
  });

  it("Should throw an HTTP error while removing a bypass when the bypass is not found.", async () => {
    // Arrange
    const payload = {
      note: "Removal note",
    };
    const endpoint = "/aest/application-restriction-bypass/99999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application restriction bypass not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
