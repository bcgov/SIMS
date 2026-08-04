import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { FileOriginType, Student } from "@sims/sims-db";
import { TestingModule } from "@nestjs/testing";

const MAX_FILE_SIZE = Number(process.env.FILE_UPLOAD_MAX_FILE_SIZE);

describe("StudentStudentsController(e2e)-uploadFile", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let student: Student;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    student = await saveFakeStudent(db.dataSource);
  });

  it("Should upload the file when the file passes all validations.", async () => {
    // Arrange
    await mockUserLoginInfo(appModule, student);
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const uniqueFileName = `supporting-document-${student.id}.pdf`;
    const fileName = "supporting-document.pdf";
    const groupName = "Supporting documents";
    const fileContent = Buffer.from("PDF content");

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(studentToken, BEARER_AUTH_TYPE)
      .field("uniqueFileName", uniqueFileName)
      .field("group", groupName)
      .attach("file", fileContent, {
        filename: fileName,
        contentType: "application/pdf",
      })
      .expect(HttpStatus.CREATED)
      .expect({
        fileName,
        uniqueFileName,
        url: `student/files/${uniqueFileName}`,
        size: fileContent.length,
        mimetype: "application/pdf",
      });

    // Assert
    const createdStudentFile = await db.studentFile.findOne({
      select: {
        id: true,
        fileName: true,
        uniqueFileName: true,
        fileOrigin: true,
        groupName: true,
        student: {
          id: true,
        },
      },
      relations: {
        student: true,
      },
      where: {
        uniqueFileName,
      },
    });
    expect(createdStudentFile).toMatchObject({
      id: expect.any(Number),
      fileName,
      uniqueFileName,
      fileOrigin: FileOriginType.Temporary,
      groupName,
      student: {
        id: student.id,
      },
    });
  });

  it("Should reject the upload when the file is smaller than the minimum allowed size.", async () => {
    // Arrange
    await mockUserLoginInfo(appModule, student);
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const uniqueFileName = `empty-file-${student.id}.pdf`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(studentToken, BEARER_AUTH_TYPE)
      .field("uniqueFileName", uniqueFileName)
      .field("group", "Supporting documents")
      .attach("file", Buffer.alloc(0), {
        filename: "empty-file.pdf",
        contentType: "application/pdf",
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "File must be at least 1 byte(s).",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should reject the upload when the file is larger than the maximum allowed size.", async () => {
    // Arrange
    await mockUserLoginInfo(appModule, student);
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const uniqueFileName = `too-large-file-${student.id}.pdf`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(studentToken, BEARER_AUTH_TYPE)
      .field("uniqueFileName", uniqueFileName)
      .field("group", "Supporting documents")
      .attach("file", Buffer.alloc(MAX_FILE_SIZE + 1, "a"), {
        filename: "too-large-file.pdf",
        contentType: "application/pdf",
      })
      .expect(HttpStatus.PAYLOAD_TOO_LARGE)
      .expect({
        message: "File too large",
        error: "Payload Too Large",
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the student upload endpoint.
 * @returns student upload endpoint.
 */
function getEndpoint(): string {
  return "/students/student/files";
}
