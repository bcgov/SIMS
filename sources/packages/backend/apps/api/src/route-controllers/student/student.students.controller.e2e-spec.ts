import { KeycloakConfig } from "../../auth/keycloakConfig";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  ATBCCreateClientResponse,
  ATBCService,
} from "@sims/integrations/services";
import {
  FakeStudentUsersTypes,
  getStudentToken,
  createTestingAppModule,
  BEARER_AUTH_TYPE,
} from "../../testHelpers";

describe("Test ATBC Controller", () => {
  let accessToken: string;
  let app: INestApplication;
  let atbcService: ATBCService;

  beforeAll(async () => {
    await KeycloakConfig.load();
    accessToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const { nestApplication, module } = await createTestingAppModule();
    atbcService = await module.get(ATBCService);
    app = nestApplication;
  });

  it("Should return an HTTP 200 status when applying for PD and student is valid.", async () => {
    // Arrange
    // Creating mockup for ATBCCreateClient.
    // This function actually calls the ATBC server to create the student profile.
    jest.spyOn(atbcService, "createClient").mockImplementation(async () => {
      return {} as ATBCCreateClientResponse;
    });

    // Act/Assert
    await request(app.getHttpServer())
      .patch("/students/atbc/apply-disability-status")
      .auth(accessToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
  });

  afterAll(async () => {
    await app?.close();
  });
});
