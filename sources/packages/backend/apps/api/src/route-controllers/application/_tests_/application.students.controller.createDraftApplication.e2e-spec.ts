import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserName,
  resetMockJWTUserName,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { OfferingIntensity, ProgramYear } from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import { CreateApplicationAPIInDTO } from "../../../route-controllers/application/models/application.dto";

describe("ApplicationStudentsController(e2e)-createDraftApplication", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let recentActiveProgramYear: ProgramYear;
  let configService: ConfigService;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    configService = appModule.get(ConfigService);
    // Program Year for the following tests.
    recentActiveProgramYear = await db.programYear.findOne({
      select: { id: true, startDate: true, endDate: true },
      where: { active: true },
      order: { startDate: "DESC" },
    });
  });

  beforeEach(() => {
    resetMockJWTUserName(appModule);
    allowBetaUsersOnly(false);
  });

  it("Should create an application when the user is a beta user and allowBetaUsersOnly is true.", async () => {
    // Arrange
    allowBetaUsersOnly(true);
    const student = await saveFakeStudent(db.dataSource);
    // Register the student as a beta user for full-time.
    await db.betaUsersAuthorizations.save({
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      enabledFrom: new Date(),
    });
    const payload = {
      associatedFiles: [],
      data: {},
      programYearId: recentActiveProgramYear.id,
      offeringIntensity: OfferingIntensity.fullTime,
    } as CreateApplicationAPIInDTO;
    const endpoint = `/students/application/draft`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Mock the user name received in the token.
    await mockJWTUserName(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);
  });

  it("Should throw a forbidden error when a full-time application is saved and the user is not a beta user and allowBetaUsersOnly is true.", async () => {
    // Arrange
    allowBetaUsersOnly(true);
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      associatedFiles: [],
      data: {},
      programYearId: recentActiveProgramYear.id,
      offeringIntensity: OfferingIntensity.fullTime,
    } as CreateApplicationAPIInDTO;

    const endpoint = `/students/application/draft`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Mock the user name received in the token.
    await mockJWTUserName(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "User is not allowed to submit a full-time application.",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  /**
   * Mock the allowBetaUsersOnly config value to allow changing the behavior
   * of the beta users authorization between tests.
   * @param allow true to allow beta users only, false to allow all users.
   */
  function allowBetaUsersOnly(allow: boolean): void {
    jest
      .spyOn(configService, "allowBetaUsersOnly", "get")
      .mockReturnValue(allow);
  }

  afterAll(async () => {
    await app?.close();
  });
});
