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

    // Add a student restriction bypassed that should be not available to be bypassed again.
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

    const ptssrRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.PTSSR },
    });
    // Add a student restriction that should be available to be bypassed because the student restriction is a different one than the student restriction bypassed above.
    const ptssrStudentRestriction = await saveFakeStudentRestriction(
      db.dataSource,
      {
        student: application.student,
        restriction: ptssrRestriction,
      },
    );

    // Add a student restriction bypassed that was removed. In other words, it is no longer active and the student restriction should be available to be bypassed again.
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

    const b6bRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.B6B },
    });
    // Add a student restriction that should not be available to be bypassed because the restriction doesn't have an action type "Stop part time disbursement".
    await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      restriction: b6bRestriction,
    });

    const af4Restriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.AF4 },
    });
    // Add a student restriction that should not be available to be bypassed because the student restriction is not active.
    await saveFakeStudentRestriction(
      db.dataSource,
      {
        student: application.student,
        restriction: af4Restriction,
      },
      {
        isActive: false,
      },
    );

    const ecrsRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.ECRS },
    });

    // Add a student restriction that should be available to be bypassed because the restriction has an action type "Stop part time disbursement".
    const stopPartTimeDisbursementStudentRestriction =
      await saveFakeStudentRestriction(db.dataSource, {
        student: application.student,
        restriction: ecrsRestriction,
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
            restrictionCode: ecrsRestriction.restrictionCode,
            studentRestrictionCreatedAt:
              stopPartTimeDisbursementStudentRestriction.createdAt.toISOString(),
          },
          {
            studentRestrictionId: ptssrStudentRestriction.id,
            restrictionCode: ptssrRestriction.restrictionCode,
            studentRestrictionCreatedAt:
              ptssrStudentRestriction.createdAt.toISOString(),
          },
        ],
      });
  });

  it("Should list all student active restrictions for a full-time application when there is one restriction bypassed and others not.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.fullTime,
    });

    // Add a student restriction bypassed that should be not available to be bypassed again.
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

    // Add a student restriction bypassed that was removed. In other words, it is no longer active and the student restriction should be available to be bypassed again.
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

    const b6bRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.B6B },
    });
    // Add a student restriction that should not be available to be bypassed because the restriction doesn't have an action type "Stop full time disbursement" nor "Stop full time BC funding".
    await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      restriction: b6bRestriction,
    });

    // Add a restriction that should be available to be bypassed because the restriction has an action type "Stop full time disbursement".
    const ssrRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.SSR },
    });
    const stopFullTimeStudentRestriction = await saveFakeStudentRestriction(
      db.dataSource,
      {
        student: application.student,
        restriction: ssrRestriction,
      },
    );

    const stopFullTimeBCFundingRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.BCLM },
    });
    // Add a student restriction that should be available to be bypassed because the restriction has an action type "Stop full time BC funding".
    const stopFullTimeBCFundingStudentRestriction =
      await saveFakeStudentRestriction(db.dataSource, {
        student: application.student,
        restriction: stopFullTimeBCFundingRestriction,
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
            restrictionCode: ssrRestriction.restrictionCode,
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
