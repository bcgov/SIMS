import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeRestriction,
  createFakeUser,
  saveFakeApplication,
  saveFakeApplicationRestrictionBypass,
  saveFakeInstitutionRestriction,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  OfferingIntensity,
  RestrictionActionType,
  RestrictionType,
  User,
} from "@sims/sims-db";
import { RestrictedParty } from "@sims/services";

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

  it("Should list all the active restrictions and not the ones already bypassed for a part-time application when there are some restrictions bypassed and some others not.", async () => {
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

    // Add an institution restriction bypass that should be not available for bypass.
    const remitRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.REMIT },
    });
    const remitInstitutionRestriction = await saveFakeInstitutionRestriction(
      db,
      {
        institution:
          application.currentAssessment.offering.institutionLocation
            .institution,
        restriction: remitRestriction,
        program: application.currentAssessment.offering.educationProgram,
        location: application.currentAssessment.offering.institutionLocation,
      },
    );
    await saveFakeApplicationRestrictionBypass(db, {
      application,
      bypassCreatedBy: sharedMinistryUser,
      creator: sharedMinistryUser,
      institutionRestriction: remitInstitutionRestriction,
    });

    // Add a student restriction that should be available to be bypassed because the student restriction is a different one than the student restriction bypassed above.
    const ptssrRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.PTSSR },
    });
    const ptssrStudentRestriction = await saveFakeStudentRestriction(
      db.dataSource,
      {
        student: application.student,
        restriction: ptssrRestriction,
      },
    );

    // Add an institution restriction that should be available to be bypassed.
    const susRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.SUS },
    });
    const institutionRestriction = await saveFakeInstitutionRestriction(db, {
      institution:
        application.currentAssessment.offering.institutionLocation.institution,
      restriction: susRestriction,
      program: application.currentAssessment.offering.educationProgram,
      location: application.currentAssessment.offering.institutionLocation,
    });

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

    // Add an institution restriction bypass that was removed. In other words, it is no longer active and the institution restriction should be available to be bypassed again.
    const newInstitutionRestriction = createFakeRestriction({
      initialValues: {
        restrictionType: RestrictionType.Institution,
      },
    });
    // Assigning a dummy restriction code to handle the order of the result during assertion since the restriction code is used as the sort order during assertion.
    newInstitutionRestriction.restrictionCode = "ZZZ";
    const savedInstitutionRestriction = await db.restriction.save(
      newInstitutionRestriction,
    );
    const savedInstitutionRestrictionBypass =
      await saveFakeInstitutionRestriction(db, {
        institution:
          application.currentAssessment.offering.institutionLocation
            .institution,
        restriction: savedInstitutionRestriction,
        program: application.currentAssessment.offering.educationProgram,
        location: application.currentAssessment.offering.institutionLocation,
      });
    const removedInstitutionRestrictionBypass =
      await saveFakeApplicationRestrictionBypass(
        db,
        {
          application,
          bypassCreatedBy: sharedMinistryUser,
          bypassRemovedBy: sharedMinistryUser,
          creator: sharedMinistryUser,
          institutionRestriction: savedInstitutionRestrictionBypass,
        },
        {
          isRemoved: true,
        },
      );

    // Add a student restriction that should be available to be bypassed because the restriction has an action type "Stop part time BC funding".
    const b6aRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.B6A },
    });
    const stopPartTimeBCFundingStudentRestriction =
      await saveFakeStudentRestriction(db.dataSource, {
        student: application.student,
        restriction: b6aRestriction,
      });

    // Add a student restriction that should not be available to be bypassed because the restriction doesn't have an action type "Stop part time disbursement".
    const b6bRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.B6B },
    });
    await saveFakeStudentRestriction(db.dataSource, {
      student: application.student,
      restriction: b6bRestriction,
    });

    // Add a student restriction that should not be available to be bypassed because the student restriction is not active.
    const af4Restriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.AF4 },
    });
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

    // Add a student restriction that should be available to be bypassed because the restriction has an action type "Stop part time disbursement".
    const ecrsRestriction = await db.restriction.findOne({
      where: { restrictionCode: RestrictionCode.ECRS },
    });
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
            restrictionId:
              removedApplicationRestrictionsBypass.studentRestriction.id,
            restrictionCode:
              removedApplicationRestrictionsBypass.studentRestriction
                .restriction.restrictionCode,
            restrictionCreatedAt:
              removedApplicationRestrictionsBypass.studentRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Student,
          },
          {
            restrictionId: stopPartTimeBCFundingStudentRestriction.id,
            restrictionCode: b6aRestriction.restrictionCode,
            restrictionCreatedAt:
              stopPartTimeBCFundingStudentRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Student,
          },
          {
            restrictionId: stopPartTimeDisbursementStudentRestriction.id,
            restrictionCode: ecrsRestriction.restrictionCode,
            restrictionCreatedAt:
              stopPartTimeDisbursementStudentRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Student,
          },
          {
            restrictionId: ptssrStudentRestriction.id,
            restrictionCode: ptssrRestriction.restrictionCode,
            restrictionCreatedAt:
              ptssrStudentRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Student,
          },
          {
            restrictionId: institutionRestriction.id,
            restrictionCode: institutionRestriction.restriction.restrictionCode,
            restrictionCreatedAt:
              institutionRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Institution,
          },
          {
            restrictionId:
              removedInstitutionRestrictionBypass.institutionRestriction.id,
            restrictionCode:
              removedInstitutionRestrictionBypass.institutionRestriction
                .restriction.restrictionCode,
            restrictionCreatedAt:
              removedInstitutionRestrictionBypass.institutionRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Institution,
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
            restrictionId:
              removedApplicationRestrictionsBypass.studentRestriction.id,
            restrictionCode:
              removedApplicationRestrictionsBypass.studentRestriction
                .restriction.restrictionCode,
            restrictionCreatedAt:
              removedApplicationRestrictionsBypass.studentRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Student,
          },
          {
            restrictionId: stopFullTimeBCFundingStudentRestriction.id,
            restrictionCode: stopFullTimeBCFundingRestriction.restrictionCode,
            restrictionCreatedAt:
              stopFullTimeBCFundingStudentRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Student,
          },
          {
            restrictionId: stopFullTimeStudentRestriction.id,
            restrictionCode: ssrRestriction.restrictionCode,
            restrictionCreatedAt:
              stopFullTimeStudentRestriction.createdAt.toISOString(),
            restrictionType: RestrictedParty.Student,
          },
        ],
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
