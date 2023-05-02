import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
import {
  Application,
  FileOriginType,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import { saveStudentApplicationForCollegeC } from "./student.institutions.utils";

describe("StudentInstitutionsController(e2e)-getStudentFileUploads", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let applicationRepo: Repository<Application>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    applicationRepo = appDataSource.getRepository(Application);
  });

  it("Should get the student file uploads when student has at least one application submitted for the institution.", async () => {
    // Arrange.
    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeFLocation,
      student,
    });
    await applicationRepo.save(application);

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
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

  it("Should not get the student file uploads when student has at least one application submitted for the institution but the fileOrigin is set to Temporary", async () => {
    // Arrange.
    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeFLocation,
      student,
    });
    await applicationRepo.save(application);

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Save fake file upload for the student.
    await saveFakeStudentFileUpload(
      appDataSource,
      {
        student,
        creator: student.user,
      },
      { fileOrigin: FileOriginType.Temporary },
    );

    // Endpoint to test.
    const endpoint = `/institutions/student/${student.id}/documents`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it("Should throw forbidden error when the institution type is not BC Public.", async () => {
    // Arrange
    const { student, collegeCApplication } =
      await saveStudentApplicationForCollegeC(appDataSource);

    // Save fake file upload for the student.
    await saveFakeStudentFileUpload(
      appDataSource,
      {
        student,
        creator: student.user,
      },
      { fileOrigin: FileOriginType.Temporary },
    );

    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCApplication.location,
    );

    // College C is not a BC Public institution.
    const collegeCInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    const endpoint = `/institutions/student/${student.id}/documents`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(collegeCInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  it("Should throw forbidden error when student does not have at least one application submitted for the institution.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);

    // College F is a BC Public institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/student/${student.id}/documents`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
