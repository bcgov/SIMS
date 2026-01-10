import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  saveFakeApplication,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { RestrictionType } from "@sims/sims-db";
import { Not } from "typeorm";

describe("RestrictionAESTController(e2e)-resolveInstitutionRestriction.", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should resolve an institution restriction for the provided institution restriction identifier.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    // Institution restriction that blocks disbursement.
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
        restrictionCode: RestrictionCode.SUS,
      },
    });
    const offering = application.currentAssessment.offering;
    const location = offering.institutionLocation;
    const program = offering.educationProgram;
    const institution = location.institution;
    // Add institution restriction for the application location and program.
    const institutionRestriction = await saveFakeInstitutionRestriction(db, {
      restriction,
      institution,
      program,
      location,
    });
    const endpoint = `/aest/restriction/institution/${institution.id}/institutionRestriction/${institutionRestriction.id}/resolve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "Note for resolved institution restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Find the institution restriction and validate if it is resolved.
    const resolvedInstitutionRestriction =
      await db.institutionRestriction.findOne({
        select: {
          id: true,
          resolutionNote: { id: true, description: true },
          resolvedAt: true,
          resolvedBy: { id: true },
        },
        relations: {
          resolutionNote: true,
          resolvedBy: true,
        },
        where: { id: institutionRestriction.id },
      });
    expect(resolvedInstitutionRestriction.resolvedAt).toBeDefined();
    expect(resolvedInstitutionRestriction.resolvedBy).toBeDefined();
    expect(resolvedInstitutionRestriction.resolutionNote.description).toBe(
      "Note for resolved institution restriction.",
    );
  });

  it("Should throw a not found exception when the provided institution restriction is inactive.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    // Institution restriction that blocks disbursement.
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
        restrictionCode: RestrictionCode.SUS,
      },
    });
    const offering = application.currentAssessment.offering;
    const location = offering.institutionLocation;
    const program = offering.educationProgram;
    const institution = location.institution;
    // Add institution restriction for the application location and program.
    const institutionRestriction = await saveFakeInstitutionRestriction(
      db,
      {
        restriction,
        institution,
        program,
        location,
      },
      {
        initialValues: {
          isActive: false,
        },
      },
    );
    const endpoint = `/aest/restriction/institution/${institution.id}/institutionRestriction/${institutionRestriction.id}/resolve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "Note for resolved institution restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    // Find the institution restriction and validate it to not be resolved.
    const unresolvedInstitutionRestriction =
      await db.institutionRestriction.findOne({
        select: {
          id: true,
          resolutionNote: { id: true, description: true },
          resolvedAt: true,
          resolvedBy: { id: true },
        },
        relations: {
          resolutionNote: true,
          resolvedBy: true,
        },
        where: { id: institutionRestriction.id },
      });
    expect(unresolvedInstitutionRestriction.resolvedAt).toBeNull();
    expect(unresolvedInstitutionRestriction.resolvedBy).toBeNull();
    expect(unresolvedInstitutionRestriction.resolutionNote).toBeNull();
  });

  it("Should throw a not found exception when the provided restriction does not belong to the institution.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    // Institution restriction that blocks disbursement.
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
      },
    });
    const offering = application.currentAssessment.offering;
    const location = offering.institutionLocation;
    const program = offering.educationProgram;
    const institution = location.institution;
    // Get a different institution to which the above restriction does not belong.
    const differentInstitution = await db.institution.findOne({
      select: { id: true },
      where: { id: Not(institution.id) },
    });
    // Add institution restriction for the application location and program.
    const institutionRestriction = await saveFakeInstitutionRestriction(
      db,
      {
        restriction,
        institution,
        program,
        location,
      },
      {
        initialValues: {
          isActive: false,
        },
      },
    );
    const endpoint = `/aest/restriction/institution/${differentInstitution.id}/institutionRestriction/${institutionRestriction.id}/resolve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "Note for resolved institution restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);

    // Find the institution restriction and validate it to not be resolved.
    const unresolvedInstitutionRestriction =
      await db.institutionRestriction.findOne({
        select: {
          id: true,
          resolutionNote: { id: true, description: true },
          resolvedAt: true,
          resolvedBy: { id: true },
        },
        relations: {
          resolutionNote: true,
          resolvedBy: true,
        },
        where: { id: institutionRestriction.id },
      });
    expect(unresolvedInstitutionRestriction.resolvedAt).toBeNull();
    expect(unresolvedInstitutionRestriction.resolvedBy).toBeNull();
    expect(unresolvedInstitutionRestriction.resolutionNote).toBeNull();
  });

  afterAll(async () => {
    await app?.close();
  });
});
