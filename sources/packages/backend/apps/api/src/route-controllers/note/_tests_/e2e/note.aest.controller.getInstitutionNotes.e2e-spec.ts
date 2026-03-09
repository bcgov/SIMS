import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  createE2EDataSources,
  createFakeInstitution,
  E2EDataSources,
} from "@sims/test-utils";
import { NoteType } from "@sims/sims-db";
import {
  AESTGroups,
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  createFakeNote,
  saveFakeInstitutionNotes,
} from "@sims/test-utils/factories/note";
import { transformNoteToApiReturn } from "./test-utils";

describe("NoteAESTController(e2e)-getInstitutionNotes", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should allow access to the expected AEST users groups.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    await saveFakeInstitutionNotes(
      db.dataSource,
      [createFakeNote(NoteType.General)],
      institution.id,
    );
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

  it("Should get institution notes.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    const [institutionNote] = await saveFakeInstitutionNotes(
      db.dataSource,
      [createFakeNote(NoteType.General)],
      institution.id,
    );
    const endpoint = `/aest/note/institution/${institution.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([transformNoteToApiReturn(institutionNote)]);
  });

  it("Should filter institution notes when a filter is provided.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    const savedNotes = await saveFakeInstitutionNotes(
      db.dataSource,
      [
        createFakeNote(NoteType.General),
        createFakeNote(NoteType.Designation),
        createFakeNote(NoteType.Program),
      ],
      institution.id,
    );
    const expectedNote = savedNotes.find(
      (note) => note.noteType === NoteType.Designation,
    );
    const endpoint = `/aest/note/institution/${institution.id}?noteTypes=${NoteType.Designation}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([transformNoteToApiReturn(expectedNote)]);
  });

  it("Should throw NotFoundException when institution not found.", async () => {
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

  it("Should throw bad request exception when invalid note type provided.", async () => {
    // Arrange
    const endpoint = "/aest/note/institution/99999?noteTypes=invalid_node_type";

    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "each value in noteTypes must be one of the following values: General, Application, Student appeal, Student form, Program, Restriction, Designation, Overaward, System Actions",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should return empty result when institution does not have any note.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
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

  it("Should return empty result when institution has notes but none of filtered note type.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    await saveFakeInstitutionNotes(
      db.dataSource,
      [createFakeNote(NoteType.General), createFakeNote(NoteType.Program)],
      institution.id,
    );
    const endpoint = `/aest/note/institution/${institution.id}?noteTypes=${NoteType.Designation}`;

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
