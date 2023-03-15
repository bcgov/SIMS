import { StudentService } from "../../services";
import { KeycloakConfig } from "../../auth/keycloakConfig";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  ATBCCreateClientResponse,
  ATBCService,
} from "@sims/integrations/services";
import {
  FakeStudentUsersTypes,
  getStudentByFakeStudentUserType,
  getStudentToken,
  createTestingAppModule,
  BEARER_AUTH_TYPE,
} from "../../testHelpers";
import { DataSource } from "typeorm";

describe("Test ATBC Controller", () => {
  let accessToken: string;
  let app: INestApplication;
  let studentService: StudentService;
  let atbcService: ATBCService;
  let appDataSource: DataSource;

  beforeAll(async () => {
    await KeycloakConfig.load();
    accessToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    const moduleFixture = module;
    atbcService = await moduleFixture.get(ATBCService);
    studentService = await moduleFixture.get(StudentService);
    app = nestApplication;
    appDataSource = dataSource;
  });

  it("Should return an HTTP 200 status when applying for PD and student is valid", async () => {
    // Arrange
    // Creating mockup for ATBCCreateClient.
    // This function actually calls the ATBC server to create the student profile.
    jest.spyOn(atbcService, "createClient").mockImplementation(async () => {
      return {} as ATBCCreateClientResponse;
    });

    // Act/Assert
    await request(app.getHttpServer())
      .patch("/students/atbc/apply-pd-status")
      .auth(accessToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
  });
  afterAll(async () => {
    // Putting the student in the same state as before the test.
    const fakeStudent = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      appDataSource,
    );
    fakeStudent.studentPDSentAt = null;
    await studentService.save(fakeStudent);
    await app?.close();
  });
});
