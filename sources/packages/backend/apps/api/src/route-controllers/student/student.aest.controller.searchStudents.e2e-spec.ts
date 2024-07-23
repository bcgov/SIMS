import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import { saveFakeStudent } from "@sims/test-utils";
import { Student } from "@sims/sims-db";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  AESTGroups,
  getAESTToken,
} from "../../testHelpers";

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

  it("Should find the student by part of first name.", async () => {
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

  it("Should find the student by sin.", async () => {
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

  afterAll(async () => {
    await app?.close();
  });
});
