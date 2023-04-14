import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  getAuthRelatedEntities,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  Institution,
  InstitutionLocation,
  Student,
} from "@sims/sims-db";

describe("StudentInstitutionsController(e2e)-searchStudents", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let studentRepo: Repository<Student>;
  let applicationRepo: Repository<Application>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    studentRepo = dataSource.getRepository(Student);
    applicationRepo = dataSource.getRepository(Application);
    const { institution: collegeF } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation(collegeF);

    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should find the student by application number when student has at least one application submitted for the institution.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    let student = await saveFakeStudent(appDataSource);
    // Refresh student object to get a birthDate with date only
    student = await studentRepo.findOne({
      where: { id: student.id },
      relations: { sinValidation: true },
    });

    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );
    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const searchPayload = {
      appNumber: application.applicationNumber,
      firstName: "",
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect([
        {
          id: student.id,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          birthDate: student.birthDate,
          sin: student.sinValidation.sin,
        },
      ]);
  });

  it("Should find the student by last name when student has at least one application submitted for the institution.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    let student = await saveFakeStudent(appDataSource);
    // Refresh student object to get a birthDate with date only
    student = await studentRepo.findOne({
      where: { id: student.id },
      relations: { sinValidation: true },
    });

    await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );
    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const searchPayload = {
      appNumber: "",
      firstName: "",
      lastName: student.user.lastName,
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body).toEqual(
          expect.arrayContaining([
            {
              id: student.id,
              firstName: student.user.firstName,
              lastName: student.user.lastName,
              birthDate: student.birthDate,
              sin: student.sinValidation.sin,
            },
          ]),
        );
      });
  });

  it("Should find the student by first name when student has at least one application submitted for the institution.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    let student = await saveFakeStudent(appDataSource);
    // Refresh student object to get a birthDate with date only
    student = await studentRepo.findOne({
      where: { id: student.id },
      relations: { sinValidation: true },
    });

    await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );
    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const searchPayload = {
      appNumber: "",
      firstName: student.user.firstName,
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body).toEqual(
          expect.arrayContaining([
            {
              id: student.id,
              firstName: student.user.firstName,
              lastName: student.user.lastName,
              birthDate: student.birthDate,
              sin: student.sinValidation.sin,
            },
          ]),
        );
      });
  });

  it("Should find the student by sin when student has at least one application submitted for the institution.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    let student = await saveFakeStudent(appDataSource);
    // Refresh student object to get a birthDate with date only
    student = await studentRepo.findOne({
      where: { id: student.id },
      relations: { sinValidation: true },
    });

    await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );
    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const searchPayload = {
      appNumber: "",
      firstName: "",
      lastName: "",
      sin: student.sinValidation.sin,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect([
        {
          id: student.id,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          birthDate: student.birthDate,
          sin: student.sinValidation.sin,
        },
      ]);
  });

  it("Should not find the student when application submitted and cancelled before the assessment.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);

    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Cancelled,
      },
    );
    // Adjust the application to not have an assessment
    application.currentAssessment.assessmentData = null;
    await applicationRepo.save(application);

    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const searchPayload = {
      appNumber: application.applicationNumber,
      firstName: "",
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect([]);
  });

  it("Should find the student when application submitted and cancelled after the assessment.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    let student = await saveFakeStudent(appDataSource);
    // Refresh student object to get a birthDate with date only
    student = await studentRepo.findOne({
      where: { id: student.id },
      relations: { sinValidation: true },
    });

    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Cancelled,
      },
    );

    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const searchPayload = {
      appNumber: application.applicationNumber,
      firstName: "",
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect([
        {
          id: student.id,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          birthDate: student.birthDate,
          sin: student.sinValidation.sin,
        },
      ]);
  });

  it("Should not find the student when user is not active.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);
    student.user.isActive = false;
    await studentRepo.save(student);

    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );
    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const searchPayload = {
      appNumber: application.applicationNumber,
      firstName: "",
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect([]);
  });

  it("Should not find the student when institution is different.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);

    const { institution: collegeC } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    const collegeCLocation = createFakeInstitutionLocation(collegeC);

    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
    );
    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const searchPayload = {
      appNumber: application.applicationNumber,
      firstName: "",
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect([]);
  });

  it("Should not find the student when student has only a draft application.", async () => {
    // Arrange
    // Student who has application submitted to institution.
    const student = await saveFakeStudent(appDataSource);

    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Draft,
      },
    );
    const endpoint = "/institutions/student/search";
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const searchPayload = {
      appNumber: application.applicationNumber,
      firstName: "",
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect([]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
