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
import { Readable } from "stream";
import { ObjectStorageService } from "@sims/integrations/object-storage";

const DUMMY_FILE_CONTENT = "Some dummy file content.";

describe("StudentAESTController(e2e)-getUploadedFile", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let objectStorageServiceMock: ObjectStorageService;

  beforeAll(async () => {
    const {
      nestApplication,
      dataSource,
      objectStorageServiceMock: objectStorageServiceFromAppModule,
    } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    objectStorageServiceMock = objectStorageServiceFromAppModule;
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
    const buffer = Buffer.from(DUMMY_FILE_CONTENT);
    const stream = Readable.from(buffer);
    objectStorageServiceMock.getObject = jest.fn(() => {
      return Promise.resolve({
        contentLength: DUMMY_FILE_CONTENT.length,
        contentType: "text/html; charset=utf-8",
        body: stream,
      });
    });
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/files/${studentFile.uniqueFileName}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.headers["content-disposition"]).toBe(
          `attachment; filename=${studentFile.fileName}`,
        );
        expect(response.text).toStrictEqual(DUMMY_FILE_CONTENT);
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
