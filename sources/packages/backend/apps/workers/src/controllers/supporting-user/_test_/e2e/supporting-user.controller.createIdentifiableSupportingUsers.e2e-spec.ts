import {
  Application,
  ApplicationData,
  Notification,
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
import { faker } from "@faker-js/faker";
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

  it(
    "Should create supporting user for the first provided parent and save the associated full name when one parent's information is added to the student application " +
      "and create a student notification for parent declaration required by parent.",
    async () => {
      // Arrange
      const parentFullName = faker.string.uuid();
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
      await notificationLookupAndAssertion(
        savedApplication,
        parentFullName,
        NotificationMessageType.ParentInformationRequiredFromParentNotification,
      );
    },
  );

  it(
    "Should create supporting user for the second provided parent and save the associated full name when the two parent's information is added to the student application " +
      "and create a student notification for parent declaration required by student.",
    async () => {
      // Arrange
      const parentFullName1 = faker.string.uuid();
      const parentFullName2 = faker.string.uuid();
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
      await notificationLookupAndAssertion(
        savedApplication,
        parentFullName2,
        NotificationMessageType.ParentInformationRequiredFromStudentNotification,
      );
    },
  );

  it("Should not create a parent when the parent was already created.", async () => {
    // Arrange
    const parentFullName = faker.string.uuid();
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

  describe("Should create supporting user for the partner and create a notification for partner declaration required when the student is married and ", () => {
    const ABLE_TO_REPORT_OPTIONS = [true, false];
    for (const ableToReport of ABLE_TO_REPORT_OPTIONS) {
      it(`partner able to report is ${ableToReport} `, async () => {
        // Arrange
        const partnerFullName = faker.string.uuid();
        const savedApplication = await saveFakeApplication(
          db.dataSource,
          undefined,
          {
            applicationData: {
              workflowName: "some-workflow",
              partnerFullName,
            } as ApplicationData,
          },
        );
        const fakePayload = createFakeCreateIdentifiableSupportingUsersPayload({
          applicationId: savedApplication.id,
          supportingUserType: SupportingUserType.Partner,
          isAbleToReport: ableToReport,
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
        const [partner] = updatedApplication.supportingUsers;
        expect(partner).toEqual({
          id: expect.any(Number),
          supportingUserType: SupportingUserType.Partner,
          isAbleToReport: ableToReport,
          fullName: partnerFullName,
        });
        // Validate job result.
        expect(result).toEqual({
          resultType: MockedZeebeJobResult.Complete,
          outputVariables: {
            createdSupportingUserId: partner.id,
          },
        });
        // Validate the creation of notification for the partner declare information
        // to be provided by the partner.
        const notification = await notificationLookup(
          savedApplication,
          NotificationMessageType.SupportingUserInformationNotification,
        );
        expect(notification.dateSent).toBeNull();
        expect(notification.messagePayload).toStrictEqual({
          email_address: savedApplication.student.user.email,
          template_id: notification.notificationMessage.templateId,
          personalisation: {
            supportingUserType: "partner",
            lastName: savedApplication.student.user.lastName,
            givenNames: savedApplication.student.user.firstName,
          },
        });
      });
    }
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

  /**
   * Helper function to lookup notifications and perform assertions for parents.
   * @param savedApplication the saved application.
   * @param parentFullName the full name of the parent.
   * @param notificationMessageType the notification message type to check.
   */
  async function notificationLookupAndAssertion(
    savedApplication: Application,
    parentFullName: string,
    notificationMessageType: NotificationMessageType,
  ): Promise<void> {
    const notification = await notificationLookup(
      savedApplication,
      notificationMessageType,
    );
    expect(notification.dateSent).toBeNull();
    expect(notification.messagePayload).toStrictEqual({
      email_address: savedApplication.student.user.email,
      template_id: notification.notificationMessage.templateId,
      personalisation: {
        applicationNumber: savedApplication.applicationNumber,
        parentFullName,
        supportingUserType: "parent",
        lastName: savedApplication.student.user.lastName,
        givenNames: savedApplication.student.user.firstName,
      },
    });
  }

  /**
   * Helper function to lookup notifications.
   * @param savedApplication the saved application.
   * @param notificationMessageType the notification message type to check.
   */
  async function notificationLookup(
    savedApplication: Application,
    notificationMessageType: NotificationMessageType,
  ): Promise<Notification> {
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
    return notification;
  }
});
