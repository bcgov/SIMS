import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { NoteType } from "@sims/sims-db";
import {
  createFakeNote,
  saveFakeStudentNotes,
} from "@sims/test-utils/factories/note";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  getAESTToken,
  createTestingAppModule,
} from "../../../../testHelpers";
import { transformNoteToApiReturn } from "./test-utils";

describe("NoteAESTController(e2e)-getStudentNotes", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should allow access to the expected AEST users groups.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
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

  it("Should throw NotFoundException when student was not found.", async () => {
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

  it("Should cause a bad request when a wrong note type is provided as a filter.", async () => {
    // Arrange/Act/Assert
    return request(app.getHttpServer())
      .get("/aest/note/student/999999?noteTypes=invalid_node_type")
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "each value in noteTypes must be one of the following values: General, Application, Student appeal, Student form, Program, Restriction, Designation, Overaward, System Actions",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should get an empty student notes result when student has no notes.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
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

  it("Should get all student notes types when student has notes and no note type filter was provided.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    await saveFakeStudentNotes(
      db.dataSource,
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

  it("Should get specific student notes types when student has notes and a note type filter was provided.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const expectedNote = createFakeNote(NoteType.Application);
    await saveFakeStudentNotes(
      db.dataSource,
      [
        createFakeNote(NoteType.General),
        expectedNote,
        createFakeNote(NoteType.Designation),
      ],
      student.id,
      student.user,
    );

    // Act/Assert
    return request(app.getHttpServer())
      .get(`/aest/note/student/${student.id}?noteTypes=${NoteType.Application}`)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect([transformNoteToApiReturn(expectedNote)]);
  });

  it("Should get two student notes from two different categories when the two categories are provided as a filter.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const [studentAppealNote, studentFormNote] = await saveFakeStudentNotes(
      db.dataSource,
      [
        createFakeNote(NoteType.StudentAppeal),
        createFakeNote(NoteType.StudentForm),
      ],
      student.id,
      student.user,
    );

    // Act/Assert
    return request(app.getHttpServer())
      .get(
        `/aest/note/student/${student.id}?noteTypes=${NoteType.StudentAppeal},${NoteType.StudentForm}`,
      )
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect([
        transformNoteToApiReturn(studentFormNote),
        transformNoteToApiReturn(studentAppealNote),
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
