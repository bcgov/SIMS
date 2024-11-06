import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeUser,
  saveFakeApplication,
  saveFakeApplicationRestrictionBypass,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { OfferingIntensity, RestrictionActionType, User } from "@sims/sims-db";

describe("ApplicationRestrictionBypassAESTController(e2e)-getAvailableRestrictionsToBypass.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedMinistryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedMinistryUser = await db.user.save(createFakeUser());
  });

  it("Should list all student active restrictions and not already bypassed for a part-time application when there is one restriction bypassed and some others not.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });

    // Add a restriction bypassed.
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

    // Add a restriction bypassed that has the bypass removed. In other words, it is no longer active and should be available to be bypassed.
    const removedApplicationRestrictionsBypass =
      await saveFakeApplicationRestrictionBypass(
        db,
        {
          application,
          bypassCreatedBy: sharedMinistryUser,
          bypassRemovedBy: sharedMinistryUser,
          creator: sharedMinistryUser,
        },
        {
          restrictionActionType: RestrictionActionType.StopPartTimeDisbursement,
          restrictionCode: RestrictionCode.AF,

          isRemoved: true,
        },
      );

    // Add a restriction that should not be available to be bypassed because the restriction doesn't have an action type "Stop part time disbursement".
    const noEffectRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.B6B },
    });
    await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      restriction: noEffectRestriction,
      application,
    });

    // Add a restriction that should  be available to be bypassed because the restriction has an action type "Stop part time disbursement".
    const stopPartTimeDisbursementRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.ECRS },
    });

    const stopPartTimeDisbursementStudentRestriction =
      await saveFakeStudentRestriction(db.dataSource, {
        student: application.student,
        restriction: stopPartTimeDisbursementRestriction,
        application,
      });
    const endpoint = `/aest/application-restriction-bypass/application/${application.id}/options-list`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        availableRestrictionsToBypass: [
          {
            studentRestrictionId:
              removedApplicationRestrictionsBypass.studentRestriction.id,
            restrictionCode:
              removedApplicationRestrictionsBypass.studentRestriction
                .restriction.restrictionCode,
            studentRestrictionCreatedAt:
              removedApplicationRestrictionsBypass.studentRestriction.createdAt.toISOString(),
          },
          {
            studentRestrictionId: stopPartTimeDisbursementStudentRestriction.id,
            restrictionCode:
              stopPartTimeDisbursementRestriction.restrictionCode,
            studentRestrictionCreatedAt:
              stopPartTimeDisbursementStudentRestriction.createdAt.toISOString(),
          },
        ],
      });
  });

  it("Should list all student active restrictions for a full-time application when there is one restriction bypassed and others not.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.fullTime,
    });

    // Add a restriction bypassed that should be not available to be bypassed.
    await saveFakeApplicationRestrictionBypass(
      db,
      {
        application,
        bypassCreatedBy: sharedMinistryUser,
        creator: sharedMinistryUser,
      },
      {
        restrictionActionType: RestrictionActionType.StopFullTimeDisbursement,
        restrictionCode: RestrictionCode.AF,
      },
    );

    // Add a restriction bypassed that has the bypass removed. In other words, it is no longer active and should be available to be bypassed.
    const removedApplicationRestrictionsBypass =
      await saveFakeApplicationRestrictionBypass(
        db,
        {
          application,
          bypassCreatedBy: sharedMinistryUser,
          bypassRemovedBy: sharedMinistryUser,
          creator: sharedMinistryUser,
        },
        {
          restrictionActionType: RestrictionActionType.StopFullTimeDisbursement,
          restrictionCode: RestrictionCode.AF4,

          isRemoved: true,
        },
      );

    // Add a restriction that should not be available to be bypassed because the restriction doesn't have an action type "Stop full time disbursement" nor "Stop full time BC funding".
    const noEffectRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.B6B },
    });
    await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      restriction: noEffectRestriction,
      application,
    });

    // Add a restriction that should  be available to be bypassed because the restriction has an action type "Stop full time disbursement".
    const stopFullTimeDisbursementRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.SSR },
    });
    const stopFullTimeStudentRestriction = await saveFakeStudentRestriction(
      db.dataSource,
      {
        student: application.student,
        restriction: stopFullTimeDisbursementRestriction,
        application,
      },
    );

    // Add a restriction that should  be available to be bypassed because the restriction has an action type "Stop full time BC funding".
    const stopFullTimeBCFundingRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.BCLM },
    });
    const stopFullTimeBCFundingStudentRestriction =
      await saveFakeStudentRestriction(db.dataSource, {
        student: application.student,
        restriction: stopFullTimeBCFundingRestriction,
        application,
      });

    const endpoint = `/aest/application-restriction-bypass/application/${application.id}/options-list`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        availableRestrictionsToBypass: [
          {
            studentRestrictionId:
              removedApplicationRestrictionsBypass.studentRestriction.id,
            restrictionCode:
              removedApplicationRestrictionsBypass.studentRestriction
                .restriction.restrictionCode,
            studentRestrictionCreatedAt:
              removedApplicationRestrictionsBypass.studentRestriction.createdAt.toISOString(),
          },
          {
            studentRestrictionId: stopFullTimeBCFundingStudentRestriction.id,
            restrictionCode: stopFullTimeBCFundingRestriction.restrictionCode,
            studentRestrictionCreatedAt:
              stopFullTimeBCFundingStudentRestriction.createdAt.toISOString(),
          },
          {
            studentRestrictionId: stopFullTimeStudentRestriction.id,
            restrictionCode:
              stopFullTimeDisbursementRestriction.restrictionCode,
            studentRestrictionCreatedAt:
              stopFullTimeStudentRestriction.createdAt.toISOString(),
          },
        ],
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
