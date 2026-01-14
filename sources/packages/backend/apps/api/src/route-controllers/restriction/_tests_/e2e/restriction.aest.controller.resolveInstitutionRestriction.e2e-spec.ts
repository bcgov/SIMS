import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import * as request from "supertest";
import { NoteType, RestrictionType, User } from "@sims/sims-db";

describe("RestrictionAESTController(e2e)-resolveInstitutionRestriction.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let auditUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    auditUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
  });

  it("Should resolve the institution restriction when the provided institution restriction is active.", async () => {
    // Arrange
    const offering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering({ auditUser }),
    );
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
      },
    });
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
          resolutionNote: { id: true, description: true, noteType: true },
          resolvedAt: true,
          resolvedBy: { id: true },
          isActive: true,
        },
        relations: {
          resolutionNote: true,
          resolvedBy: true,
        },
        where: { id: institutionRestriction.id },
      });
    expect(resolvedInstitutionRestriction).toEqual({
      id: institutionRestriction.id,
      isActive: false,
      resolutionNote: {
        id: expect.any(Number),
        description: "Note for resolved institution restriction.",
        noteType: NoteType.Restriction,
      },
      resolvedAt: expect.any(Date),
      resolvedBy: {
        id: auditUser.id,
      },
    });
  });

  it("Should throw an unprocessable entity exception when the provided institution restriction is inactive.", async () => {
    // Arrange
    const offering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering({ auditUser }),
    );
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
      },
    });
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
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "The restriction is already resolved.",
        errorType: "RESTRICTION_NOT_ACTIVE",
      });
  });

  it("Should throw a not found exception when the provided restriction does not belong to the institution.", async () => {
    // Arrange
    const offering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering({ auditUser }),
    );
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
      },
    });
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
    const endpoint = `/aest/restriction/institution/99999/institutionRestriction/${institutionRestriction.id}/resolve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "Note for resolved institution restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "The restriction for the institution was not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw an forbidden exception when the user does not have the required permission.", async () => {
    // Arrange
    const offering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering({ auditUser }),
    );
    const restriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
      },
    });
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
    const endpoint = `/aest/restriction/institution/99999/institutionRestriction/${institutionRestriction.id}/resolve`;
    const token = await getAESTToken(AESTGroups.Operations);
    // Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        noteDescription: "Note for resolved institution restriction.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
