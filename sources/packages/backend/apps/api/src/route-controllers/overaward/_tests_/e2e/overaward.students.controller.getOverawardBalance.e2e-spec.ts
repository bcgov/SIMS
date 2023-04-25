import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeDisbursementOveraward,
  saveFakeStudent,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  IdentityProviders,
} from "@sims/sims-db";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getProviderInstanceForModule,
  getStudentToken,
} from "../../../../testHelpers";
import { UserService } from "../../../../services";
import { TestingModule } from "@nestjs/testing";
import { AuthModule } from "../../../../auth/auth.module";

describe("OverawardStudentsController(e2e)-getOverawardBalance", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    appModule = module;
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should return correct value for overaward balance when available.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);

    // Mock user service for auth module
    const userService = await getProviderInstanceForModule<UserService>(
      appModule,
      AuthModule,
      UserService,
    );
    userService.getUserLoginInfo = jest.fn(() =>
      Promise.resolve({
        id: student.user.id,
        isActive: true,
        studentId: student.id,
        identityProviderType: IdentityProviders.BCSC,
      }),
    );

    // Get any student user token
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Create an overaward.
    const legacyOverawardCSLF = createFakeDisbursementOveraward({ student });
    legacyOverawardCSLF.disbursementValueCode = "CSLF";
    legacyOverawardCSLF.overawardValue = 500;
    legacyOverawardCSLF.originType =
      DisbursementOverawardOriginType.LegacyOveraward;

    // Create a manual overaward deduction.
    const manualOverawardCSLF = createFakeDisbursementOveraward({ student });
    manualOverawardCSLF.disbursementValueCode = "CSLF";
    manualOverawardCSLF.overawardValue = -100;
    manualOverawardCSLF.originType =
      DisbursementOverawardOriginType.ManualRecord;

    // Create a manual overaward deduction.
    const manualOverawardCSLP = createFakeDisbursementOveraward({ student });
    manualOverawardCSLP.disbursementValueCode = "CSLP";
    manualOverawardCSLP.overawardValue = 99;
    manualOverawardCSLP.originType =
      DisbursementOverawardOriginType.ManualRecord;

    // Persist the overawards.
    await disbursementOverawardRepo.save([
      legacyOverawardCSLF,
      manualOverawardCSLF,
      manualOverawardCSLP,
    ]);
    const endpoint = "/students/overaward/balance";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ overawardBalanceValues: { CSLF: "400.00", CSLP: "99.00" } });
  });

  afterAll(async () => {
    await app?.close();
  });
});
