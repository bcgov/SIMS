import {
  createE2EDataSources,
  createFakeNotification,
  E2EDataSources,
  saveFakeApplication,
  saveFakeNotificationMessage,
} from "@sims/test-utils";
import {
  FAKE_WORKER_JOB_ERROR_CODE_PROPERTY,
  FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY,
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { NotificationController } from "../../notification.controller";
import { createFakeSendEmailNotificationPayload } from "./send-email-notification-factory";
import { EmailNotificationRecipient } from "@sims/services/notifications";
import { GC_NOTIFY_TEMPLATE_IDS } from "@sims/test-utils/constants";
import { NotificationMessage, NotificationMessageType } from "@sims/sims-db";
import { randomUUID } from "node:crypto";
import { IsNull } from "typeorm";
import { NOTIFICATION_MISSING_EMAIL_CONTACTS } from "@sims/services/constants";

describe("NotificationController(e2e)-sendEmailNotification", () => {
  let db: E2EDataSources;
  let notificationController: NotificationController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    notificationController = nestApplication.get(NotificationController);
  });

  it("Should create a student email notification resolving the personalisation from the provided paths when the recipient is the student.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const { student } = savedApplication;
    const payload = createFakeSendEmailNotificationPayload(
      GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
      EmailNotificationRecipient.Student,
      savedApplication.currentAssessment.id,
      {
        personalisation: {
          givenNames: "studentGivenNames",
          lastName: "studentLastName",
        },
      },
    );

    // Act
    const result = await notificationController.sendEmailNotification(payload);

    // Asserts
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Complete,
    });
    const createdNotification = await db.notification.findOne({
      select: {
        id: true,
        messagePayload: true,
        metadata: true,
        notificationMessage: { id: true },
      },
      relations: { notificationMessage: true },
      where: { user: { id: student.user.id } },
    });
    expect(createdNotification).toEqual({
      id: expect.any(Number),
      notificationMessage: {
        id: NotificationMessageType.FormerYouthInCareNotification,
      },
      messagePayload: {
        template_id: GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
        email_address: student.user.email,
        personalisation: {
          givenNames: student.user.firstName ?? "",
          lastName: student.user.lastName,
        },
      },
      metadata: null,
    });
  });

  it("Should create a new email notification when the notification with same templateId and metadata does not already exist.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const { student } = savedApplication;
    // Prepare an existing notification for the same message to ensure a new one
    // is still created when no uniqueness criteria is provided.
    const existingNotification = createFakeNotification({
      user: student.user,
      notificationMessage: {
        id: NotificationMessageType.FormerYouthInCareNotification,
      } as NotificationMessage,
    });
    await db.notification.save(existingNotification);
    const payload = createFakeSendEmailNotificationPayload(
      GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
      EmailNotificationRecipient.Student,
      savedApplication.currentAssessment.id,
    );

    // Act
    const result = await notificationController.sendEmailNotification(payload);

    // Asserts
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Complete,
    });
    const notificationsCount = await db.notification.count({
      where: {
        user: { id: student.user.id },
        notificationMessage: {
          id: NotificationMessageType.FormerYouthInCareNotification,
        },
      },
    });
    // The prepared notification plus the one created by the worker.
    expect(notificationsCount).toBe(2);
  });

  it("Should not create a duplicate email notification when a notification with the same metadata already exists.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const { student } = savedApplication;
    const parentApplicationId = savedApplication.parentApplication.id;
    // Prepare an existing notification with the same metadata to ensure the
    // worker does not create a duplicate.
    const existingNotification = createFakeNotification(
      {
        user: student.user,
        notificationMessage: {
          id: NotificationMessageType.FormerYouthInCareNotification,
        } as NotificationMessage,
      },
      { initialValue: { metadata: { parentApplicationId } } },
    );
    await db.notification.save(existingNotification);
    const payload = createFakeSendEmailNotificationPayload(
      GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
      EmailNotificationRecipient.Student,
      savedApplication.currentAssessment.id,
      {
        metadata: { parentApplicationId },
      },
    );

    // Act
    const result = await notificationController.sendEmailNotification(payload);

    // Asserts
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Complete,
    });
    const notificationsCount = await db.notification.count({
      where: {
        user: { id: student.user.id },
        notificationMessage: {
          id: NotificationMessageType.FormerYouthInCareNotification,
        },
      },
    });
    // Only the prepared notification is expected, no duplicate is created.
    expect(notificationsCount).toBe(1);
  });

  it("Should create a ministry email notification for each configured email contact when the recipient is the ministry.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const ministryEmailContact = `ministry-${randomUUID()}@example.com`;
    // Create an isolated notification message configured with the email contact used to
    // address the ministry notification.
    const ministryNotificationMessage = await saveFakeNotificationMessage(
      db.dataSource,
      { initialValue: { emailContacts: [ministryEmailContact] } },
    );
    const payload = createFakeSendEmailNotificationPayload(
      ministryNotificationMessage.templateId,
      EmailNotificationRecipient.Ministry,
      savedApplication.currentAssessment.id,
      {
        personalisation: { applicationNumber: "applicationNumber" },
      },
    );

    // Act
    const result = await notificationController.sendEmailNotification(payload);

    // Asserts
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Complete,
    });
    const createdNotification = await db.notification.findOne({
      select: {
        id: true,
        messagePayload: true,
        metadata: true,
        user: { id: true },
        notificationMessage: { id: true },
      },
      relations: { user: true, notificationMessage: true },
      where: {
        notificationMessage: { id: ministryNotificationMessage.id },
        user: IsNull(),
      },
      order: { id: "DESC" },
    });
    expect(createdNotification).toEqual({
      id: expect.any(Number),
      user: null,
      notificationMessage: {
        id: ministryNotificationMessage.id,
      },
      messagePayload: {
        template_id: ministryNotificationMessage.templateId,
        email_address: ministryEmailContact,
        personalisation: {
          applicationNumber: savedApplication.applicationNumber,
        },
      },
      metadata: null,
    });
  });

  it("Should fail the job raising an incident when no email contact is associated with a ministry notification message.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const { student } = savedApplication;
    const payload = createFakeSendEmailNotificationPayload(
      GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
      EmailNotificationRecipient.Ministry,
      savedApplication.currentAssessment.id,
    );

    // Act
    const result = await notificationController.sendEmailNotification(payload);

    // Asserts
    // The job fails, raising an incident, since the ministry notification
    // message has no email contacts configured.
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Error,
      [FAKE_WORKER_JOB_ERROR_CODE_PROPERTY]:
        NOTIFICATION_MISSING_EMAIL_CONTACTS,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]: `No email contacts are configured for the Ministry notification with template ${GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification}.`,
    });
    // No notification is created for the student.
    const notificationsCount = await db.notification.count({
      where: { user: { id: student.user.id } },
    });
    expect(notificationsCount).toBe(0);
  });

  it("Should fail the job raising an incident when the template id is not associated with any existing notification message.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const unknownTemplateId = randomUUID();
    const payload = createFakeSendEmailNotificationPayload(
      unknownTemplateId,
      EmailNotificationRecipient.Student,
      savedApplication.currentAssessment.id,
    );

    // Act
    const result = await notificationController.sendEmailNotification(payload);

    // Asserts
    // The job fails, raising an incident, since the template is not seeded and
    // notification messages are no longer created at runtime.
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Fail,
      [FAKE_WORKER_JOB_ERROR_MESSAGE_PROPERTY]: expect.stringContaining(
        `Notification message not found for template id ${unknownTemplateId}`,
      ),
    });
  });
});
