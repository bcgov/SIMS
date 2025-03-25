import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  AESTGroups,
} from "../../../../testHelpers";
import {
  saveFakeStudent,
  saveFakeStudentFileUpload,
  saveFakeApplication,
} from "@sims/test-utils";
import { getUserFullName } from "../../../../utilities";

describe("StudentAESTController(e2e)-getStudentFileUploads", () => {
  let app: INestApplication;
  let appDataSource: DataSource;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
  });

  it("Should get the student file uploads when student has at least one file upload.", async () => {
    // Arrange.
    // Student who has application submitted.
    const student = await saveFakeStudent(appDataSource);
    await saveFakeApplication(appDataSource, {
      student,
    });

    // Ministry user token.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Save fake file upload for the student.
    const studentUploadedFile = await saveFakeStudentFileUpload(appDataSource, {
      student,
      creator: student.user,
    });

    // Endpoint to test.
    const endpoint = `/aest/student/${student.id}/documents`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          fileName: studentUploadedFile.fileName,
          uniqueFileName: studentUploadedFile.uniqueFileName,
          metadata: studentUploadedFile.metadata,
          groupName: "Ministry communications",
          createdAt: studentUploadedFile.updatedAt.toISOString(),
          fileOrigin: studentUploadedFile.fileOrigin,
          uploadedBy: getUserFullName({
            firstName: student.user.firstName,
            lastName: student.user.lastName,
          }),
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
