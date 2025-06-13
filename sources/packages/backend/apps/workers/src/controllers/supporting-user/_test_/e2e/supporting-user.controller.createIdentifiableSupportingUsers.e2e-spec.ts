import { ApplicationData, SupportingUserType } from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeSupportingUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  createFakeWorkerJob,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { SupportingUserController } from "../../supporting-user.controller";
import {
  CreateIdentifiableSupportingUsersJobInDTO,
  CreateIdentifiableSupportingUsersJobOutDTO,
} from "../../supporting-user.dto";
import { createFakeCreateIdentifiableSupportingUsersPayload } from "./create-identifiable-supporting-user";
import { ICustomHeaders } from "@camunda8/sdk/dist/zeebe/types";
import * as faker from "faker";
import {
  APPLICATION_NOT_FOUND,
  SUPPORTING_USER_FULL_NAME_NOT_RESOLVED,
} from "@sims/services/constants";

describe("SupportingUserController(e2e)-createIdentifiableSupportingUsers", () => {
  let db: E2EDataSources;
  let supportingUserController: SupportingUserController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    supportingUserController = nestApplication.get(SupportingUserController);
  });

  it("Should create one parent supporting user and save the associated full name when one parent's information is added to the student application.", async () => {
    // Arrange
    const parentFullName = faker.datatype.uuid();
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationData: {
          workflowName: "some-workflow",
          parents: [
            {
              parentFullName,
            },
          ],
        } as ApplicationData,
      },
    );
    const fakePayload = createFakeCreateIdentifiableSupportingUsersPayload({
      applicationId: savedApplication.id,
      supportingUserType: SupportingUserType.Parent,
      parent: 1,
      isAbleToReport: true,
    });

    // Act
    const result =
      await supportingUserController.createIdentifiableSupportingUsers(
        createFakeWorkerJob<
          CreateIdentifiableSupportingUsersJobInDTO,
          ICustomHeaders,
          CreateIdentifiableSupportingUsersJobOutDTO
        >(fakePayload),
      );

    // Asserts
    // Validate DB creation.
    const updatedApplication = await db.application.findOne({
      select: {
        id: true,
        supportingUsers: {
          id: true,
          supportingUserType: true,
          isAbleToReport: true,
          fullName: true,
        },
      },
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(1);
    const [parent] = updatedApplication.supportingUsers;
    expect(parent).toEqual({
      id: expect.any(Number),
      supportingUserType: SupportingUserType.Parent,
      isAbleToReport: true,
      fullName: parentFullName,
    });
    // Validate job result.
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: {
        createdSupportingUserId: parent.id,
      },
    });
  });

  it("Should create the second parent supporting user and save the associated full name when the two parent's information is added to the student application.", async () => {
    // Arrange
    const parentFullName1 = faker.datatype.uuid();
    const parentFullName2 = faker.datatype.uuid();
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationData: {
          workflowName: "some-workflow",
          parents: [
            {
              parentFullName: parentFullName1,
            },
            {
              parentFullName: parentFullName2,
            },
          ],
        } as ApplicationData,
      },
    );
    const fakePayload = createFakeCreateIdentifiableSupportingUsersPayload({
      applicationId: savedApplication.id,
      supportingUserType: SupportingUserType.Parent,
      parent: 2,
      isAbleToReport: false,
    });

    // Act
    const result =
      await supportingUserController.createIdentifiableSupportingUsers(
        createFakeWorkerJob<
          CreateIdentifiableSupportingUsersJobInDTO,
          ICustomHeaders,
          CreateIdentifiableSupportingUsersJobOutDTO
        >(fakePayload),
      );

    // Asserts
    // Validate DB creation.
    const updatedApplication = await db.application.findOne({
      select: {
        id: true,
        supportingUsers: {
          id: true,
          supportingUserType: true,
          isAbleToReport: true,
          fullName: true,
        },
      },
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    expect(updatedApplication.supportingUsers).toHaveLength(1);
    const [parent] = updatedApplication.supportingUsers;
    expect(parent).toEqual({
      id: expect.any(Number),
      supportingUserType: SupportingUserType.Parent,
      isAbleToReport: false,
      fullName: parentFullName2,
    });
    // Validate job result.
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: {
        createdSupportingUserId: parent.id,
      },
    });
  });

  it("Should not create a parent when the parent was already created.", async () => {
    // Arrange
    const parentFullName = faker.datatype.uuid();
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationData: {
          workflowName: "some-workflow",
          parents: [
            {
              parentFullName,
            },
          ],
        } as ApplicationData,
      },
    );
    const parentSupportingUser = await db.supportingUser.save(
      createFakeSupportingUser(
        {
          application: savedApplication,
        },
        {
          initialValues: {
            supportingUserType: SupportingUserType.Parent,
            fullName: parentFullName,
          },
        },
      ),
    );
    const fakePayload = createFakeCreateIdentifiableSupportingUsersPayload({
      applicationId: savedApplication.id,
      supportingUserType: SupportingUserType.Parent,
      parent: 1,
      isAbleToReport: true,
    });

    // Act
    const result =
      await supportingUserController.createIdentifiableSupportingUsers(
        createFakeWorkerJob<
          CreateIdentifiableSupportingUsersJobInDTO,
          ICustomHeaders,
          CreateIdentifiableSupportingUsersJobOutDTO
        >(fakePayload),
      );

    // Asserts
    // Validate DB creation.
    const updatedApplication = await db.application.findOne({
      select: {
        id: true,
        supportingUsers: {
          id: true,
        },
      },
      relations: { supportingUsers: true },
      where: {
        id: savedApplication.id,
      },
    });
    // Ensures the application still has one supporting user.
    expect(updatedApplication.supportingUsers).toHaveLength(1);
    const [parent] = updatedApplication.supportingUsers;
    // Ensures the parent supporting user is the same as the one created before.
    expect(parent.id).toBe(parentSupportingUser.id);
    // Validate job result.
    expect(result).toEqual({
      resultType: MockedZeebeJobResult.Complete,
      outputVariables: {
        createdSupportingUserId: parentSupportingUser.id,
      },
    });
  });

  it("Should throw an error when the full name is expected but it is not present in the application dynamic data.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const fakePayload = createFakeCreateIdentifiableSupportingUsersPayload({
      applicationId: savedApplication.id,
      supportingUserType: SupportingUserType.Parent,
      parent: 1,
      isAbleToReport: true,
    });

    // Act
    const result =
      await supportingUserController.createIdentifiableSupportingUsers(
        createFakeWorkerJob<
          CreateIdentifiableSupportingUsersJobInDTO,
          ICustomHeaders,
          CreateIdentifiableSupportingUsersJobOutDTO
        >(fakePayload),
      );

    // Asserts
    expect(result).toEqual({
      errorCode: SUPPORTING_USER_FULL_NAME_NOT_RESOLVED,
      errorMessage:
        "Not able to extract the full name from the application dynamic data using filter '$.parents[0].parentFullName'.",
      resultType: MockedZeebeJobResult.Error,
    });
  });

  it("Should throw an error when the application does not exist.", async () => {
    // Arrange
    const fakePayload = createFakeCreateIdentifiableSupportingUsersPayload({
      applicationId: 9999,
      supportingUserType: SupportingUserType.Parent,
      parent: 1,
      isAbleToReport: true,
    });

    // Act
    const result =
      await supportingUserController.createIdentifiableSupportingUsers(
        createFakeWorkerJob<
          CreateIdentifiableSupportingUsersJobInDTO,
          ICustomHeaders,
          CreateIdentifiableSupportingUsersJobOutDTO
        >(fakePayload),
      );

    // Asserts
    expect(result).toEqual({
      errorCode: APPLICATION_NOT_FOUND,
      errorMessage: "Application ID not found.",
      resultType: MockedZeebeJobResult.Error,
    });
  });
});
