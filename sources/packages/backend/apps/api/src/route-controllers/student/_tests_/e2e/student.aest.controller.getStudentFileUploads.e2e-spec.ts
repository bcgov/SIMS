import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  InstitutionTokenTypes,
  getAESTToken,
  AESTGroups,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeStudent,
  saveFakeStudentFileUpload,
  saveFakeApplication,
} from "@sims/test-utils";
import { Institution, InstitutionLocation } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";

describe("StudentAESTController(e2e)-getStudentFileUploads", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should get the student file uploads when student has at least one application submitted.", async () => {
    // Arrange.
    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);
    await saveFakeApplication(appDataSource, {
      institutionLocation: collegeFLocation,
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
