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

describe("NoteAESTController(e2e)-getStudentNotes", () => {
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

  afterAll(async () => {
    await app?.close();
  });
});
