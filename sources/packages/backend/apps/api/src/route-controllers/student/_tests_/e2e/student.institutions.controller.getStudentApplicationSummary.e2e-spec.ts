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
  saveFakeStudent,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
  StudentAssessment,
} from "@sims/sims-db";
import { FieldSortOrder } from "@sims/utilities";

describe("StudentInstitutionsController(e2e)-getStudentApplicationSummary", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let applicationRepo: Repository<Application>;
  let studentAssessmentRepo: Repository<StudentAssessment>;
  let institutionLocationRepo: Repository<InstitutionLocation>;
  let educationProgramOfferingRepo: Repository<EducationProgramOffering>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    // College C.
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
    studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
    educationProgramOfferingRepo = dataSource.getRepository(
      EducationProgramOffering,
    );
    institutionLocationRepo = dataSource.getRepository(InstitutionLocation);
  });

  it("Should get the student application details as summary when student has a submitted application \
  for the institution (application with location id saved).", async () => {
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
            applicationName: "Financial Aid Application",
            status: savedApplication.applicationStatus,
          },
        ],
        count: 1,
      });
  });

  it("Should get the first submitted student application details as summary when student has two submitted/Inprogress \
  application for the institution (application with location id saved) when pagination is 1.", async () => {
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
            applicationName: "Financial Aid Application",
            status: savedApplication1.applicationStatus,
          },
        ],
        count: 2,
      });
  });

  it(`Should get all the two student application details in ${FieldSortOrder.DESC} order of application number \
  as summary when student has two submitted/Inprogress application for the institution (application with location id saved)\
  and when sortField= is application number and sortOrder is ${FieldSortOrder.DESC}. `, async () => {
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
            applicationName: "Financial Aid Application",
            status: savedApplication2.applicationStatus,
          },
          {
            id: savedApplication1.id,
            applicationNumber: savedApplication1.applicationNumber,
            studyStartPeriod:
              savedApplication1.currentAssessment.offering.studyStartDate,
            studyEndPeriod:
              savedApplication1.currentAssessment.offering.studyEndDate,
            applicationName: "Financial Aid Application",
            status: savedApplication1.applicationStatus,
          },
        ],
        count: 2,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
