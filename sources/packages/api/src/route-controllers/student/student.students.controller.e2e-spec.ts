require("../../../env_setup");
import * as faker from "faker";
import { SINValidation, Student, User } from "../../database/entities";
import {
  StudentService,
  ATBCService,
  UserService,
  SINValidationService,
} from "../../services";
import { KeycloakConfig } from "../../auth/keycloakConfig";
import { KeycloakService } from "../../services/auth/keycloak/keycloak.service";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { ATBCCreateClientResponse } from "../../types";
import { DatabaseModule } from "../../database/database.module";
import { AuthModule } from "../../auth/auth.module";
import { AppStudentsModule } from "../../app.students.module";

describe("Test ATBC Controller", () => {
  const clientId = "student";
  let accesstoken: string;
  let app: INestApplication;
  let studentService: StudentService;
  let atbcService: ATBCService;
  let userService: UserService;
  let sinValidationService: SINValidationService;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const token = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      clientId,
    );
    accesstoken = token.access_token;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthModule, AppStudentsModule],
    }).compile();
    userService = await moduleFixture.get(UserService);
    atbcService = await moduleFixture.get(ATBCService);
    studentService = await moduleFixture.get(StudentService);
    sinValidationService = await moduleFixture.get(SINValidationService);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("should return an HTTP 200 status when applying for PD and student is valid", async () => {
    // Create fake student in SIMS DB
    const fakeStudent = new Student();
    fakeStudent.birthDate = faker.date.past(18);
    fakeStudent.gender = "F";
    fakeStudent.contactInfo = {
      address: {
        addressLine1: faker.address.streetAddress(),
        city: faker.address.city(),
        country: "Canada",
        provinceState: "ON",
        postalCode: faker.address.zipCode(),
      },
      phone: faker.phone.phoneNumber(),
    };
    const simsUser = new User();
    simsUser.userName = process.env.E2E_TEST_STUDENT_USERNAME;
    simsUser.email = faker.internet.email();
    simsUser.firstName = faker.name.firstName();
    simsUser.lastName = faker.name.lastName();
    fakeStudent.user = simsUser;
    const sinValidation = new SINValidation();
    sinValidation.user = simsUser;
    sinValidation.isValidSIN = true;
    fakeStudent.sinValidation = sinValidation;
    sinValidation.sin = "706941291";

    // Save the student in SIMS
    await studentService.save(fakeStudent);

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
      await studentService.remove(fakeStudent);
      await sinValidationService.remove(sinValidation);
      await userService.remove(simsUser);
    }
  });
});
