import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  FAKE_WORKER_JOB_RESULT_PROPERTY,
  MockedZeebeJobResult,
} from "../../../../../test/utils/worker-job-mock";
import { createTestingAppModule } from "../../../../../test/helpers";
import { NotificationController } from "../../notification.controller";
import { createFakeSendEmailNotificationPayload } from "./send-email-notification-factory";
import { WorkflowEmailNotificationRecipient } from "@sims/services/notifications";
import { GC_NOTIFY_TEMPLATE_IDS } from "@sims/test-utils/constants";
import { NotificationMessageType } from "@sims/sims-db";
import { randomUUID } from "node:crypto";

/**
 * Base id from which auto-generated notification messages are created to avoid
 * collisions with the notification messages seeded during migrations.
 */
const AUTO_GENERATED_NOTIFICATION_MESSAGE_ID_BASE = 1000000;

describe("NotificationController(e2e)-sendEmailNotification", () => {
  let db: E2EDataSources;
  let notificationController: NotificationController;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    db = createE2EDataSources(dataSource);
    notificationController = nestApplication.get(NotificationController);
  });

  it("Should create a student email notification loading the student personal information when the recipient is the student.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const { student } = savedApplication;
    const payload = createFakeSendEmailNotificationPayload({
      templateId: GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
      recipientType: WorkflowEmailNotificationRecipient.Student,
      assessmentId: savedApplication.currentAssessment.id,
      emailNotificationPersonalisation: { applicationNumber: "1234567890" },
    });

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
          applicationNumber: "1234567890",
          givenNames: student.user.firstName ?? "",
          lastName: student.user.lastName,
        },
      },
      metadata: null,
    });
  });

  it("Should send a new email notification every time when the check metadata is empty allowing a student to receive multiple emails.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const { student } = savedApplication;
    const payload = createFakeSendEmailNotificationPayload({
      templateId: GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
      recipientType: WorkflowEmailNotificationRecipient.Student,
      assessmentId: savedApplication.currentAssessment.id,
      emailNotificationCheckMetadata: {},
    });

    // Act
    // Execute the worker twice to ensure a new notification is created each time
    // when no uniqueness criteria is provided.
    await notificationController.sendEmailNotification(payload);
    await notificationController.sendEmailNotification(payload);

    // Asserts
    const notificationsCount = await db.notification.count({
      where: {
        user: { id: student.user.id },
        notificationMessage: {
          id: NotificationMessageType.FormerYouthInCareNotification,
        },
      },
    });
    expect(notificationsCount).toBe(2);
  });

  it("Should create one email notification per application allowing a student with multiple applications to receive one email for each application.", async () => {
    // Arrange
    const firstApplication = await saveFakeApplication(db.dataSource);
    const { student } = firstApplication;
    // Create a second application for the same student.
    const secondApplication = await saveFakeApplication(db.dataSource, {
      student,
    });
    const firstApplicationPayload = createFakeSendEmailNotificationPayload({
      templateId: GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
      recipientType: WorkflowEmailNotificationRecipient.Student,
      assessmentId: firstApplication.currentAssessment.id,
      emailNotificationCheckMetadata: {
        applicationNumber: firstApplication.applicationNumber,
      },
    });
    const secondApplicationPayload = createFakeSendEmailNotificationPayload({
      templateId: GC_NOTIFY_TEMPLATE_IDS.FormerYouthInCareNotification,
      recipientType: WorkflowEmailNotificationRecipient.Student,
      assessmentId: secondApplication.currentAssessment.id,
      emailNotificationCheckMetadata: {
        applicationNumber: secondApplication.applicationNumber,
      },
    });

    // Act
    // Execute the worker twice per application to ensure a single notification
    // is created for each application.
    await notificationController.sendEmailNotification(firstApplicationPayload);
    await notificationController.sendEmailNotification(firstApplicationPayload);
    await notificationController.sendEmailNotification(
      secondApplicationPayload,
    );
    await notificationController.sendEmailNotification(
      secondApplicationPayload,
    );

    // Asserts
    const notificationsCount = await db.notification.count({
      where: {
        user: { id: student.user.id },
        notificationMessage: {
          id: NotificationMessageType.FormerYouthInCareNotification,
        },
      },
    });
    // The student has two applications, so exactly two notifications are expected.
    expect(notificationsCount).toBe(2);
  });

  it("Should auto-create a notification message when the template id is not associated with any existing notification message.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource);
    const { student } = savedApplication;
    const unknownTemplateId = randomUUID();
    const payload = createFakeSendEmailNotificationPayload({
      templateId: unknownTemplateId,
      recipientType: WorkflowEmailNotificationRecipient.Student,
      assessmentId: savedApplication.currentAssessment.id,
    });

    // Act
    const result = await notificationController.sendEmailNotification(payload);

    // Asserts
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Complete,
    });
    const autoCreatedMessage = await db.notificationMessage.findOne({
      select: { id: true, templateId: true },
      where: { templateId: unknownTemplateId },
    });
    expect(autoCreatedMessage.id).toBeGreaterThanOrEqual(
      AUTO_GENERATED_NOTIFICATION_MESSAGE_ID_BASE,
    );
    const createdNotification = await db.notification.findOne({
      select: { id: true, notificationMessage: { id: true } },
      relations: { notificationMessage: true },
      where: { user: { id: student.user.id } },
    });
    expect(createdNotification.notificationMessage.id).toBe(
      autoCreatedMessage.id,
    );
  });

  it("Should not create any email notification when the recipient is the Ministry and no email contact is configured.", async () => {
    // Arrange
    // Use an unknown template id so the auto-created notification message has no
    // email contacts configured.
    const unknownTemplateId = randomUUID();
    const payload = createFakeSendEmailNotificationPayload({
      templateId: unknownTemplateId,
      recipientType: WorkflowEmailNotificationRecipient.Ministry,
      emailNotificationPersonalisation: { applicationNumber: "1234567890" },
    });

    // Act
    const result = await notificationController.sendEmailNotification(payload);

    // Asserts
    // The job completes successfully but no notification is created since there
    // are no email contacts to send the notification to.
    expect(result).toEqual({
      [FAKE_WORKER_JOB_RESULT_PROPERTY]: MockedZeebeJobResult.Complete,
    });
    const autoCreatedMessage = await db.notificationMessage.findOne({
      select: { id: true },
      where: { templateId: unknownTemplateId },
    });
    const notificationsCount = await db.notification.count({
      where: { notificationMessage: { id: autoCreatedMessage.id } },
    });
    expect(notificationsCount).toBe(0);
  });
});
