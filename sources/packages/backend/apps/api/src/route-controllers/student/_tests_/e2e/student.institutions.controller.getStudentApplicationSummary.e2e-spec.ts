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
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  createFakeApplication,
  saveFakeStudent,
  createFakeStudentAssessment,
  createFakeEducationProgramOffering,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  StudentAssessment,
} from "@sims/sims-db";

describe("StudentInstitutionsController(e2e)-getStudentApplicationSummary", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;
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
    studentAssessmentRepo = dataSource.getRepository(StudentAssessment);
    educationProgramOfferingRepo = dataSource.getRepository(
      EducationProgramOffering,
    );
    institutionLocationRepo = dataSource.getRepository(InstitutionLocation);
  });

  it("Should get the student application details as summary when student has a submitted application for the institution (application with location id saved).", async () => {
    // Arrange

    // Student has a submitted application to the institution.
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeCLocation,
      student,
    });
    const savedApplication = await applicationRepo.save(application);
    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      auditUser: student.user,
    });
    fakeOriginalAssessment.application = savedApplication;
    // Offering.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: student.user,
    });
    fakeOffering.offeringIntensity = OfferingIntensity.fullTime;
    const savedOffering = await educationProgramOfferingRepo.save(fakeOffering);
    fakeOriginalAssessment.offering = savedOffering;
    const savedOriginalAssessment = await studentAssessmentRepo.save(
      fakeOriginalAssessment,
    );
    savedApplication.currentAssessment = savedOriginalAssessment;
    await applicationRepo.save(savedApplication);

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: application.id,
            applicationNumber: application.applicationNumber,
            studyStartPeriod:
              application.currentAssessment.offering.studyStartDate,
            studyEndPeriod: application.currentAssessment.offering.studyEndDate,
            applicationName: "Financial Aid Application",
            status: application.applicationStatus,
          },
        ],
        count: 1,
      });
  });

  it("Should get an empty array as application summary when student has a draft application for the institution (application without the location id saved(i.e draft/cancelled draft status)).", async () => {
    // Arrange

    // Student has a draft application to the institution.
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      student,
    });
    application.data.selectedLocation = collegeCLocation.id;
    application.applicationStatus = ApplicationStatus.Draft;
    await applicationRepo.save(application);

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [],
        count: 0,
      });
  });

  it("Should get an empty array as application summary when student has a submitted application in a different location.", async () => {
    // Arrange

    // Student has a submitted application in a different location.
    const student = await saveFakeStudent(appDataSource);
    const fakeInstitutionLocation = createFakeLocation();
    const saveFakeInstitutionLocation = await institutionLocationRepo.save(
      fakeInstitutionLocation,
    );
    const application = createFakeApplication({
      location: saveFakeInstitutionLocation,
      student,
    });
    const savedApplication = await applicationRepo.save(application);

    // Original assessment.
    const fakeOriginalAssessment = createFakeStudentAssessment({
      auditUser: student.user,
    });
    fakeOriginalAssessment.application = savedApplication;
    const savedOriginalAssessment = await studentAssessmentRepo.save(
      fakeOriginalAssessment,
    );
    savedApplication.currentAssessment = savedOriginalAssessment;
    await applicationRepo.save(savedApplication);

    const endpoint = `/institutions/student/${student.id}/application-summary?page=0&pageLimit=10`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [],
        count: 0,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
