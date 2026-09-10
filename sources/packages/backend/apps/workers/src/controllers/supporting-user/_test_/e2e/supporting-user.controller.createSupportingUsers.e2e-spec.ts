import { Notification, SupportingUserType } from "@sims/sims-db";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { createFakeSupportingUser } from "@sims/test-utils/factories/supporting-user";
import {
  createFakeWorkerJob,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { SupportingUserController } from "../../supporting-user.controller";
import {
  CreateSupportingUsersJobInDTO,
  CreateSupportingUsersJobOutDTO,
} from "../../supporting-user.dto";
import { createFakeCreateSupportingUsersPayload } from "./create-supporting-users";
import { ICustomHeaders } from "@camunda8/sdk/dist/zeebe/types";
import {
  GC_NOTIFY_TEMPLATE_IDS,
  NOTIFY_TEMPLATE_IDS,
} from "@sims/test-utils/constants";

describe("SupportingUserController(e2e)-createSupportingUsers", () => {
  let db: E2EDataSources;
  let supportingUserController: SupportingUserController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    supportingUserController = nestApplication.get(SupportingUserController);
  });

  it("Should create parents supporting users when requested.", async () => {
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
        ICustomHeaders,
        CreateSupportingUsersJobOutDTO
      >(fakeCreateSupportingUsersPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      select: { supportingUsers: true },
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(2);
    const [parent1, parent2] = updatedApplication.supportingUsers;
    expect(parent1).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Parent,
    );
    expect(parent2).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Parent,
    );
    // Notification record.
    const createdNotification = await getCreatedNotification(
      savedApplication.student.user.id,
    );
    expect(createdNotification).toEqual({
      id: expect.any(Number),
      user: { id: savedApplication.student.user.id },
      messagePayload: {
        template_id: GC_NOTIFY_TEMPLATE_IDS.SupportingUserInfoTemplateId,
        email_address: savedApplication.student.user.email,
        personalisation: {
          lastName: savedApplication.student.user.lastName,
          givenNames: savedApplication.student.user.firstName ?? "",
          supportingUserType: "parents",
        },
      },
      templateId: NOTIFY_TEMPLATE_IDS.SupportingUserInfoTemplateId,
      recipients: [savedApplication.student.user.email],
      messageContent: {
        params: {
          lastName: savedApplication.student.user.lastName,
          givenNames: savedApplication.student.user.firstName ?? "",
          supportingUserType: "parents",
        },
      },
    });
  });

  it("Should create a parent supporting user when requested.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const fakeCreateSupportingUsersPayload =
      createFakeCreateSupportingUsersPayload(savedApplication.id, [
        SupportingUserType.Parent,
      ]);

    // Act
    const result = await supportingUserController.createSupportingUsers(
      createFakeWorkerJob<
        CreateSupportingUsersJobInDTO,
        ICustomHeaders,
        CreateSupportingUsersJobOutDTO
      >(fakeCreateSupportingUsersPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      select: { supportingUsers: true },
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(1);
    const [supportingUser] = updatedApplication.supportingUsers;
    expect(supportingUser).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Parent,
    );
    // Notification record.
    const createdNotification = await getCreatedNotification(
      savedApplication.student.user.id,
    );
    expect(createdNotification).toEqual({
      id: expect.any(Number),
      user: { id: savedApplication.student.user.id },
      messagePayload: {
        template_id: GC_NOTIFY_TEMPLATE_IDS.SupportingUserInfoTemplateId,
        email_address: savedApplication.student.user.email,
        personalisation: {
          lastName: savedApplication.student.user.lastName,
          givenNames: savedApplication.student.user.firstName ?? "",
          supportingUserType: "parent",
        },
      },
      templateId: NOTIFY_TEMPLATE_IDS.SupportingUserInfoTemplateId,
      recipients: [savedApplication.student.user.email],
      messageContent: {
        params: {
          lastName: savedApplication.student.user.lastName,
          givenNames: savedApplication.student.user.firstName ?? "",
          supportingUserType: "parent",
        },
      },
    });
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
        ICustomHeaders,
        CreateSupportingUsersJobOutDTO
      >(fakeCreateSupportingUsersPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      select: { supportingUsers: true },
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(1);
    const [supportingUser] = updatedApplication.supportingUsers;
    expect(supportingUser).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Partner,
    );
    // Notification record.
    const createdNotification = await getCreatedNotification(
      savedApplication.student.user.id,
    );
    expect(createdNotification).toEqual({
      id: expect.any(Number),
      user: { id: savedApplication.student.user.id },
      messagePayload: {
        template_id: GC_NOTIFY_TEMPLATE_IDS.SupportingUserInfoTemplateId,
        email_address: savedApplication.student.user.email,
        personalisation: {
          lastName: savedApplication.student.user.lastName,
          givenNames: savedApplication.student.user.firstName ?? "",
          supportingUserType: "partner",
        },
      },
      templateId: NOTIFY_TEMPLATE_IDS.SupportingUserInfoTemplateId,
      recipients: [savedApplication.student.user.email],
      messageContent: {
        params: {
          lastName: savedApplication.student.user.lastName,
          givenNames: savedApplication.student.user.firstName ?? "",
          supportingUserType: "partner",
        },
      },
    });
  });

  it("Should not create supporting users when application already has one.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const fakeSupportingUser = createFakeSupportingUser({
      application: savedApplication,
    });
    fakeSupportingUser.supportingUserType = SupportingUserType.Partner;
    await db.supportingUser.save(fakeSupportingUser);

    const fakeCreateSupportingUsersPayload =
      createFakeCreateSupportingUsersPayload(savedApplication.id, [
        SupportingUserType.Parent,
        SupportingUserType.Parent,
      ]);

    // Act
    const result = await supportingUserController.createSupportingUsers(
      createFakeWorkerJob<
        CreateSupportingUsersJobInDTO,
        ICustomHeaders,
        CreateSupportingUsersJobOutDTO
      >(fakeCreateSupportingUsersPayload),
    );

    // Asserts
    expect(result).toHaveProperty(
      FAKE_WORKER_JOB_RESULT_PROPERTY,
      MockedZeebeJobResult.Complete,
    );

    const updatedApplication = await db.application.findOne({
      select: { supportingUsers: true },
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(1);
    const [supportingUser] = updatedApplication.supportingUsers;
    expect(supportingUser).toHaveProperty(
      "supportingUserType",
      SupportingUserType.Partner,
    );
  });

  /**
   * Get a notification record for supporting user information notification message.
   * @param userId Id of the user.
   * @returns notification record.
   */
  async function getCreatedNotification(userId: number): Promise<Notification> {
    return db.notification.findOneOrFail({
      select: {
        id: true,
        user: { id: true },
        messagePayload: true,
        templateId: true,
        recipients: true,
        messageContent: true,
      },
      relations: { user: true },
      where: {
        user: { id: userId },
      },
    });
  }
});
