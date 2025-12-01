import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeInstitution,
  createFakeUser,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createFakeLocation,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  EducationProgram,
  Institution,
  InstitutionLocation,
  NoteType,
  Restriction,
  User,
} from "@sims/sims-db";
import { createFakeEducationProgram } from "@sims/test-utils";

describe("RestrictionAESTController(e2e)-addInstitutionRestriction.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedAuditUser: User;
  let susRestriction: Restriction;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedAuditUser = await db.user.save(createFakeUser());
    // Find the SUS restriction to be used as an example of a valid restriction.
    susRestriction = await db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionCode: RestrictionCode.SUS,
      },
    });
  });

  it("Should add an institution restriction when a valid payload is submitted.", async () => {
    // Arrange
    const { institution, location, program } =
      await createInstitutionProgramLocation();
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    let createdInstitutionRestrictionId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: susRestriction.id,
        programId: program.id,
        locationId: location.id,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) => {
        expect(body).toHaveProperty("id");
        expect(body.id).toBeGreaterThan(0);
        createdInstitutionRestrictionId = +body.id;
      });

    // Assert DB changes.
    const createdInstitutionRestriction =
      await db.institutionRestriction.findOne({
        select: {
          id: true,
          institution: { id: true },
          restriction: { id: true },
          location: { id: true },
          program: { id: true },
          creator: { id: true },
          restrictionNote: {
            id: true,
            noteType: true,
            description: true,
            creator: { id: true },
          },
          isActive: true,
        },
        relations: {
          institution: true,
          restriction: true,
          location: true,
          program: true,
          creator: true,
          restrictionNote: { creator: true },
        },
        where: { id: createdInstitutionRestrictionId },
        loadEagerRelations: false,
      });
    const ministryUserAudit = { id: ministryUser.id };
    expect(createdInstitutionRestriction).toEqual({
      id: createdInstitutionRestrictionId,
      institution: { id: institution.id },
      restriction: { id: susRestriction.id },
      location: { id: location.id },
      program: { id: program.id },
      creator: ministryUserAudit,
      restrictionNote: {
        id: expect.any(Number),
        noteType: NoteType.Restriction,
        description: "Add institution restriction note.",
        creator: ministryUserAudit,
      },
      isActive: true,
    });
  });

  it("Should create the institution restriction when there is already an institution restriction, but it is inactive.", async () => {
    // Arrange
    const { institution, location, program } =
      await createInstitutionProgramLocation();
    await saveFakeInstitutionRestriction(
      db,
      {
        institution,
        program,
        location,
        restriction: susRestriction,
        creator: sharedAuditUser,
      },
      { initialValues: { isActive: false } },
    );
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: susRestriction.id,
        programId: program.id,
        locationId: location.id,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);
  });

  it("Should throw an unprocessable entity exception when an active institution restriction already exists.", async () => {
    // Arrange
    const { institution, location, program } =
      await createInstitutionProgramLocation();
    await saveFakeInstitutionRestriction(db, {
      institution,
      program,
      location,
      restriction: susRestriction,
      creator: sharedAuditUser,
    });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: susRestriction.id,
        programId: program.id,
        locationId: location.id,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `The restriction ID ${susRestriction.id} is already assigned and active to the institution for the specified location ID ${location.id} and program ID ${program.id}.`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw a not found exception when the provided institution is not found.", async () => {
    // Arrange
    const endpoint = `/aest/restriction/institution/999999`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: 1,
        programId: 1,
        locationId: 1,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Institution ID 999999 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw an unprocessable entity exception when the location does not exist associated with the institution.", async () => {
    // Arrange
    const { institution, program } = await createInstitutionProgramLocation({
      skipLocationCreation: true,
    });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: susRestriction.id,
        programId: program.id,
        locationId: 999999,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `The specified location ID 999999 or program ID ${program.id} does not belong to the institution.`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity exception when the restriction ID does not exist.", async () => {
    // Arrange
    const { institution, program, location } =
      await createInstitutionProgramLocation({});
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: 999999,
        programId: program.id,
        locationId: location.id,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Restriction ID 999999 not found.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw a forbidden exception when the user does not have permission.", async () => {
    // Arrange
    const endpoint = "/aest/restriction/institution/999999";
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: 1,
        programId: 1,
        locationId: 1,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  /**
   * Creates an institution with a location and a program as expected by the E2E tests.
   * @param options options to skip the creation of program or location.
   * @returns created institution, location, and program.
   */
  async function createInstitutionProgramLocation(options?: {
    skipProgramCreation?: boolean;
    skipLocationCreation?: boolean;
  }): Promise<{
    institution: Institution;
    location: InstitutionLocation;
    program: EducationProgram;
  }> {
    const institution = createFakeInstitution();
    await db.institution.save(institution);
    let location: InstitutionLocation;
    let program: EducationProgram;
    if (!options?.skipLocationCreation) {
      location = await db.institutionLocation.save(
        createFakeLocation(institution),
      );
    }
    if (!options?.skipProgramCreation) {
      program = await db.educationProgram.save(
        createFakeEducationProgram({
          auditUser: sharedAuditUser,
          institution,
        }),
      );
    }
    return { institution, location, program };
  }

  afterAll(async () => {
    await app?.close();
  });
});
