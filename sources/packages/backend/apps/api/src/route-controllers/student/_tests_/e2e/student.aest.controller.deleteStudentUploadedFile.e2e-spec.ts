import { HttpStatus, INestApplication } from "@nestjs/common";
import MockDate from "mockdate";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
  saveFakeStudentFileUpload,
} from "@sims/test-utils";
import { FileOriginType, User } from "@sims/sims-db";
import { STUDENT_FILE_IS_DELETED } from "../../../../constants";

describe("StudentAESTController(e2e)-deleteStudentUploadedFile.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    ministryUser = { id: auditUser.id } as User;
  });

  beforeEach(() => {
    MockDate.reset();
  });

  it("Should delete a non-temporary file when the file exists and is not deleted.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const studentFile = await saveFakeStudentFileUpload(
      db.dataSource,
      {
        student,
        creator: student.user,
      },
      {
        fileOrigin: FileOriginType.Ministry,
      },
    );
    const now = new Date();
    MockDate.set(now);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/file/${studentFile.uniqueFileName}`;

    // Act
    await request(app.getHttpServer())
      .delete(endpoint)
      .send({
        noteDescription: "Delete ministry uploaded file.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    const updatedStudentFile = await db.studentFile.findOne({
      select: {
        id: true,
        deletedAt: true,
        modifier: { id: true },
        updatedAt: true,
      },
      relations: {
        modifier: true,
      },
      where: {
        id: studentFile.id,
      },
      withDeleted: true,
    });
    expect(updatedStudentFile).toEqual({
      id: studentFile.id,
      deletedAt: now,
      modifier: ministryUser,
      updatedAt: now,
    });
  });

  it("Should throw a NotFoundException when trying to delete a file that does not exist for the student.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/file/inexistent-file-name`;

    // Act/Assert
    await request(app.getHttpServer())
      .delete(endpoint)
      .send({
        noteDescription: "Delete inexistent file.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Student file not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw an UnprocessableEntityException when trying to delete a file that is already deleted.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const studentFile = await saveFakeStudentFileUpload(
      db.dataSource,
      {
        student,
        creator: student.user,
      },
      {
        fileOrigin: FileOriginType.Ministry,
        deletedAt: new Date(),
      },
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/file/${studentFile.uniqueFileName}`;

    // Act/Assert
    await request(app.getHttpServer())
      .delete(endpoint)
      .send({
        noteDescription: "Delete already deleted file.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Student file is already set as deleted.",
        errorType: STUDENT_FILE_IS_DELETED,
      });
  });

  it("Should throw a NotFoundException when trying to delete a temporary file.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const studentFile = await saveFakeStudentFileUpload(
      db.dataSource,
      {
        student,
        creator: student.user,
      },
      {
        fileOrigin: FileOriginType.Temporary,
      },
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/file/${studentFile.uniqueFileName}`;

    // Act/Assert
    await request(app.getHttpServer())
      .delete(endpoint)
      .send({
        noteDescription: "Delete temporary file.",
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Student file not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });

    // Assert
    const updatedStudentFile = await db.studentFile.findOne({
      select: {
        id: true,
        deletedAt: true,
      },
      where: {
        id: studentFile.id,
      },
      withDeleted: true,
    });
    expect(updatedStudentFile).toEqual({
      id: studentFile.id,
      deletedAt: null,
    });
  });

  it("Should throw a BadRequestException when the payload is missing the mandatory note description.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/file/inexistent-file-name`;

    // Act/Assert
    await request(app.getHttpServer())
      .delete(endpoint)
      .send({
        noteDescription: null,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "noteDescription must be shorter than or equal to 1000 characters",
          "noteDescription should not be empty",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
