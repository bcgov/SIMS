import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createFakeStudent } from "@sims/test-utils";
import { Repository } from "typeorm";
import { Note, NoteType, Student } from "@sims/sims-db";
import { NoteAPIInDTO } from "../../models/note.dto";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  getAESTToken,
  createTestingAppModule,
} from "../../../../testHelpers";

describe("NoteAESTController(e2e)-addStudentNotes", () => {
  let app: INestApplication;
  let studentRepo: Repository<Student>;
  let noteRepo: Repository<Note>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    studentRepo = dataSource.getRepository(Student);
    noteRepo = dataSource.getRepository(Note);
  });

  it("Should allow create student notes when the user belongs to expected AEST users groups", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/note/student/${student.id}`;
    const note = {
      noteType: NoteType.General,
      description: "Test note.",
    } as NoteAPIInDTO;
    let createdNoteId: number;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(note)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.CREATED)
      .then((response) => {
        createdNoteId = response.body.id;
      });
    const createdNote = await noteRepo.findOne({
      select: { noteType: true, description: true },
      where: { id: createdNoteId },
    });
    expect(createdNote.noteType).toBe(note.noteType);
    expect(createdNote.description).toBe(note.description);
  });

  it("Should throw forbidden error when the user does not belong to expected AEST users groups", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/note/student/${student.id}`;
    const note = {
      noteType: NoteType.General,
      description: "Test note.",
    } as NoteAPIInDTO;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(note)
      .auth(await getAESTToken(), BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN);
  });

  it("Should throw not found error when student id is not valid", async () => {
    // Arrange
    const endpoint = `/aest/note/student/99999`;
    const note = {
      noteType: NoteType.General,
      description: "Test note.",
    } as NoteAPIInDTO;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(note)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Student not found.",
        error: "Not Found",
      });
  });

  it("Should throw bad request error when note type is not valid", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/note/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({ noteType: "invalid note type", description: "test note." })
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "noteType must be one of the following values: General, Application, Program, Restriction, Designation, System Actions",
        ],
        error: "Bad Request",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
