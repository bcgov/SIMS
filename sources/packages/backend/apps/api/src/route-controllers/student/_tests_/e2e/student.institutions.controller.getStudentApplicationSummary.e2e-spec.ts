import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createFakeLocation,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeStudent,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import { FieldSortOrder } from "@sims/utilities";
import { saveStudentApplicationForCollegeC } from "./student.institutions.utils";

describe("StudentInstitutionsController(e2e)-getStudentApplicationSummary", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let applicationRepo: Repository<Application>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    applicationRepo = appDataSource.getRepository(Application);
  });

  it(
    "Should get the student application details as summary when student has a submitted application" +
      "for the institution (application with location id saved).",
    async () => {
      // Arrange

      // Student has a submitted application to the institution.
      const student = await saveFakeStudent(appDataSource);

      const savedApplication = await saveFakeApplication(appDataSource, {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      });

      const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              id: savedApplication.id,
              applicationNumber: savedApplication.applicationNumber,
              studyStartPeriod:
                savedApplication.currentAssessment.offering.studyStartDate,
              studyEndPeriod:
                savedApplication.currentAssessment.offering.studyEndDate,
              status: savedApplication.applicationStatus,
              parentApplicationId: savedApplication.id,
              submittedDate: savedApplication.submittedDate.toISOString(),
              isChangeRequestAllowed: false,
            },
          ],
          count: 1,
        });
    },
  );

  it(
    "Should get the student application details belonging to the requested institution as summary when student has a submitted application " +
      "for the institution and another submitted application for another institution.",
    async () => {
      // Arrange

      // Student has a submitted application to the institution.
      const student = await saveFakeStudent(appDataSource);
      // Application 1 for college F.
      const savedApplication1 = await saveFakeApplication(appDataSource, {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      });

      // Application 2 for another college.
      const fakeInstitutionLocation = createFakeLocation();
      await saveFakeApplication(appDataSource, {
        institutionLocation: fakeInstitutionLocation,
        student,
      });

      const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              id: savedApplication1.id,
              applicationNumber: savedApplication1.applicationNumber,
              studyStartPeriod:
                savedApplication1.currentAssessment.offering.studyStartDate,
              studyEndPeriod:
                savedApplication1.currentAssessment.offering.studyEndDate,
              status: savedApplication1.applicationStatus,
              parentApplicationId: savedApplication1.id,
              submittedDate: savedApplication1.submittedDate.toISOString(),
              isChangeRequestAllowed: false,
            },
          ],
          count: 1,
        });
    },
  );

  it(
    "Should get the first submitted student application details as summary when student has two submitted/Inprogress " +
      "application for the institution when pagination is 1.",
    async () => {
      // Arrange

      // Student has one submitted and one inprogress application to the institution.
      const student = await saveFakeStudent(appDataSource);
      // Application 1.
      const savedApplication1 = await saveFakeApplication(appDataSource, {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      });

      // Application 2.
      await saveFakeApplication(
        appDataSource,
        {
          institution: collegeF,
          institutionLocation: collegeFLocation,
          student,
        },
        { applicationStatus: ApplicationStatus.InProgress },
      );

      // By default the application is sorted by status.
      const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=1`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              id: savedApplication1.id,
              applicationNumber: savedApplication1.applicationNumber,
              studyStartPeriod:
                savedApplication1.currentAssessment.offering.studyStartDate,
              studyEndPeriod:
                savedApplication1.currentAssessment.offering.studyEndDate,
              status: savedApplication1.applicationStatus,
              parentApplicationId: savedApplication1.id,
              submittedDate: savedApplication1.submittedDate.toISOString(),
              isChangeRequestAllowed: false,
            },
          ],
          count: 2,
        });
    },
  );

  it(
    `Should get all the two student application details in ${FieldSortOrder.DESC} order of application number ` +
      "as summary when student has two submitted/Inprogress application for the institution " +
      `and when sortField= is application number and sortOrder is ${FieldSortOrder.DESC}. `,
    async () => {
      // Arrange

      // Student has a submitted application to the institution.
      const student = await saveFakeStudent(appDataSource);
      // Application 1.
      const savedApplication1 = await saveFakeApplication(appDataSource, {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      });

      // Application 2.
      const savedApplication2 = await saveFakeApplication(
        appDataSource,
        {
          institution: collegeF,
          institutionLocation: collegeFLocation,
          student,
        },
        { applicationStatus: ApplicationStatus.InProgress },
      );

      savedApplication1.applicationNumber = "1000000000";
      savedApplication2.applicationNumber = "1000000001";
      await applicationRepo.save([savedApplication1, savedApplication2]);

      const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              id: savedApplication2.id,
              applicationNumber: savedApplication2.applicationNumber,
              studyStartPeriod:
                savedApplication2.currentAssessment.offering.studyStartDate,
              studyEndPeriod:
                savedApplication2.currentAssessment.offering.studyEndDate,
              status: savedApplication2.applicationStatus,
              parentApplicationId: savedApplication2.id,
              submittedDate: savedApplication2.submittedDate.toISOString(),
              isChangeRequestAllowed: false,
            },
            {
              id: savedApplication1.id,
              applicationNumber: savedApplication1.applicationNumber,
              studyStartPeriod:
                savedApplication1.currentAssessment.offering.studyStartDate,
              studyEndPeriod:
                savedApplication1.currentAssessment.offering.studyEndDate,
              status: savedApplication1.applicationStatus,
              parentApplicationId: savedApplication1.id,
              submittedDate: savedApplication1.submittedDate.toISOString(),
              isChangeRequestAllowed: false,
            },
          ],
          count: 2,
        });
    },
  );

  it("Should throw forbidden error when the institution type is not BC Public.", async () => {
    // Arrange
    // Student submitting an application to College C.
    const { student, collegeCApplication } =
      await saveStudentApplicationForCollegeC(appDataSource);

    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCApplication.location,
    );

    // College C is not a BC Public institution.
    const collegeCInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;

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
    const student = await saveFakeStudent(appDataSource);

    // College F is a BC Public institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10&sortField=applicationNumber&sortOrder=${FieldSortOrder.DESC}`;

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
