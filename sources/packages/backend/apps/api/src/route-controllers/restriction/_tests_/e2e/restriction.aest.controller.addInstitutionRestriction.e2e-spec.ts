import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeInstitution,
  createFakeUser,
  createFakeEducationProgram,
  saveFakeInstitutionRestriction,
  createFakeRestriction,
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
  FieldRequirementType,
  Institution,
  InstitutionLocation,
  NoteType,
  Restriction,
  RestrictionType,
  User,
} from "@sims/sims-db";
import { In } from "typeorm";
import { INSTITUTION_RESTRICTION_ALREADY_ACTIVE } from "../../../../constants";

describe("RestrictionAESTController(e2e)-addInstitutionRestriction.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedAuditUser: User;
  let susRestriction: Restriction;
  let remitRestriction: Restriction;
  // Institution restriction that is applicable institution level.
  let institutionOnlyRestriction: Restriction;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedAuditUser = await db.user.save(createFakeUser());
    institutionOnlyRestriction = createFakeRestriction({
      initialValues: {
        restrictionType: RestrictionType.Institution,
        metadata: {
          fieldRequirements: {
            program: FieldRequirementType.NotAllowed,
            location: FieldRequirementType.NotAllowed,
          },
        },
      },
    });
    // SUS and REMIT restrictions.
    const susRestrictionPromise = db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionCode: RestrictionCode.SUS,
      },
    });
    const remitRestrictionPromise = db.restriction.findOne({
      select: { id: true },
      where: {
        restrictionCode: RestrictionCode.REMIT,
      },
    });
    [susRestriction, remitRestriction] = await Promise.all([
      susRestrictionPromise,
      remitRestrictionPromise,
      db.restriction.save(institutionOnlyRestriction),
    ]);
  });

  it("Should add multiple SUS institution restrictions when a valid payload with program ID and multiple locations IDs is submitted.", async () => {
    // Arrange
    const [institution, program, locationIds, [location1, location2]] =
      await createInstitutionProgramLocations({ numberLocationsToCreate: 2 });
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    let createdInstitutionRestrictionIds: number[];
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: susRestriction.id,
        programId: program.id,
        locationIds,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) => {
        expect(body).toHaveProperty("ids");
        expect(body.ids).toHaveLength(2);
        createdInstitutionRestrictionIds = body.ids;
      });

    // Assert DB changes.
    const createdInstitutionRestrictions = await db.institutionRestriction.find(
      {
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
        where: { id: In(createdInstitutionRestrictionIds) },
        order: { id: "ASC" },
        loadEagerRelations: false,
      },
    );
    // Ensure both restrictions have the same note.
    const [createdInstitutionRestriction1, createdInstitutionRestriction2] =
      createdInstitutionRestrictions;
    expect(createdInstitutionRestriction1.restrictionNote.id).toBe(
      createdInstitutionRestriction2.restrictionNote.id,
    );
    // Validate created institution restrictions.
    const ministryUserAudit = { id: ministryUser.id };
    expect(createdInstitutionRestrictions).toEqual([
      {
        id: createdInstitutionRestriction1.id,
        institution: { id: institution.id },
        restriction: { id: susRestriction.id },
        location: { id: location1.id },
        program: { id: program.id },
        creator: ministryUserAudit,
        restrictionNote: {
          id: expect.any(Number),
          noteType: NoteType.Restriction,
          description: "Add institution restriction note.",
          creator: ministryUserAudit,
        },
        isActive: true,
      },
      {
        id: createdInstitutionRestriction2.id,
        institution: { id: institution.id },
        restriction: { id: susRestriction.id },
        location: { id: location2.id },
        program: { id: program.id },
        creator: ministryUserAudit,
        restrictionNote: {
          id: expect.any(Number),
          noteType: NoteType.Restriction,
          description: "Add institution restriction note.",
          creator: ministryUserAudit,
        },
        isActive: true,
      },
    ]);
  });

  it("Should add multiple REMIT institution restrictions when a valid payload with multiple locations IDs is submitted.", async () => {
    // Arrange
    const [institution, , locationIds, [location1, location2]] =
      await createInstitutionProgramLocations({
        skipProgramCreation: true,
        numberLocationsToCreate: 2,
      });
    const ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    let createdInstitutionRestrictionIds: number[];
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: remitRestriction.id,
        locationIds,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) => {
        expect(body).toHaveProperty("ids");
        expect(body.ids).toHaveLength(2);
        createdInstitutionRestrictionIds = body.ids;
      });

    // Assert DB changes.
    const createdInstitutionRestrictions = await db.institutionRestriction.find(
      {
        select: {
          id: true,
          institution: { id: true },
          restriction: { id: true },
          location: { id: true },
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
          creator: true,
          restrictionNote: { creator: true },
        },
        where: { id: In(createdInstitutionRestrictionIds) },
        order: { id: "ASC" },
        loadEagerRelations: false,
      },
    );
    // Ensure both restrictions have the same note.
    const [createdInstitutionRestriction1, createdInstitutionRestriction2] =
      createdInstitutionRestrictions;
    expect(createdInstitutionRestriction1.restrictionNote.id).toBe(
      createdInstitutionRestriction2.restrictionNote.id,
    );
    // Validate created institution restrictions.
    const ministryUserAudit = { id: ministryUser.id };
    expect(createdInstitutionRestrictions).toEqual([
      {
        id: createdInstitutionRestriction1.id,
        institution: { id: institution.id },
        restriction: { id: remitRestriction.id },
        location: { id: location1.id },
        creator: ministryUserAudit,
        restrictionNote: {
          id: expect.any(Number),
          noteType: NoteType.Restriction,
          description: "Add institution restriction note.",
          creator: ministryUserAudit,
        },
        isActive: true,
      },
      {
        id: createdInstitutionRestriction2.id,
        institution: { id: institution.id },
        restriction: { id: remitRestriction.id },
        location: { id: location2.id },
        creator: ministryUserAudit,
        restrictionNote: {
          id: expect.any(Number),
          noteType: NoteType.Restriction,
          description: "Add institution restriction note.",
          creator: ministryUserAudit,
        },
        isActive: true,
      },
    ]);
  });

  it("Should add a single institution only institution restriction when a valid payload without program ID and location IDs is submitted.", async () => {
    // Arrange
    const [institution] = await createInstitutionProgramLocations({
      skipProgramCreation: true,
      numberLocationsToCreate: 0,
    });
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
        restrictionId: institutionOnlyRestriction.id,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect(({ body }) => {
        expect(body).toHaveProperty("ids");
        expect(body.ids).toHaveLength(1);
        [createdInstitutionRestrictionId] = body.ids;
      });

    // Assert DB changes.
    const createdInstitutionRestriction =
      await db.institutionRestriction.findOne({
        select: {
          id: true,
          institution: { id: true },
          restriction: { id: true },
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
          creator: true,
          restrictionNote: { creator: true },
        },
        where: { id: createdInstitutionRestrictionId },
        order: { id: "ASC" },
        loadEagerRelations: false,
      });
    // Validate created institution restrictions.
    const ministryUserAudit = { id: ministryUser.id };
    expect(createdInstitutionRestriction).toEqual({
      id: createdInstitutionRestriction.id,
      institution: { id: institution.id },
      restriction: { id: institutionOnlyRestriction.id },
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
    const [institution, program, locationIds, [location]] =
      await createInstitutionProgramLocations({ numberLocationsToCreate: 1 });
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
        locationIds,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);
  });

  it("Should throw an unprocessable entity exception when an active institution restriction already exists for at least one location.", async () => {
    // Arrange
    // First location will have an active restriction while the second location will not.
    const [institution, program, locationIds, [location]] =
      await createInstitutionProgramLocations({ numberLocationsToCreate: 2 });
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
        locationIds,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `The restriction ID ${susRestriction.id} is already assigned and active to the institution, program ID ${program.id}, and at least one of the location ID(s) ${locationIds}.`,
        errorType: INSTITUTION_RESTRICTION_ALREADY_ACTIVE,
      });
  });

  it("Should throw an unprocessable entity exception when trying to add a provincial restriction.", async () => {
    // Arrange
    const [institution, program, locationIds] =
      await createInstitutionProgramLocations({ numberLocationsToCreate: 1 });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Find a provincial restriction.
    const provincialRestriction = await db.restriction.findOne({
      where: { restrictionType: RestrictionType.Provincial },
    });

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: provincialRestriction.id,
        programId: program.id,
        locationIds,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Restriction ID ${provincialRestriction.id} not found or invalid.`,
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
        locationIds: [1],
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

  it("Should throw an unprocessable entity exception when the location is not associated with the institution.", async () => {
    // Arrange
    const [institution, program] = await createInstitutionProgramLocations({
      numberLocationsToCreate: 0,
    });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: susRestriction.id,
        programId: program.id,
        locationIds: [999999],
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `At least one of the location ID(s) 999999 were not associated with the institution.`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity exception when the program does not exist associated with the institution.", async () => {
    // Arrange
    const [institution, , locationIds] =
      await createInstitutionProgramLocations({
        skipProgramCreation: true,
        numberLocationsToCreate: 1,
      });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: susRestriction.id,
        programId: 999999,
        locationIds,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "The specified program ID 999999 is not associated with the institution.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity exception when the restriction ID does not exist.", async () => {
    // Arrange
    const [institution, program, locationIds] =
      await createInstitutionProgramLocations({
        numberLocationsToCreate: 1,
      });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: 999999,
        programId: program.id,
        locationIds,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Restriction ID 999999 not found or invalid.",
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

  it("Should throw a bad request exception on add REMIT restriction when no locations were provided in the request payload.", async () => {
    // Arrange
    const [institution] = await createInstitutionProgramLocations({
      skipProgramCreation: true,
      numberLocationsToCreate: 0,
    });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: remitRestriction.id,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: "Field requirement error(s): location is required.",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request exception on add REMIT restriction when program is provided in the request payload.", async () => {
    // Arrange
    const [institution, program, locationIds] =
      await createInstitutionProgramLocations({
        numberLocationsToCreate: 1,
      });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: remitRestriction.id,
        locationIds,
        programId: program.id,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: "Field requirement error(s): program is not allowed.",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request exception on add SUS restriction when no program and locations were provided in the request payload.", async () => {
    // Arrange
    const [institution] = await createInstitutionProgramLocations({
      skipProgramCreation: true,
      numberLocationsToCreate: 0,
    });
    const endpoint = `/aest/restriction/institution/${institution.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: susRestriction.id,
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message:
          "Field requirement error(s): program is required, location is required.",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request exception when no locations were provided.", async () => {
    // Arrange
    const endpoint = "/aest/restriction/institution/999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: 1,
        programId: 1,
        locationIds: [],
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["locationIds must contain at least 1 elements"],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request exception when too many locations are provided.", async () => {
    // Arrange
    const endpoint = "/aest/restriction/institution/999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({
        restrictionId: 1,
        programId: 1,
        locationIds: new Array(101).fill(1),
        noteDescription: "Add institution restriction note.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["locationIds must contain no more than 100 elements"],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  /**
   * Creates an institution with program and locations as expected by the E2E tests.
   * @param options Options to skip the creation of program or location.
   * - `skipProgramCreation` When true, the program creation is skipped.
   * - `numberLocationsToCreate` Number of locations to be created. Zero can be provided to not create locations.
   * @returns Created institution, program, location, locationsIds, and locations objects.
   * Returned as a array to simplify destructuring in the tests.
   */
  async function createInstitutionProgramLocations(options?: {
    skipProgramCreation?: boolean;
    numberLocationsToCreate: number;
  }): Promise<
    [
      institution: Institution,
      program: EducationProgram,
      locationsIds: number[],
      locations: InstitutionLocation[],
    ]
  > {
    // Institution creation.
    const institution = await db.institution.save(createFakeInstitution());
    let locations: InstitutionLocation[] = [];
    let program: EducationProgram;
    // Program creation.
    if (!options?.skipProgramCreation) {
      program = await db.educationProgram.save(
        createFakeEducationProgram({
          auditUser: sharedAuditUser,
          institution,
        }),
      );
    }
    // Locations creation.
    if (options?.numberLocationsToCreate) {
      const fakeLocations = Array.from({
        length: options.numberLocationsToCreate,
      }).map(() => createFakeLocation(institution));
      locations = await db.institutionLocation.save(fakeLocations);
    }
    const locationsIds = locations.map((location) => location.id);
    return [institution, program, locationsIds, locations];
  }

  afterAll(async () => {
    await app?.close();
  });
});
