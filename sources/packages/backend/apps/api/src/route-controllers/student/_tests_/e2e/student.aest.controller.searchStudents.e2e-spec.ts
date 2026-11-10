import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { Student } from "@sims/sims-db";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  AESTGroups,
  getAESTToken,
} from "../../../../testHelpers";

describe("StudentMinistryController(e2e)-searchStudents", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let studentRepo: Repository<Student>;
  const endpoint = "/aest/student/search";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    studentRepo = dataSource.getRepository(Student);
  });

  it("Should find the student by part of first name when there is a partial match.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    student.user.firstName =
      "first name 77b83122-35a9-4492-8a27-c1e5cf4587dq test";
    await studentRepo.save(student);
    const searchPayload = {
      appNumber: "",
      firstName: "77B83122-35A9-4492-8A27-C1E5CF4587DQ",
      lastName: "",
      sin: "",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
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

  it("Should find the student by sin when there is an exact match.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const searchPayload = {
      appNumber: "",
      firstName: "",
      lastName: "",
      sin: student.sinValidation.sin,
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
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

  it("Should find the student by email where there is an exact match.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    await studentRepo.save(student);
    const searchPayload = {
      email: student.user.email,
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
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

  it("Should find the student by email where there is an exact match regardless of case.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    student.user.email = "student@hotmail.com";
    await studentRepo.save(student);
    const searchPayload = {
      email: "StUdEnT@hOtMaIl.cOm",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
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

  it("Should not find the student by email where there is only a partial match.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    student.user.email = "student@icloud.com";
    await studentRepo.save(student);
    const searchPayload = {
      email: "student@icloud",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it("Should not find the student by email where the email doesn't match.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    student.user.email = "student@gmail.com";
    await studentRepo.save(student);
    const searchPayload = {
      email: "student@example.com",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it("Should find the student by certificate number when there is an exact match.", async () => {
    // Arrange
    // The student is saved explicitly to have the SIN validation available for the assertion.
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplicationDisbursements(appDataSource, {
      student,
    });
    const [{ documentNumber }] =
      application.currentAssessment.disbursementSchedules;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({ documentNumber })
      .auth(token, BEARER_AUTH_TYPE)
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

  it("Should not find the student by certificate number when there is only a partial match.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(appDataSource);
    const [{ documentNumber }] =
      application.currentAssessment.disbursementSchedules;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({ documentNumber: Number(documentNumber.toString().slice(0, -1)) })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it("Should throw a bad request error when the certificate number is not numeric.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({ documentNumber: "12A45" })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it("Should throw a bad request error when the certificate number has more than 9 digits.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send({ documentNumber: 1234567890 })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["documentNumber must not be greater than 999999999"],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request error when no search parameters are provided.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    student.user.email = "student@mail.com";
    await studentRepo.save(student);
    const searchPayload = {};
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(searchPayload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "At least one of the following must be provided: firstName, lastName, appNumber, sin, email, documentNumber.",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
