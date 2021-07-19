require("../../../env_setup");
import { closeDB, setupDB } from "../../testHelpers";
import { Connection } from "typeorm";
import * as faker from "faker";
import { Student, User } from "../../database/entities";
import {
  StudentService,
  ArchiveDbService,
  ATBCService,
  UserService,
} from "../../services";
import { KeycloakConfig } from "../../auth/keycloakConfig";
import { KeycloakService } from "../auth/keycloak/keycloak.service";
import { ConfigService } from "../config/config.service";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { ATBCCreateClientResponse } from "../../types";

describe("Test ATBC Controller", () => {
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

  it("should return an HTTP 200 status when applying for PD and student is valid", async () => {
    // Create fake student in SIMS DB
    const archiveDB = new ArchiveDbService();
    const userService = new UserService(connection);
    const studentService = new StudentService(connection, archiveDB);
    const atbcService = new ATBCService(configService, studentService);
    const fakestudent = new Student();
    fakestudent.sin = "123456789";
    fakestudent.birthdate = faker.date.past(20);
    fakestudent.gender = "F";
    fakestudent.contactInfo = {
      addresses: [
        {
          addressLine1: faker.address.streetAddress(),
          city: faker.address.city(),
          country: "Canada",
          province: "ON",
          postalCode: faker.address.zipCode(),
        },
      ],
      phone: faker.phone.phoneNumber(),
    };
    const simsUser = new User();
    simsUser.userName = process.env.E2E_TEST_STUDENT_USERNAME;
    simsUser.email = faker.internet.email();
    simsUser.firstName = faker.name.firstName();
    simsUser.lastName = faker.name.lastName();
    fakestudent.user = simsUser;

    // Save the student in SIMS
    await studentService.save(fakestudent);

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
    await studentService.remove(fakestudent);
    await userService.remove(simsUser);
  });
});
