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
import { OfferingIntensity, RestrictionActionType, User } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";
import { RestrictedParty } from "@sims/services";

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

  it("Should get a student application restriction bypass for a submitted part-time application when there is an application restriction bypass with the required id.", async () => {
    // Arrange
    const applicationRestrictionBypass =
      await saveFakeApplicationRestrictionBypass(
        db,
        {
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
        restrictionId: applicationRestrictionBypass.studentRestriction.id,
        restrictionCode:
          applicationRestrictionBypass.studentRestriction.restriction
            .restrictionCode,
        restrictedParty: RestrictedParty.Student,
        creationNote: applicationRestrictionBypass.creationNote.description,
        createdBy: getUserFullName(
          applicationRestrictionBypass.bypassCreatedBy,
        ),
        createdDate:
          applicationRestrictionBypass.bypassCreatedDate.toISOString(),
        bypassBehavior: applicationRestrictionBypass.bypassBehavior,
      });
  });

  it("Should get an institution application restriction bypass for a submitted part-time application when there is an application restriction bypass with the required id.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      offeringIntensity: OfferingIntensity.partTime,
    });
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
    const applicationRestrictionBypass =
      await saveFakeApplicationRestrictionBypass(db, {
        application,
        bypassCreatedBy: sharedMinistryUser,
        creator: sharedMinistryUser,
        institutionRestriction: institutionRestriction,
      });
    const endpoint = `/aest/application-restriction-bypass/${applicationRestrictionBypass.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationRestrictionBypassId: applicationRestrictionBypass.id,
        restrictionId: applicationRestrictionBypass.institutionRestriction.id,
        restrictionCode:
          applicationRestrictionBypass.institutionRestriction.restriction
            .restrictionCode,
        restrictedParty: RestrictedParty.Institution,
        creationNote: applicationRestrictionBypass.creationNote.description,
        createdBy: getUserFullName(
          applicationRestrictionBypass.bypassCreatedBy,
        ),
        createdDate:
          applicationRestrictionBypass.bypassCreatedDate.toISOString(),
        bypassBehavior: applicationRestrictionBypass.bypassBehavior,
      });
  });

  it("Should get an inactive application restriction bypass for a submitted part-time application when there is an application restriction bypass with the required id.", async () => {
    // Arrange
    const applicationRestrictionBypass =
      await saveFakeApplicationRestrictionBypass(
        db,
        {
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
        restrictionId: applicationRestrictionBypass.studentRestriction.id,
        restrictionCode:
          applicationRestrictionBypass.studentRestriction.restriction
            .restrictionCode,
        restrictedParty: RestrictedParty.Student,
        creationNote: applicationRestrictionBypass.creationNote.description,
        removalNote: applicationRestrictionBypass.removalNote.description,
        createdBy: getUserFullName(
          applicationRestrictionBypass.bypassCreatedBy,
        ),
        createdDate:
          applicationRestrictionBypass.bypassCreatedDate.toISOString(),
        removedBy: getUserFullName(
          applicationRestrictionBypass.bypassRemovedBy,
        ),
        removedDate:
          applicationRestrictionBypass.bypassRemovedDate.toISOString(),
        bypassBehavior: applicationRestrictionBypass.bypassBehavior,
      });
  });

  it("Should get an inactive application restriction bypass for a submitted part-time application when there is an application restriction bypass associated with a deleted restriction.", async () => {
    // Arrange
    const applicationRestrictionBypass =
      await saveFakeApplicationRestrictionBypass(
        db,
        {
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
    // Soft delete the restriction associated with the student restriction.
    const deletionDate = new Date();
    await db.studentRestriction.update(
      applicationRestrictionBypass.studentRestriction.id,
      {
        deletedAt: deletionDate,
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
        restrictionId: applicationRestrictionBypass.studentRestriction.id,
        restrictionCode:
          applicationRestrictionBypass.studentRestriction.restriction
            .restrictionCode,
        restrictedParty: RestrictedParty.Student,
        creationNote: applicationRestrictionBypass.creationNote.description,
        removalNote: applicationRestrictionBypass.removalNote.description,
        createdBy: getUserFullName(
          applicationRestrictionBypass.bypassCreatedBy,
        ),
        createdDate:
          applicationRestrictionBypass.bypassCreatedDate.toISOString(),
        removedBy: getUserFullName(
          applicationRestrictionBypass.bypassRemovedBy,
        ),
        removedDate:
          applicationRestrictionBypass.bypassRemovedDate.toISOString(),
        bypassBehavior: applicationRestrictionBypass.bypassBehavior,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
