import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
} from "../../../../testHelpers";
import { ApplicationExceptionStatus, InstitutionLocation } from "@sims/sims-db";
import { saveFakeApplicationWithApplicationException } from "../application-exception-helper";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  saveFakeStudent,
} from "@sims/test-utils";
import { saveStudentApplicationForCollegeC } from "../../../student/_tests_/e2e/student.institutions.utils";

describe("ApplicationExceptionInstitutionsController(e2e)-getException", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it(
    "Should get the eligible application exception of a student belonging to a public " +
      "institution when the same public institution requests to see the details.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationWithApplicationException(
        db.dataSource,
        { institutionLocation: collegeFLocation },
        { applicationExceptionStatus: ApplicationExceptionStatus.Approved },
      );
      const applicationException = application.applicationException;

      const endpoint = `/institutions/application-exception/student/${application.student.id}/application/${application.id}/exception/${applicationException.id}`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          exceptionStatus: applicationException.exceptionStatus,
          submittedDate: applicationException.createdAt.toISOString(),
          exceptionRequests: applicationException.exceptionRequests.map(
            (request) => ({
              exceptionName: request.exceptionName,
              exceptionDescription: request.exceptionDescription,
            }),
          ),
        });
    },
  );

  it("Should throw not found response error when the public institution requests to see the exception details that does not exist for the institution .", async () => {
    // Arrange
    const application = await saveFakeApplicationWithApplicationException(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      { applicationExceptionStatus: ApplicationExceptionStatus.Approved },
    );
    // Submit another application to college C.
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    const collegeCLocation = createFakeInstitutionLocation({ institution });

    const collegeCApplication =
      await saveFakeApplicationWithApplicationException(
        db.dataSource,
        { institutionLocation: collegeCLocation },
        { applicationExceptionStatus: ApplicationExceptionStatus.Approved },
      );

    const endpoint = `/institutions/application-exception/student/${application.student.id}/application/${application.id}/exception/${collegeCApplication.applicationException.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Student application exception not found.",
        error: "Not Found",
      });
  });

  it("Should throw forbidden error when the institution type is not BC Public.", async () => {
    // Arrange
    // Student submitting an application to College C.
    const { student, collegeCApplication } =
      await saveStudentApplicationForCollegeC(db.dataSource);

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCApplication.location,
    );

    // College C is not a BC Public institution.
    const collegeCInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint = `/institutions/application-exception/student/${student.id}/application/${collegeCApplication.id}/exception/9999999`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(collegeCInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should throw forbidden error when student does not have at least one application submitted for the institution.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // College F is a BC Public institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/application-exception/student/${student.id}/application/9999999/exception/9999999`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
