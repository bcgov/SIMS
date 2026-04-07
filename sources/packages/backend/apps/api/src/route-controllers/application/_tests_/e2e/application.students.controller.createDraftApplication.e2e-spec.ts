import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  ensureProgramYearExistsForPartTimeOnly,
  saveFakeStudent,
} from "@sims/test-utils";
import { OfferingIntensity, ProgramYear } from "@sims/sims-db";
import { CreateApplicationAPIInDTO } from "../../../route-controllers/application/models/application.dto";
import { ConfigServiceMockHelper } from "@sims/test-utils/mocks";

describe("ApplicationStudentsController(e2e)-createDraftApplication", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let recentActiveProgramYear: ProgramYear;
  let configServiceMockHelper: ConfigServiceMockHelper;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    configServiceMockHelper = new ConfigServiceMockHelper(app);
    // Program Year for the following tests.
    recentActiveProgramYear = await db.programYear.findOne({
      select: { id: true, startDate: true, endDate: true },
      where: { active: true },
      order: { startDate: "DESC" },
    });
  });

  beforeEach(() => {
    resetMockJWTUserInfo(appModule);
    configServiceMockHelper.allowBetaUsersOnly(false);
  });

  it("Should create an application when the user is a beta user and allowBetaUsersOnly is true.", async () => {
    // Arrange
    configServiceMockHelper.allowBetaUsersOnly(true);
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

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);
  });

  it("Should throw a forbidden error when a full-time application is saved and the user is not a beta user and allowBetaUsersOnly is true.", async () => {
    // Arrange
    configServiceMockHelper.allowBetaUsersOnly(true);
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

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

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

  it("Should throw an unprocessable entity error when a full-time application is saved and the program year allows only part-time.", async () => {
    // Arrange
    // Create a part-time only program year for the test.
    const programYearPartTimeOnly =
      await ensureProgramYearExistsForPartTimeOnly(db);
    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      associatedFiles: [],
      data: {},
      programYearId: programYearPartTimeOnly.id,
      offeringIntensity: OfferingIntensity.fullTime,
    } as CreateApplicationAPIInDTO;

    const endpoint = `/students/application/draft`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Offering intensity not allowed for the program year.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
