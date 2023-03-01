import { HttpStatus, INestApplication } from "@nestjs/common";
import { createFakeInstitution, createFakeUser } from "@sims/test-utils";
import { Repository } from "typeorm";
import { Institution, Note, NoteType, User } from "@sims/sims-db";
import {
  AESTGroups,
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { createFakeNote } from "@sims/test-utils/factories/note";
import { NoteAPIOutDTO } from "../../models/note.dto";

describe("NoteAESTController(e2e)-getInstitutionNotes", () => {
  let app: INestApplication;
  let institutionRepo: Repository<Institution>;
  let noteRepo: Repository<Note>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    institutionRepo = dataSource.getRepository(Institution);
    noteRepo = dataSource.getRepository(Note);
    userRepo = dataSource.getRepository(User);
  });

  it("Should allow access to the expected AEST users groups", async () => {
    // Arrange
    const user = await userRepo.save(createFakeUser());
    const notes = await noteRepo.save([
      createFakeNote(NoteType.General, { creator: user }),
      createFakeNote(NoteType.System, { creator: user }),
    ]);
    const institution = await institutionRepo.save(createFakeInstitution());
    await institutionRepo
      .createQueryBuilder()
      .relation(Institution, "notes")
      .of(institution)
      .add(notes);
    const endpoint = `/aest/note/institution/${institution.id}`;
    const expectedPermissions = [
      {
        aestGroup: AESTGroups.BusinessAdministrators,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.Operations,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.OperationsAdministrators,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.MOFOperations,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: undefined, // Read only user.
        expectedHttpStatus: HttpStatus.OK,
      },
    ];

    // Act/Assert
    for (const permission of expectedPermissions) {
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(await getAESTToken(permission.aestGroup), BEARER_AUTH_TYPE)
        .expect(permission.expectedHttpStatus);
    }
  });

  it("Should get institution notes", async () => {
    // Arrange
    const user = await userRepo.save(createFakeUser());
    const institutionNote = await noteRepo.save(
      createFakeNote(NoteType.General, { creator: user }),
    );
    const institution = await institutionRepo.save(createFakeInstitution());
    await institutionRepo
      .createQueryBuilder()
      .relation(Institution, "notes")
      .of(institution)
      .add(institutionNote);
    const endpoint = `/aest/note/institution/${institution.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const [createdNote] = response.body as NoteAPIOutDTO[];
        expect(createdNote.noteType).toBe(institutionNote.noteType);
        expect(createdNote.description).toBe(institutionNote.description);
        expect(createdNote.firstName).toBe(institutionNote.creator.firstName);
        expect(createdNote.lastName).toBe(institutionNote.creator.lastName);
        expect(createdNote.createdAt).toBe(
          institutionNote.createdAt.toISOString(),
        );
      });
  });

  it("Should filter institution notes when a filter is provided", async () => {
    // Arrange
    const user = await userRepo.save(createFakeUser());
    const institutionNotes = await noteRepo.save([
      createFakeNote(NoteType.General, { creator: user }),
      createFakeNote(NoteType.Designation, { creator: user }),
      createFakeNote(NoteType.Program, { creator: user }),
    ]);
    const institution = await institutionRepo.save(createFakeInstitution());
    await institutionRepo
      .createQueryBuilder()
      .relation(Institution, "notes")
      .of(institution)
      .add(institutionNotes);
    const endpoint = `/aest/note/institution/${institution.id}?noteType=${NoteType.Designation}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const filteredNotes = response.body as NoteAPIOutDTO[];
        for (const note of filteredNotes) {
          expect(note.noteType).toBe(NoteType.Designation);
        }
      });
  });

  it("Should throw NotFoundException when institution not found", async () => {
    // Arrange/Act/Assert
    return request(app.getHttpServer())
      .get("/aest/note/institution/999999")
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Institution not found.",
        error: "Not Found",
      });
  });

  it("Should throw bad request exception when invalid note type provided", async () => {
    // Arrange
    const institution = await institutionRepo.save(createFakeInstitution());
    const endpoint = `/aest/note/institution/${institution.id}?noteType=invalid_node_type`;

    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Validation failed (enum string is expected)",
        error: "Bad Request",
      });
  });

  it("Should return empty result when institution does not have any note", async () => {
    // Arrange
    const institution = await institutionRepo.save(createFakeInstitution());
    const endpoint = `/aest/note/institution/${institution.id}`;

    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toHaveLength(0);
      });
  });

  it("Should return empty result when institution has notes but none of filtered note type", async () => {
    // Arrange
    const user = await userRepo.save(createFakeUser());
    const institutionNotes = await noteRepo.save([
      createFakeNote(NoteType.General, { creator: user }),
      createFakeNote(NoteType.Program, { creator: user }),
    ]);
    const institution = await institutionRepo.save(createFakeInstitution());
    await institutionRepo
      .createQueryBuilder()
      .relation(Institution, "notes")
      .of(institution)
      .add(institutionNotes);
    const endpoint = `/aest/note/institution/${institution.id}?noteType=${NoteType.Designation}`;
    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toHaveLength(0);
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
