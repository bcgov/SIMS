require("../../../env_setup");
import { closeDB } from "../../testHelpers";
import * as faker from "faker";
import { Student, User } from "../../database/entities";
import {
  StudentService,
  ArchiveDbService,
  ATBCService,
  UserService,
  StudentFileService,
  ApplicationService,
  SequenceControlService,
  WorkflowActionsService,
  WorkflowService,
  TokensService,
  MSFAANumberService,
  EducationProgramService,
  StudentRestrictionService,
} from "..";
import { KeycloakConfig } from "../../auth/keycloakConfig";
import { KeycloakService } from "../auth/keycloak/keycloak.service";
import { ConfigService } from "../config/config.service";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { ATBCCreateClientResponse } from "../../types";
import { StudentController } from "../../route-controllers";
import { DatabaseModule } from "../../database/database.module";
import { AuthModule } from "../../auth/auth.module";
import { createMockedJwtService } from "../../testHelpers/mocked-providers/jwt-service-mock";

describe("Test ATBC Controller", () => {
  const clientId = "student";
  let accesstoken: string;
  let app: INestApplication;
  let studentService: StudentService;
  let atbcService: ATBCService;
  let userService: UserService;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const token = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      clientId,
    );
    accesstoken = token.access_token;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule],
      controllers: [StudentController],
      providers: [
        ConfigService,
        UserService,
        ArchiveDbService,
        ATBCService,
        StudentFileService,
        StudentService,
        ApplicationService,
        SequenceControlService,
        WorkflowActionsService,
        WorkflowService,
        KeycloakService,
        ConfigService,
        TokensService,
        MSFAANumberService,
        EducationProgramService,
        createMockedJwtService(),
        StudentRestrictionService,
      ],
    }).compile();
    userService = await moduleFixture.get(UserService);
    atbcService = await moduleFixture.get(ATBCService);
    studentService = await moduleFixture.get(StudentService);
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await closeDB();
  });

  it("should return an HTTP 200 status when applying for PD and student is valid", async () => {
    // Create fake student in SIMS DB
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

    try {
      // call to the controller, to apply for the PD
      await request(app.getHttpServer())
        .patch("/students/apply-pd-status")
        .auth(accesstoken, { type: "bearer" })
        .expect(HttpStatus.OK);
    } finally {
      await studentService.remove(fakestudent);
      await userService.remove(simsUser);
    }
  });
});
