import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createE2EDataSources,
  createFakeInstitutionLocation,
  E2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
  saveFakeStudentRestriction,
} from "@sims/test-utils";
import {
  InstitutionLocation,
  Note,
  NoteType,
  RestrictionNotificationType,
} from "@sims/sims-db";
import {
  createFakeNote,
  saveFakeStudentNotes,
} from "@sims/test-utils/factories/note";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
} from "../../../../testHelpers";

describe("NoteInstitutionsController(e2e)-getStudentNotes", () => {
  let app: INestApplication;
  let collegeFLocation: InstitutionLocation;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);

    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should get all note types for a student when they are available.", async () => {
    // Arrange
    // Create new application.
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });

    const student = savedApplication.student;
    const fakeNotes = Object.values(NoteType).map((nodeType) =>
      createFakeNote(nodeType),
    );
    const savedNotes = await saveFakeStudentNotes(
      db.dataSource,
      fakeNotes,
      student.id,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/note/student/${student.id}`;

    // Act/Assert
    const expectedAPIReturnNotes = savedNotes
      .slice()
      .reverse()
      .map((savedNote) => noteToApiReturn(savedNote));
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(expectedAPIReturnNotes);
  });

  it("Should throw Forbidden when student does not exist.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    //Act/Assert
    return request(app.getHttpServer())
      .get("/institutions/note/student/999999")
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: 403,
        message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should throw Forbidden when student exists but does not have an application for the institution.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const student = await saveFakeStudent(db.dataSource);
    const endpoint = `/institutions/note/student/${student.id}`;

    //Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: 403,
        message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should cause a bad request when a wrong note type is provided as a filter.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    const student = savedApplication.student;
    await saveFakeStudentNotes(
      db.dataSource,
      [createFakeNote(NoteType.General)],
      student.id,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/note/student/${student.id}?noteType=invalid_node_type`;

    //Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: 400,
        message: "Validation failed (enum string is expected)",
        error: "Bad Request",
      });
  });

  it("Should get an empty student notes result when student has no notes.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    const student = savedApplication.student;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/note/student/${student.id}`;

    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({});
  });

  it("Should get specific student notes types when student has notes and a note type filter was provided.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });

    const student = savedApplication.student;
    const expectedNote = createFakeNote(NoteType.Application);
    await saveFakeStudentNotes(
      db.dataSource,
      [
        createFakeNote(NoteType.General),
        expectedNote,
        createFakeNote(NoteType.Designation),
      ],
      student.id,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/note/student/${student.id}?noteType=${NoteType.Application}`;

    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([noteToApiReturn(expectedNote)]);
  });

  it("Should not get notes for student restriction and resolution notes with notification type 'no effect' when any are available.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    const student = savedApplication.student;

    // Get any restriction with notification type "No effect".
    const notificationTypeNoEffectRestriction = await db.restriction.findOne({
      where: {
        notificationType: RestrictionNotificationType.NoEffect,
      },
    });

    // Creates student restriction and resolution notes
    await saveFakeStudentRestriction(db.dataSource, {
      student,
      restriction: notificationTypeNoEffectRestriction,
      application: savedApplication,
    });

    const [generalNote, designationNote] = await saveFakeStudentNotes(
      db.dataSource,
      [createFakeNote(NoteType.Designation), createFakeNote(NoteType.General)],
      student.id,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/note/student/${student.id}`;

    // Act/Assert
    return request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([noteToApiReturn(designationNote), noteToApiReturn(generalNote)]);
  });

  /**
   * Transform a Note object to the object returned by the API.
   * @param note note to be transformed.
   * @returns an object item for the notes returned by the API.
   */
  function noteToApiReturn(note: Note) {
    return {
      noteType: note.noteType,
      description: note.description,
      firstName: note.creator.firstName,
      lastName: note.creator.lastName,
      createdAt: note.createdAt.toISOString(),
    };
  }

  afterAll(async () => {
    await app?.close();
  });
});
