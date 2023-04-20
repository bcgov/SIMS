import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import * as assert from "assert";
import { DataSource, Repository } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  createFakeApplication,
  saveFakeStudent,
  saveFakeStudentFileUpload,
} from "@sims/test-utils";
import { Application, Institution, InstitutionLocation } from "@sims/sims-db";

describe("StudentInstitutionsController(e2e)-getStudentFileUploads", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;
  let applicationRepo: Repository<Application>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCLocation = createFakeInstitutionLocation(collegeC);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    applicationRepo = appDataSource.getRepository(Application);
  });

  it("Should get the student file uploads when student has at least one application submitted for the institution.", async () => {
    // Student who has application submitted to institution.
    // Arrange.
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeCLocation,
      student,
    });
    await applicationRepo.save(application);

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Save fake file upload for the student.
    const studentUploadedFile = await saveFakeStudentFileUpload(appDataSource, {
      student,
      creator: student.user,
    });

    // Endpoint to test.
    const endpoint = `/institutions/student/${student.id}/documents`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          fileName: studentUploadedFile.fileName,
          uniqueFileName: studentUploadedFile.uniqueFileName,
          metadata: studentUploadedFile.metadata,
          groupName: "Ministry communications",
          updatedAt: studentUploadedFile.updatedAt.toISOString(),
          fileOrigin: studentUploadedFile.fileOrigin,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
