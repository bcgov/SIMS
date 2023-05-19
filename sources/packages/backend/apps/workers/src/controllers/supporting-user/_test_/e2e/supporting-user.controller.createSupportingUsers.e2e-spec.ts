import { SupportingUserType } from "@sims/sims-db";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { saveFakeSupportingUser } from "@sims/test-utils/factories/supporting-user";
import { IOutputVariables } from "zeebe-node";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../testHelpers";
import { SupportingUserController } from "../../supporting-user.controller";
import {
  CreateSupportingUsersJobInDTO,
  CreateSupportingUsersJobOutDTO,
} from "../../supporting-user.dto";
import { createFakeCreateSupportingUsersPayload } from "./create-supporting-users";

describe("SupportingUserController(e2e)-createSupportingUsers", () => {
  let db: E2EDataSources;
  let supportingUserController: SupportingUserController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    await nestApplication.init();
    db = createE2EDataSources(dataSource);
    supportingUserController = nestApplication.get(SupportingUserController);
  });

  it("Should create parent supporting users when requested.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const fakeCreateSupportingUsersPayload =
      createFakeCreateSupportingUsersPayload(savedApplication.id, [
        SupportingUserType.Parent,
        SupportingUserType.Parent,
      ]);

    // Act
    const result = await supportingUserController.createSupportingUsers(
      createFakeWorkerJob<
        CreateSupportingUsersJobInDTO,
        IOutputVariables,
        CreateSupportingUsersJobOutDTO
      >(fakeCreateSupportingUsersPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(2);
    expect(updatedApplication.supportingUsers[0]).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Parent,
    );
    expect(updatedApplication.supportingUsers[1]).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Parent,
    );
  });

  it("Should create partner supporting user when requested.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const fakeCreateSupportingUsersPayload =
      createFakeCreateSupportingUsersPayload(savedApplication.id, [
        SupportingUserType.Partner,
      ]);

    // Act
    const result = await supportingUserController.createSupportingUsers(
      createFakeWorkerJob<
        CreateSupportingUsersJobInDTO,
        IOutputVariables,
        CreateSupportingUsersJobOutDTO
      >(fakeCreateSupportingUsersPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(1);
    expect(updatedApplication.supportingUsers[0]).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Partner,
    );
  });

  it("Should not create supporting users when application already has one.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    await saveFakeSupportingUser(db.dataSource, SupportingUserType.Partner, {
      application: savedApplication,
    });

    const fakeCreateSupportingUsersPayload =
      createFakeCreateSupportingUsersPayload(savedApplication.id, [
        SupportingUserType.Parent,
        SupportingUserType.Parent,
      ]);

    // Act
    const result = await supportingUserController.createSupportingUsers(
      createFakeWorkerJob<
        CreateSupportingUsersJobInDTO,
        IOutputVariables,
        CreateSupportingUsersJobOutDTO
      >(fakeCreateSupportingUsersPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(1);
    expect(updatedApplication.supportingUsers[0]).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Partner,
    );
  });
});
