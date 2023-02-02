require("../../../../../../../env_setup");
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createFakeStudent, createFakeUser } from "@sims/test-utils";
import { Repository } from "typeorm";
import { Note, NoteType, Student, User } from "@sims/sims-db";
import { createFakeNote } from "@sims/test-utils/factories/note";
import { NoteAPIOutDTO } from "../../models/note.dto";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  getAESTToken,
  createTestingAppModule,
  assertGroupAccess,
} from "../../../../testHelpers";

jest.setTimeout(60000);

describe("NoteAESTController(e2e)-getStudentNotes", () => {
  let app: INestApplication;
  let studentRepo: Repository<Student>;
  let noteRepo: Repository<Note>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    studentRepo = dataSource.getRepository(Student);
    noteRepo = dataSource.getRepository(Note);
    userRepo = dataSource.getRepository(User);
  });

  it("Should allow access to the expected AEST users groups", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/note/student/${student.id}`;
    await assertGroupAccess(
      app,
      endpoint,
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
    );
  });

  it("Should throw NotFoundException when student was not found", async () => {
    // Arrange/Act/Assert
    return request(app.getHttpServer())
      .get("/aest/note/student/999999")
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

  it("Should cause a bad request when a wrong note type is provided as a filter", async () => {
    // Arrange/Act/Assert
    return request(app.getHttpServer())
      .get("/aest/note/student/999999?noteType=invalid_node_type")
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: 400,
        message: "Validation failed (enum string is expected)",
        error: "Bad Request",
      });
  });

  it("Should get an empty student notes result when student has no notes", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    // Act/Assert
    return request(app.getHttpServer())
      .get(`/aest/note/student/${student.id}`)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(Object.keys(response.body)).toHaveLength(0);
      });
  });

  it("Should get all student notes types when student has notes and no note type filter was provided", async () => {
    // Arrange
    const user = await userRepo.save(createFakeUser());
    const student = await studentRepo.save(createFakeStudent(user));
    const note = await noteRepo.save([
      createFakeNote(NoteType.General, { creator: user }),
      createFakeNote(NoteType.System, { creator: user }),
    ]);
    await studentRepo
      .createQueryBuilder()
      .relation(Student, "notes")
      .of(student)
      .add(note);
    // Act/Assert
    return request(app.getHttpServer())
      .get(`/aest/note/student/${student.id}`)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toHaveLength(2);
      });
  });

  it("Should get specific student notes types when student has notes and a note type filter was provided", async () => {
    // Arrange
    const user = await userRepo.save(createFakeUser());
    const student = await studentRepo.save(createFakeStudent(user));
    const expectedNote = createFakeNote(NoteType.Application, {
      creator: user,
    });
    const note = await noteRepo.save([
      createFakeNote(NoteType.General, { creator: user }),
      expectedNote,
      createFakeNote(NoteType.Designation, { creator: user }),
    ]);
    await studentRepo
      .createQueryBuilder()
      .relation(Student, "notes")
      .of(student)
      .add(note);
    // Act/Assert
    return request(app.getHttpServer())
      .get(`/aest/note/student/${student.id}?noteType=${NoteType.Application}`)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        const note = response.body[0] as NoteAPIOutDTO;
        expect(note.noteType).toBe(NoteType.Application);
        expect(note.description).toBe(expectedNote.description);
        expect(note.firstName).toBe(user.firstName);
        expect(note.lastName).toBe(user.lastName);
        expect(new Date(note.createdAt)).toStrictEqual(expectedNote.createdAt);
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
