import {
  ApplicationData,
  NotificationMessageType,
  SupportingUserType,
} from "@sims/sims-db";
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
import { In, IsNull } from "typeorm";

describe("SupportingUserController(e2e)-createIdentifiableSupportingUsers", () => {
  let db: E2EDataSources;
  let supportingUserController: SupportingUserController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    supportingUserController = nestApplication.get(SupportingUserController);
  });

  beforeEach(async () => {
    // Update the date sent for the notifications to current date where the date sent is null.
    await db.notification.update(
      {
        dateSent: IsNull(),
        notificationMessage: {
          id: In([
            NotificationMessageType.ParentDeclarationRequiredParentCanReportNotification,
            NotificationMessageType.ParentDeclarationRequiredParentCannotReportNotification,
          ]),
        },
      },
      { dateSent: new Date() },
    );
  });

  it(
    "Should create a supporting user for the first provided parent, save the associated full name and send a notification to the student. " +
      "The notification indicates that the parent's declaration needs to be completed by the parent when one parent's information is added to the student application, " +
      "with the parent being able to report their own information.",
    async () => {
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

      // Assert
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
      // Validate the creation of notification for the parent declare information
      // to be provided by the parent.
      const notificationMessageType =
        NotificationMessageType.ParentDeclarationRequiredParentCanReportNotification;
      const notification = await db.notification.findOne({
        select: {
          id: true,
          dateSent: true,
          messagePayload: true,
          notificationMessage: { id: true, templateId: true },
          user: { id: true, email: true, firstName: true, lastName: true },
        },
        relations: { notificationMessage: true, user: true },
        where: {
          notificationMessage: {
            id: notificationMessageType,
          },
          user: {
            id: savedApplication.student.user.id,
          },
        },
      });
      expect(notification.dateSent).toBeNull();
      expect(notification.messagePayload).toStrictEqual({
        email_address: notification.user.email,
        template_id: notification.notificationMessage.templateId,
        personalisation: {
          applicationNumber: savedApplication.applicationNumber,
          parentFullName,
          supportingUserType: "parent",
          lastName: notification.user.lastName,
          givenNames: notification.user.firstName,
        },
      });
    },
  );

  it(
    "Should create supporting user for the second provided parent, save the associated full name and send a notification to the student. " +
      "The notification indicates that the parent's declaration needs to be completed by the student when the parent's information is added to the student application, " +
      " with the parent unable to report their information.",
    async () => {
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

      // Assert
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
      // Validate the creation of notification for the parent declare information
      // to be provided by the student.
      const notificationMessageType =
        NotificationMessageType.ParentDeclarationRequiredParentCannotReportNotification;
      const notification = await db.notification.findOne({
        select: {
          id: true,
          dateSent: true,
          messagePayload: true,
          notificationMessage: { id: true, templateId: true },
          user: { id: true, email: true, firstName: true, lastName: true },
        },
        relations: { notificationMessage: true, user: true },
        where: {
          notificationMessage: {
            id: notificationMessageType,
          },
          user: {
            id: savedApplication.student.user.id,
          },
        },
      });
      expect(notification.dateSent).toBeNull();
      expect(notification.messagePayload).toStrictEqual({
        email_address: notification.user.email,
        template_id: notification.notificationMessage.templateId,
        personalisation: {
          applicationNumber: savedApplication.applicationNumber,
          parentFullName: parentFullName2,
          supportingUserType: "parent",
          lastName: notification.user.lastName,
          givenNames: notification.user.firstName,
        },
      });
    },
  );

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

    // Assert
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

    // Assert
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

    // Assert
    expect(result).toEqual({
      errorCode: APPLICATION_NOT_FOUND,
      errorMessage: "Application ID not found.",
      resultType: MockedZeebeJobResult.Error,
    });
  });
});
