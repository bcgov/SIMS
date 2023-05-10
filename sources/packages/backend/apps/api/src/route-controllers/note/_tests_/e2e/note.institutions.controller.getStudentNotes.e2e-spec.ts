import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeUser,
  E2EDataSources,
  saveFakeApplication,
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

  it("Should get all note types for a student when student they are available.", async () => {
    // Arrange
    // Create new application.
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });

    const student = savedApplication.student;
    const [
      generalNotes,
      systemNotes,
      applicationNotes,
      designationNotes,
      overawardNotes,
      programNotes,
      restrictionNotes,
    ] = await saveFakeStudentNotes(
      db.dataSource,
      [
        createFakeNote(NoteType.General),
        createFakeNote(NoteType.System),
        createFakeNote(NoteType.Application),
        createFakeNote(NoteType.Designation),
        createFakeNote(NoteType.Overaward),
        createFakeNote(NoteType.Program),
        createFakeNote(NoteType.Restriction),
      ],
      student.id,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/note/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect([
        noteToApiReturn(restrictionNotes),
        noteToApiReturn(programNotes),
        noteToApiReturn(overawardNotes),
        noteToApiReturn(designationNotes),
        noteToApiReturn(applicationNotes),
        noteToApiReturn(systemNotes),
        noteToApiReturn(generalNotes),
      ]);
  });

  it("Should throw NotFoundException when student was not found.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    //Act/Assert
    return request(app.getHttpServer())
      .get("/institutions/note/student/999999")
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Student not found.",
        error: "Not Found",
      });
  });

  it("Should cause a bad request when a wrong note type is provided as a filter.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    //Act/Assert
    return request(app.getHttpServer())
      .get("/institutions/note/student/999999?noteType=invalid_node_type")
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

    // Act/Assert
    return request(app.getHttpServer())
      .get(`/institutions/note/student/${student.id}`)
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
    const user = await db.user.save(createFakeUser());
    const expectedNote = createFakeNote(NoteType.Application);
    await saveFakeStudentNotes(
      db.dataSource,
      [
        createFakeNote(NoteType.General),
        expectedNote,
        createFakeNote(NoteType.Designation),
      ],
      student.id,
      user,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    return request(app.getHttpServer())
      .get(
        `/institutions/note/student/${student.id}?noteType=${NoteType.Application}`,
      )
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([noteToApiReturn(expectedNote)]);
  });

  it("Should not get notes for student restriction with notification type 'no effect' when any are available.", async () => {
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
    await saveFakeStudentRestriction(db.dataSource, {
      student,
      restriction: notificationTypeNoEffectRestriction,
      application: savedApplication,
    });
    const user = await db.user.save(createFakeUser());
    const [generalNote, designationNote] = await saveFakeStudentNotes(
      db.dataSource,
      [createFakeNote(NoteType.Designation), createFakeNote(NoteType.General)],
      student.id,
      user,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    return request(app.getHttpServer())
      .get(`/institutions/note/student/${student.id}`)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([noteToApiReturn(designationNote), noteToApiReturn(generalNote)]);
  });

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
