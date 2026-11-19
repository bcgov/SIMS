import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgram,
  createFakeInstitution,
  createFakeUser,
  getMostRecentEducationProgramConfiguration,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  getAESTToken,
  getAESTUser,
  AESTGroups,
} from "../../../../testHelpers";
import request from "supertest";
import {
  EducationProgram,
  EducationProgramConfiguration,
  Institution,
  NoteType,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import { Role } from "../../../../auth/roles.enum";
import MockDate from "mockdate";

describe("EducationProgramAESTController(e2e)-approveProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedInstitution: Institution;
  let sharedUser: User;
  let mostRecentProgramConfiguration: EducationProgramConfiguration;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    mostRecentProgramConfiguration =
      await getMostRecentEducationProgramConfiguration({ db });
    sharedInstitution = createFakeInstitution();
    await db.institution.save(sharedInstitution);
    sharedUser = createFakeUser();
    await db.user.save(sharedUser);
  });

  beforeEach(() => {
    MockDate.reset();
  });

  it("Should approve a pending education program and associate the approval note with the program and the institution when the payload is valid.", async () => {
    // Arrange
    const program = await savePendingProgram();
    const approvedNote = "Program approved note.";
    const endpoint = getEndpoint({
      programId: program.id,
      institutionId: sharedInstitution.id,
    });
    const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const aestUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    // Set a date to be used to verify the audit dates.
    const now = new Date();
    MockDate.set(now);

    // Act
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ approvedNote })
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    const approvedProgram = await db.educationProgram.findOne({
      select: {
        id: true,
        programStatus: true,
        assessedDate: true,
        updatedAt: true,
        assessedBy: { id: true },
        modifier: { id: true },
        programNote: {
          id: true,
          description: true,
          noteType: true,
          creator: { id: true },
        },
      },
      relations: {
        assessedBy: true,
        modifier: true,
        programNote: { creator: true },
      },
      where: { id: program.id },
      loadEagerRelations: false,
    });
    const expectedUser = { id: aestUser.id };
    expect(approvedProgram).toEqual({
      id: program.id,
      programStatus: ProgramStatus.Approved,
      assessedDate: now,
      updatedAt: now,
      assessedBy: expectedUser,
      modifier: expectedUser,
      programNote: {
        id: expect.any(Number),
        description: approvedNote,
        noteType: NoteType.Program,
        creator: expectedUser,
      },
    });
    // Assert the approval note was also added to the institution notes.
    const institution = await db.institution.findOne({
      select: { id: true, notes: { id: true } },
      relations: { notes: true },
      where: {
        id: sharedInstitution.id,
        notes: { id: approvedProgram.programNote.id },
      },
      loadEagerRelations: false,
    });
    expect(institution).toEqual({
      id: sharedInstitution.id,
      notes: [{ id: approvedProgram.programNote.id }],
    });
  });

  it("Should return a bad request HTTP status when the approved note is not provided.", async () => {
    // Arrange
    const endpoint = getEndpoint({
      programId: 99999,
      institutionId: sharedInstitution.id,
    });
    const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ approvedNote: undefined })
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "approvedNote must be shorter than or equal to 1000 characters",
          "approvedNote should not be empty",
        ],
        error: "Bad Request",
      });
  });

  it(`Should return a forbidden HTTP status when the AEST user does not have the ${Role.InstitutionApproveDeclineProgram} role.`, async () => {
    // Arrange
    const program = await savePendingProgram();
    const endpoint = getEndpoint({
      programId: program.id,
      institutionId: sharedInstitution.id,
    });
    // Read-only user without the approve/decline program role.
    const userToken = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ approvedNote: "Program approved note." })
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  /**
   * Creates and saves a pending education program for the shared institution.
   * @returns the saved pending program.
   */
  function savePendingProgram(): Promise<EducationProgram> {
    const program = createFakeEducationProgram(
      {
        institution: sharedInstitution,
        auditUser: sharedUser,
        programConfiguration: mostRecentProgramConfiguration,
      },
      {
        initialValues: {
          programStatus: ProgramStatus.Pending,
          submittedDate: new Date(),
        },
      },
    );
    return db.educationProgram.save(program);
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get the endpoint for approving an education program.
 * @param options endpoint options.
 * - `programId` program ID to be approved.
 * - `institutionId` institution ID the program belongs to.
 * @returns endpoint for approving an education program.
 */
function getEndpoint(options: {
  programId: number;
  institutionId: number;
}): string {
  return `/aest/education-program/${options.programId}/institution/${options.institutionId}/approve`;
}
