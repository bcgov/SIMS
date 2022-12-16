require("../../../../../env_setup");
import * as faker from "faker";
import { DatabaseModule, SINValidation, Student, User } from "@sims/sims-db";
import {
  StudentService,
  UserService,
  SINValidationService,
} from "../../services";
import { KeycloakConfig } from "../../auth/keycloakConfig";
import { KeycloakService } from "../../services/auth/keycloak/keycloak.service";
import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AuthModule } from "../../auth/auth.module";
import { AppStudentsModule } from "../../app.students.module";
import { createMockedZeebeModule } from "../../testHelpers/mocked-providers/zeebe-client-mock";
import { NotificationsModule } from "@sims/services/notifications";
import { MockedQueueModule } from "../../testHelpers/mocked-providers/queue-module-mock";

jest.setTimeout(15000);

describe("Test ATBC Controller", () => {
  const clientId = "student";
  let accesstoken: string;
  let app: INestApplication;
  let studentService: StudentService;
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
      imports: [
        DatabaseModule,
        AuthModule,
        AppStudentsModule,
        NotificationsModule,
        createMockedZeebeModule(),
        MockedQueueModule,
      ],
    }).compile();
    userService = await moduleFixture.get(UserService);
    studentService = await moduleFixture.get(StudentService);
    sinValidationService = await moduleFixture.get(SINValidationService);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("should return an HTTP 200 status when applying for PD and student is valid", async () => {
    // Create fake student in SIMS DB
    const fakeStudent = new Student();
    fakeStudent.sinConsent = true;
    fakeStudent.birthDate = faker.date.past(18).toISOString();
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

    // Save the student in SIMS.
    await studentService.save(fakeStudent);

    const sinValidation = new SINValidation();
    sinValidation.student = fakeStudent;
    sinValidation.isValidSIN = true;
    fakeStudent.sinValidation = sinValidation;
    sinValidation.sin = "706941291";

    await studentService.save(fakeStudent);

    try {
      // call to the controller, to apply for the PD
      await request(app.getHttpServer())
        .patch("/atbc/apply-pd-status")
        .auth(accesstoken, { type: "bearer" })
        .expect(HttpStatus.OK);
    } finally {
      // Set SIN Validation to null to remove the dependency
      // and delete SIN validation and student.
      fakeStudent.sinValidation = null;
      await studentService.save(fakeStudent);
      await sinValidationService.remove(sinValidation);
      await studentService.remove(fakeStudent);
      await userService.remove(simsUser);
    }
  });
});
