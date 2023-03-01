import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createFakeStudent, createFakeUser } from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import { NoteType, Student, User } from "@sims/sims-db";
import {
  createFakeNote,
  saveFakeStudentNotes,
} from "@sims/test-utils/factories/note";
import { NoteAPIOutDTO } from "../../models/note.dto";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  getAESTToken,
  createTestingAppModule,
} from "../../../../testHelpers";

describe("NoteAESTController(e2e)-getStudentNotes", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let studentRepo: Repository<Student>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    studentRepo = dataSource.getRepository(Student);
    userRepo = dataSource.getRepository(User);
  });

  it("Should allow access to the expected AEST users groups", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/note/student/${student.id}`;
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
    const student = await studentRepo.save(createFakeStudent());
    await saveFakeStudentNotes(
      appDataSource,
      [createFakeNote(NoteType.General), createFakeNote(NoteType.System)],
      student.id,
    );

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
    const expectedNote = createFakeNote(NoteType.Application);
    await saveFakeStudentNotes(
      appDataSource,
      [
        createFakeNote(NoteType.General),
        expectedNote,
        createFakeNote(NoteType.Designation),
      ],
      student.id,
      user,
    );

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
