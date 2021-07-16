require("../../../env_setup");
import { closeDB, setupDB } from "../../testHelpers";
import { Connection } from "typeorm";
import * as faker from "faker";
import { Student, User } from "../../database/entities";
import { StudentService, ArchiveDbService, ATBCService } from "../../services";
import { KeycloakConfig } from "../../auth/keycloakConfig";
import { KeycloakService } from "../auth/keycloak/keycloak.service";
import { ConfigService } from "../config/config.service";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { ATBCCreateClientResponse } from "../../types";

describe("Test student model", () => {
  const clientId = "student";
  let connection: Connection;
  let accesstoken: string;
  let configService: ConfigService;
  let app: INestApplication;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const token = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      clientId,
    );
    accesstoken = token.access_token;

    connection = await setupDB();
    const moduleFixture: TestingModule = await Test.createTestingModule(
      {},
    ).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await closeDB();
  });

  it("should save student model object with user relationship and address jsonb", async () => {
    // Create fake student in SIMS DB
    const archiveDB = new ArchiveDbService();
    const studentService = new StudentService(connection, archiveDB);
    const atbcService = new ATBCService(configService, studentService);
    const sub = new Student();
    sub.sin = "9999999999";
    sub.birthdate = faker.date.past(18);
    sub.gender = "X";
    sub.contactInfo = {
      addresses: [
        {
          addressLine1: faker.address.streetAddress(),
          city: faker.address.city(),
          country: "can",
          province: "bc",
          postalCode: faker.address.zipCode(),
        },
      ],
      phone: faker.phone.phoneNumber(),
    };
    const user = new User();
    user.userName = faker.random.uuid();
    user.email = faker.internet.email();
    user.firstName = faker.name.firstName();
    user.lastName = faker.name.lastName();
    sub.user = user;

    // Save the student in SIMS
    await studentService.save(sub);
    // creating mockup for getStudentByUserName, username is from BCSC
    jest
      .spyOn(studentService, "getStudentByUserName")
      .mockImplementation(async () => {
        return {
          validSIN: null,
          StudentPDSentAt: null,
          studentPDVerified: null,
          id: sub.id,
        } as Student;
      });

    // creating mockup for ATBCCreateClient, this function actually calls the ATBC server to create the student profile
    jest.spyOn(atbcService, "ATBCCreateClient").mockImplementation(async () => {
      return {} as ATBCCreateClientResponse;
    });
    // call to the controller, to apply for the PD
    request(app.getHttpServer())
      .patch("/student/apply-pd-status")
      .auth(accesstoken, { type: "bearer" })
      .expect(HttpStatus.OK);

    // Remove the created fake user from SIMS db
    await studentService.remove(sub);
  });
});
