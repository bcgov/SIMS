import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeUser,
  saveFakeApplication,
  saveFakeApplicationRestrictionBypass,
  saveFakeInstitutionRestriction,
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
  RestrictionBypassBehaviors,
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
      .expect({
        bypasses: [],
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
    // Create an institution restriction and a bypass for it.
    const restriction = await db.restriction.findOne({
      select: {
        id: true,
        restrictionCategory: true,
      },
      where: {
        restrictionCode: RestrictionCode.SUS,
      },
    });
    const susRestriction = await saveFakeInstitutionRestriction(db, {
      restriction,
      program: application.currentAssessment.offering.educationProgram,
    });
    // Create an institution restriction bypass so that bypass history includes both
    // application and institution-level bypasses for this application.
    const institutionRestrictionBypass =
      await saveFakeApplicationRestrictionBypass(
        db,
        {
          application,
          institutionRestriction: susRestriction,
          bypassCreatedBy: sharedMinistryUser,
          creator: sharedMinistryUser,
        },
        {
          initialValues: {
            bypassBehavior: RestrictionBypassBehaviors.NextDisbursementOnly,
          },
        },
      );
    const endpoint = `/aest/application-restriction-bypass/application/${application.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        bypasses: [
          {
            id: institutionRestrictionBypass.id,
            restrictionCategory:
              institutionRestrictionBypass.institutionRestriction.restriction
                .restrictionCategory,
            restrictionCode: RestrictionCode.SUS,
            isRestrictionActive:
              institutionRestrictionBypass.institutionRestriction.isActive,
            isBypassActive: institutionRestrictionBypass.isActive,
          },
          {
            id: restrictionBypass.id,
            restrictionCategory:
              restrictionBypass.studentRestriction.restriction
                .restrictionCategory,
            restrictionCode: RestrictionCode.PTSSR,
            isRestrictionActive: restrictionBypass.studentRestriction.isActive,
            restrictionDeletedAt: null,
            isBypassActive: restrictionBypass.isActive,
          },
        ],
      });
  });

  it("Should get application restriction bypasses associated with deleted restrictions when there is a restriction bypass associated with a deleted restriction.", async () => {
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
    // Soft delete the restriction associated with the student restriction.
    const deletionDate = new Date();
    await db.studentRestriction.update(
      restrictionBypass.studentRestriction.id,
      {
        deletedAt: deletionDate,
      },
    );
    const endpoint = `/aest/application-restriction-bypass/application/${application.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        bypasses: [
          {
            id: restrictionBypass.id,
            restrictionCategory:
              restrictionBypass.studentRestriction.restriction
                .restrictionCategory,
            restrictionCode: RestrictionCode.PTSSR,
            restrictionDeletedAt: deletionDate.toISOString(),
            isRestrictionActive: restrictionBypass.studentRestriction.isActive,
            isBypassActive: restrictionBypass.isActive,
          },
        ],
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
