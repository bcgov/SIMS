import {
  createE2EDataSources,
  createFakeSupportingUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { createTestingAppModule } from "../../../../../test/helpers";
import {
  FakeWorkerJobResult,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { CRAIntegrationController } from "../../cra-integration.controller";
import { IsNull } from "typeorm";
import { createFakeCreateIncomeRequestDataPayload } from "./create-income-request-data-factory";
import { User } from "@sims/sims-db";
import MockDate from "mockdate";

describe("CRAIntegrationController(e2e)-createIncomeRequest", () => {
  let db: E2EDataSources;
  let craIntegrationController: CRAIntegrationController;
  let systemUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource, systemUsersService } =
      await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    craIntegrationController = nestApplication.get(CRAIntegrationController);
    systemUser = systemUsersService.systemUser;
  });

  beforeEach(() => {
    MockDate.reset();
  });

  it("Should create a CRA income verification record and allow the income verification execution when the request is for the student application income.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const application = await saveFakeApplication(db.dataSource);
    const createIncomeRequestPayload = createFakeCreateIncomeRequestDataPayload(
      application.id,
    );

    // Act
    const result = await craIntegrationController.createIncomeRequest(
      createIncomeRequestPayload,
    );

    // Assert
    expect(FakeWorkerJobResult.getResultType(result)).toBe(
      MockedZeebeJobResult.Complete,
    );
    expect(FakeWorkerJobResult.getOutputVariables(result)).toEqual({
      canExecuteIncomeVerification: true,
      incomeVerificationId: expect.any(Number),
    });
    const createdIncomeVerification =
      await db.craIncomeVerification.findOneOrFail({
        select: {
          id: true,
          taxYear: true,
          reportedIncome: true,
          creator: { id: true },
          createdAt: true,
        },
        relations: { creator: true },
        where: {
          application: { id: application.id },
          supportingUser: { id: IsNull() },
        },
        loadEagerRelations: false,
      });
    expect(createdIncomeVerification).toEqual({
      id: expect.any(Number),
      taxYear: 2022,
      reportedIncome: 1000,
      creator: systemUser,
      createdAt: now,
    });
  });

  [
    { sin: "999999999", canExecuteIncomeVerification: true },
    { sin: null, canExecuteIncomeVerification: false },
  ].forEach((testScenario) => {
    it(`Should create a CRA income verification record and return the canExecuteIncomeVerification as ${testScenario.canExecuteIncomeVerification} when the SIN is ${testScenario.sin ? "defined" : "not defined"}.`, async () => {
      // Arrange
      const now = new Date();
      MockDate.set(now);
      const application = await saveFakeApplication(db.dataSource);
      const supportingUser = await db.supportingUser.save(
        createFakeSupportingUser(
          { application },
          { initialValues: { sin: testScenario.sin } },
        ),
      );
      const createIncomeRequestPayload =
        createFakeCreateIncomeRequestDataPayload(application.id, {
          supportingUserId: supportingUser.id,
        });

      // Act
      const result = await craIntegrationController.createIncomeRequest(
        createIncomeRequestPayload,
      );

      // Assert
      expect(FakeWorkerJobResult.getResultType(result)).toBe(
        MockedZeebeJobResult.Complete,
      );
      expect(FakeWorkerJobResult.getOutputVariables(result)).toEqual({
        canExecuteIncomeVerification: testScenario.canExecuteIncomeVerification,
        incomeVerificationId: expect.any(Number),
      });

      const createdIncomeVerification =
        await db.craIncomeVerification.findOneOrFail({
          select: {
            id: true,
            taxYear: true,
            reportedIncome: true,
            creator: { id: true },
            createdAt: true,
          },
          relations: { creator: true },
          where: {
            supportingUser: { id: supportingUser.id },
          },
          loadEagerRelations: false,
        });
      expect(createdIncomeVerification).toEqual({
        id: expect.any(Number),
        taxYear: 2022,
        reportedIncome: 1000,
        creator: systemUser,
        createdAt: now,
      });
    });
  });
});
