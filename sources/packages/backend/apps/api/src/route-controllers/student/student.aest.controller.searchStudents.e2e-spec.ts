import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
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
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  AESTGroups,
  getAESTToken,
} from "../../testHelpers";

describe("StudentMinistryController(e2e)-searchStudents", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let studentRepo: Repository<Student>;
  let applicationRepo: Repository<Application>;
  const endpoint = "/aest/student/search";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    studentRepo = dataSource.getRepository(Student);
    applicationRepo = dataSource.getRepository(Application);
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
  });

  it("Should find the student by part of first name.", async () => {
    // Arrange
    const { student } = await saveStudentWithApplicationForCollegeF(
      ApplicationStatus.Submitted,
    );
    student.user.firstName =
      "first name 77b83122-35a9-4492-8a27-c1e5cf4587dq ilike test";
    await studentRepo.save(student);
    const searchPayload = {
      appNumber: "",
      firstName: "77B83122-35A9-4492-8A27-C1E5CF4587DQ",
      lastName: "",
      sin: "",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
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

  it("Should find the student by sin when student.", async () => {
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
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
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
