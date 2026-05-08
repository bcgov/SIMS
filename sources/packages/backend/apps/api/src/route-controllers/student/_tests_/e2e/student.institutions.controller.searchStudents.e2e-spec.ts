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
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeApplication,
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
  let collegeFInstitutionUserToken: string;
  const endpoint = "/institutions/student/search";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    studentRepo = dataSource.getRepository(Student);
    applicationRepo = dataSource.getRepository(Application);
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
    collegeFInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
  });

  it("Should find the student by application number when student has at least one application submitted for the institution.", async () => {
    // Arrange
    const { student, application } =
      await saveStudentWithApplicationForCollegeF(ApplicationStatus.Submitted);
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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  it("Should find the student by last name when student has at least one application submitted for the institution.", async () => {
    // Arrange
    const { student } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Submitted,
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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  it("Should find the student by last name when student has an application version (Edited) submitted for the institution.", async () => {
    // Arrange
    const { application: previousApplication, student } =
      await saveStudentWithApplicationForCollegeF(ApplicationStatus.Edited);

    const { institution: collegeE } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );
    let collegeELocation = createFakeInstitutionLocation({
      institution: collegeE,
    });

    // Create a new version of the application for a different institution.
    await saveFakeApplication(
      appDataSource,
      {
        institution: collegeE,
        institutionLocation: collegeELocation,
        student,
        parentApplication: { id: previousApplication.id } as Application,
        precedingApplication: { id: previousApplication.id } as Application,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
      },
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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  it("Should find the student by part of last name when student has at least one application submitted for the institution.", async () => {
    // Arrange
    const { student } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Submitted,
    );
    await studentRepo.save(student);

    const searchPayload = {
      appNumber: "",
      firstName: "",
      lastName: student.user.lastName?.slice(0, 25),
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  it("Should find the student by first name when student has at least one application submitted for the institution.", async () => {
    // Arrange
    const { student } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Submitted,
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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  it("Should find the student by part of first name when student has at least one application submitted for the institution.", async () => {
    // Arrange
    const { student } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Submitted,
    );
    await studentRepo.save(student);
    const searchPayload = {
      appNumber: "",
      firstName: student.user.firstName?.slice(0, 25),
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  it("Should find the student by sin when student has at least one application submitted for the institution.", async () => {
    // Arrange
    const { student } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Submitted,
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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  it("Should not find the student when application cancelled as draft.", async () => {
    // Arrange
    const { application } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Cancelled,
    );
    // Adjust the application to not have a location.
    application.location = null;
    await applicationRepo.save(application);

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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => expect(body).toEqual([]));
  });

  it("Should find the student when application is cancelled after submission.", async () => {
    // Arrange
    const { student, application } =
      await saveStudentWithApplicationForCollegeF(ApplicationStatus.Cancelled);
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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  it("Should not find the student when user is not active.", async () => {
    // Arrange
    const { student, application } =
      await saveStudentWithApplicationForCollegeF(ApplicationStatus.Submitted);
    student.user.isActive = false;
    await studentRepo.save(student);

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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => expect(body).toEqual([]));
  });

  it("Should not find the student when student does not have an application for that institution.", async () => {
    // Arrange
    const { institution: collegeC } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    const collegeCLocation = createFakeInstitutionLocation({
      institution: collegeC,
    });
    const application = await saveFakeApplication(appDataSource, {
      institutionLocation: collegeCLocation,
    });

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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => expect(body).toEqual([]));
  });

  it("Should not find the student when student has only a draft application.", async () => {
    // Arrange
    const { application } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Draft,
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
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => expect(body).toEqual([]));
  });

  it("Should throw forbidden error when the institution type is not BC Public.", async () => {
    // Arrange
    const searchPayload = {
      appNumber: "",
      firstName: "",
      lastName: "search last name",
      sin: "",
    };

    // College C is not a BC Public institution.
    const collegeCInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(collegeCInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect(({ body }) =>
        expect(body).toEqual({
          statusCode: HttpStatus.FORBIDDEN,
          message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
          error: "Forbidden",
        }),
      );
  });

  it("Should find the student by email address when there is an exact match.", async () => {
    // Arrange
    const { student } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Submitted,
    );
    const searchPayload = {
      email: student.user.email,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(collegeFInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
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

  /**
   * Saves a student and an application for the student for College F.
   * @param applicationStatus application status.
   * @returns an object with student and application persisted in the database.
   */
  const saveStudentWithApplicationForCollegeF = async (
    applicationStatus: ApplicationStatus,
  ) => {
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplication(
      appDataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus,
      },
    );

    return {
      student,
      application,
    };
  };

  afterAll(async () => {
    await app?.close();
  });
});
