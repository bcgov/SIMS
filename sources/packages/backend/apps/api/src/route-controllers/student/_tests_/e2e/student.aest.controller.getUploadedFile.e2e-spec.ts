import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentFileUpload,
  saveFakeStudentFileUpload,
} from "@sims/test-utils";
import {
  FILE_HAS_NOT_BEEN_SCANNED_YET,
  VIRUS_DETECTED,
} from "../../../../constants";
import { VirusScanStatus } from "@sims/sims-db";
import { S3_DEFAULT_MOCKED_FILE_CONTENT } from "@sims/test-utils/mocks";

describe("StudentAESTController(e2e)-getUploadedFile", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should throw a HttpStatus Not Found (404) error when a file is not found.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/files/inexistent_file.txt`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message:
          "Requested file was not found or the user does not have access to it.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when a file has not been scanned yet.", async () => {
    // Arrange
    const studentFile = await saveFakeStudentFileUpload(db.dataSource);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/files/${studentFile.uniqueFileName}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message:
          "This file has not been scanned and will be available to download once it is determined to be safe.",
        errorType: FILE_HAS_NOT_BEEN_SCANNED_YET,
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when a file scanning has not finished", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.InProgress;
    await db.studentFile.save(studentFile);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/files/${studentFile.uniqueFileName}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message:
          "This file has not been scanned and will be available to download once it is determined to be safe.",
        errorType: FILE_HAS_NOT_BEEN_SCANNED_YET,
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when a file is flagged as infected.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.VirusDetected;
    await db.studentFile.save(studentFile);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/files/${studentFile.uniqueFileName}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message:
          "The original file was deleted due to security rules. Please re-check file and attempt to upload again.",
        errorType: VIRUS_DETECTED,
      });
  });

  it("Should download the file when a file is flagged as clean.", async () => {
    // Arrange
    const studentFile = createFakeStudentFileUpload();
    studentFile.virusScanStatus = VirusScanStatus.FileIsClean;
    studentFile.fileName = "test.jpeg";
    await db.studentFile.save(studentFile);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/files/${studentFile.uniqueFileName}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.headers["content-disposition"]).toBe(
          `attachment; filename=${encodeURIComponent(studentFile.fileName)}`,
        );
        expect(response.text).toStrictEqual(S3_DEFAULT_MOCKED_FILE_CONTENT);
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
