import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { FileOriginType, Student } from "@sims/sims-db";

const MAX_FILE_SIZE = Number(process.env.FILE_UPLOAD_MAX_FILE_SIZE);

describe("StudentAESTController(e2e)-uploadFile", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let student: Student;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    student = await saveFakeStudent(db.dataSource);
  });

  it("Should upload the file when the file passes all validations.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const uniqueFileName = `supporting-document-${student.id}.pdf`;
    const fileName = "supporting-document.pdf";
    const groupName = "Supporting documents";
    const fileContent = Buffer.from("PDF content");

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(student.id))
      .auth(token, BEARER_AUTH_TYPE)
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
    const student = await saveFakeStudent(db.dataSource);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const uniqueFileName = `empty-file-${student.id}.pdf`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(student.id))
      .auth(token, BEARER_AUTH_TYPE)
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
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const uniqueFileName = `too-large-file-${student.id}.pdf`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(student.id))
      .auth(token, BEARER_AUTH_TYPE)
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

  it("Should reject the upload when the file extension is invalid.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const uniqueFileName = `invalid-file-extension-${student.id}.mp4`;
    const fileContent = Buffer.from("MP4 content");

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(student.id))
      .auth(token, BEARER_AUTH_TYPE)
      .field("uniqueFileName", uniqueFileName)
      .field("group", "Supporting documents")
      .attach("file", fileContent, {
        filename: "invalid-file-extension.mp4",
        contentType: "video/mp4",
      })
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: "Provided file type is not allowed.",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a NotFoundException when the student does not exist.", async () => {
    // Arrange
    const studentId = 999999999;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const uniqueFileName = `missing-student-${studentId}.pdf-guid`;
    const fileContent = Buffer.from("PDF content");

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint(studentId))
      .auth(token, BEARER_AUTH_TYPE)
      .field("uniqueFileName", uniqueFileName)
      .field("group", "Supporting documents")
      .attach("file", fileContent, {
        filename: "missing-student.pdf",
        contentType: "application/pdf",
      })
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Student was not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get the upload endpoint for a specific student.
 * @param studentId student identifier.
 * @returns upload endpoint for the student.
 */
function getEndpoint(studentId: number): string {
  return `/aest/student/${studentId}/files`;
}
