import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Notification,
  User,
  NotificationMessage,
  NotificationMessageType,
} from "@sims/sims-db";
import { NotificationMetadata } from "@sims/sims-db/entities/notification-metadata.type";
import {
  DataSource,
  EntityManager,
  InsertResult,
  IsNull,
  MoreThan,
  UpdateResult,
} from "typeorm";
import { GCNotifyService } from "./gc-notify.service";
import {
  NotificationProcessingSummary,
  SaveNotificationModel,
} from "./notification.model";
import { LoggerService } from "@sims/utilities/logger";
import { NotificationEmailMessage } from "./gc-notify.model";
import { CustomNamedError, processInParallel } from "@sims/utilities";
import {
  NOTIFY_LIMIT_EXCEEDED_ERROR,
  NOTIFY_PERMANENT_FAILURE_ERROR,
} from "@sims/services/constants";
import { FeatureTogglesService } from "../../feature-toggles/feature-toggles";
import { NotifyService } from "./notify.service";
import {
  NotificationAttachment,
  NotificationParams,
  NotifyMessageContent,
} from "@sims/services/notifications";
import dayjs from "dayjs";

/**
 * While performing a possible huge amount of inserts,
 * breaks the execution in chunks.
 */
const NOTIFICATIONS_INSERT_CHUNK_SIZE = 1000;

@Injectable()
export class NotificationService extends RecordDataModelService<Notification> {
  constructor(
    dataSource: DataSource,
    private readonly gcNotifyService: GCNotifyService,
    private readonly notifyService: NotifyService,
    private readonly logger: LoggerService,
    private readonly featureTogglesService: FeatureTogglesService,
  ) {
    super(dataSource.getRepository(Notification));
  }

  /**
   * Saves all notifications.
   * @param notifications information to create the notifications.
   * @param auditUserId id of the user creating the notifications.
   * @param options save notification options.
   * - `entityManager` optional repository that can be provided, for instance,
   * to execute the command as part of an existing transaction. If not provided
   * the local repository will be used instead.
   * @returns created notification ids.
   */
  async saveNotifications(
    notifications: SaveNotificationModel[],
    auditUserId: number,
    options?: {
      entityManager?: EntityManager;
    },
  ): Promise<number[]> {
    const newNotifications = notifications.map((notification) => {
      const { messagePayload, messageContent } =
        this.getNotificationMessage(notification);
      return {
        user: { id: notification.userId } as User,
        creator: { id: auditUserId } as User,
        messagePayload,
        notificationMessage: {
          id: notification.messageType,
        } as NotificationMessage,
        metadata: notification.metadata,
        templateId: notification.notifyTemplateId,
        recipients: [messagePayload.email_address],
        messageContent,
      };
    });
    const repository =
      options?.entityManager?.getRepository(Notification) ?? this.repo;
    // Breaks the execution in chunks to allow the inserts of a huge amount of records.
    // During the tests the execution started to failed at 20,000 records. Even not being
    // the expected amount of records, the code will be able to process this amount under
    // an unusual circumstance. The TypeOrm "save" method has the chunk size as an option
    // but the TypeOrm "insert" performance is way better due to the simplicity of the operation.
    const insertResults: InsertResult[] = [];
    while (newNotifications.length) {
      const insertChunk = newNotifications.splice(
        0,
        NOTIFICATIONS_INSERT_CHUNK_SIZE,
      );
      const insertResult = await repository.insert(insertChunk);
      insertResults.push(insertResult);
    }
    return insertResults
      .flatMap((insertResult) => insertResult.identifiers)
      .map((identifier) => +identifier.id);
  }

  /**
   * Create the GC Notify payload and BC Notify message content to be saved
   * and allow any notification be sent to either notification API.
   * This is a temporary message conversion to be refactored once GC Notify is removed.
   * @param notification notification to be processed.
   * @returns an object containing the GC Notify message payload and the
   * BC Notify message content.
   */
  private getNotificationMessage(notification: SaveNotificationModel): {
    messagePayload: NotificationEmailMessage;
    messageContent: NotifyMessageContent;
  } {
    const messagePayload =
      notification.messagePayload as NotificationEmailMessage;
    const { application_file: applicationFile, ...params } =
      messagePayload.personalisation;
    const messageContent: NotifyMessageContent = {
      params: params as NotificationParams,
      attachments: applicationFile
        ? [
            {
              content: applicationFile["file"],
              filename: applicationFile["filename"],
              mimeType: applicationFile["mimeType"],
            } as NotificationAttachment,
          ]
        : undefined,
    };
    if (messagePayload.personalisation.application_file) {
      // Removed additional property that is unknown to GC Notify
      // and used only for the new Notify API.
      delete messagePayload.personalisation.application_file["mimeType"];
    }
    return {
      messagePayload,
      messageContent,
    };
  }

  /**
   * Updates the date sent column of the inbox notification record.
   * @param notificationId notification id.
   * @param permanentFailureError Error details of a permanent failure if occurred while processing the notification.
   * @returns result of the record updated.
   */
  async updateNotification(
    notificationId: number,
    permanentFailureError?: unknown,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: notificationId,
      },
      { dateSent: new Date(), permanentFailureError },
    );
  }

  /**
   * Process all the unsent notifications with a polling limit.
   * Processing continues recursively until all the records are processed.
   * Call GCNotify to send email notification.
   * @param pollingRecordsLimit Maximum number of notifications retrieved from DB to be processed
   * in one chunk of processing.
   * @param externalRateLimit Maximum number of notifications to be sent to the external service
   * within the rate limit window.
   * @param externalRateLimitSeconds Duration of the rate limit window in seconds.
   * @returns processing summary.
   */
  async processUnsentNotifications(
    pollingRecordsLimit: number,
    externalRateLimit: number,
    externalRateLimitSeconds: number,
  ): Promise<NotificationProcessingSummary> {
    return await this.processUnsentNotificationsRecursive(
      pollingRecordsLimit,
      externalRateLimit,
      externalRateLimitSeconds,
    );
  }

  /**
   * Checks if a notification of the provided type already exists matching the
   * provided metadata. Used to prevent sending duplicate emails while allowing
   * the uniqueness scope to be defined dynamically.
   * - Pass `{ parentApplicationId }` to enforce a single notification per
   * application, remaining stable across application edits.
   * @param notificationMessageType notification message type to be verified.
   * @param metadata metadata that must match an existing notification.
   * @param entityManager entity manager to be part of the transaction.
   * @returns true if a matching notification already exists, otherwise false.
   */
  async checkNotificationExists(
    notificationMessageType: NotificationMessageType,
    metadata: NotificationMetadata,
    entityManager: EntityManager,
  ): Promise<boolean> {
    return entityManager.getRepository(Notification).exists({
      where: {
        notificationMessage: { id: notificationMessageType },
        metadata: metadata ?? null,
      },
    });
  }

  /**
   * Call GC Notify to process the given notification.
   * @param notification notification to be processed.
   * @returns status of notification processing.
   */
  private async sendEmailNotification(
    notification: Notification,
  ): Promise<boolean> {
    try {
      const notificationService = this.featureTogglesService.useNotifyTemplate(
        notification.templateId,
      )
        ? this.notifyService
        : this.gcNotifyService;
      await notificationService.sendEmailNotification(notification);
      await this.updateNotification(notification.id);
      return true;
    } catch (error: unknown) {
      this.logger.error(`Error while processing notification: ${error}`);
      if (
        error instanceof CustomNamedError &&
        error.name === NOTIFY_PERMANENT_FAILURE_ERROR
      ) {
        await this.updateNotification(notification.id, error.objectInfo);
        return false;
      }
      throw error;
    }
  }

  /**
   * Process all the unsent notifications with a polling limit recursively, up to the rate limit.
   * Processing continues recursively until all the records are processed or the rate limit is reached.
   * If the external service reports the rate limit was exceeded, the service stops processing as
   * soon as the first {@link NOTIFY_LIMIT_EXCEEDED_ERROR} is encountered and the remaining
   * notifications in the current batch are left unsent to be retried in the next polling cycle.
   * @param pollingRecordsLimit Maximum number of notifications retrieved from DB to be processed
   * in one chunk of processing.
   * @param externalRateLimit Maximum number of notifications to be sent to the external service
   * within the rate limit window.
   * @param externalRateLimitSeconds Duration of the rate limit window in seconds.
   * @param notificationsProcessed optional param used to
   * increment the total count on recursion.
   * @param notificationsSuccessfullyProcessed optional param used to
   * increment the successfully processed count count on recursion.
   * @returns processing summary.
   */
  private async processUnsentNotificationsRecursive(
    pollingRecordsLimit: number,
    externalRateLimit: number,
    externalRateLimitSeconds: number,
    notificationsProcessed = 0,
    notificationsSuccessfullyProcessed = 0,
  ): Promise<NotificationProcessingSummary> {
    const messagesSentWithinRateLimitWindow =
      await this.getMessagesSentWithinRateLimitWindow(externalRateLimitSeconds);
    const messagesAvailableToSend =
      externalRateLimit - messagesSentWithinRateLimitWindow;
    if (messagesAvailableToSend <= 0) {
      this.logger.log(
        `Rate limit reached. Messages already sent within the rate window: ${messagesSentWithinRateLimitWindow}.`,
      );
      return {
        notificationsProcessed,
        notificationsSuccessfullyProcessed,
      };
    }
    const limit = Math.min(pollingRecordsLimit, messagesAvailableToSend);
    const notificationsToProcess = await this.repo.find({
      select: {
        id: true,
        messagePayload: true,
        messageContent: true,
        recipients: true,
        templateId: true,
      },
      where: {
        dateSent: IsNull(),
      },
      order: {
        createdAt: "ASC",
      },
      take: limit,
    });
    if (!notificationsToProcess.length) {
      return {
        notificationsProcessed,
        notificationsSuccessfullyProcessed,
      };
    }
    this.logger.log(
      `Processing ${notificationsToProcess.length} out of a limit of ${limit}.`,
    );
    try {
      await processInParallel(async (notification: Notification) => {
        this.logger.log(`Processing notification ID ${notification.id}`);
        // Call the sendEmailNotification method to send the email.
        const result = await this.sendEmailNotification(notification);
        // Assign the value for total notifications processed. Incremented as soon
        // as the notification is attempted so that, if a later notification in this
        // same batch causes the rate limit error below, the ones already attempted
        // are still accounted for.
        notificationsProcessed++;
        if (result) {
          notificationsSuccessfullyProcessed++;
        }
      }, notificationsToProcess);
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === NOTIFY_LIMIT_EXCEEDED_ERROR
      ) {
        // An API call that triggers a rate limit error has occurred should be counted as processed.
        notificationsProcessed++;
        // Limit exceeded error, will retry in the next polling cycle.
        this.logger.warn(error.message);
        // Prevent further processing in this cycle due to limit exceeded.
        return {
          notificationsProcessed,
          notificationsSuccessfullyProcessed,
        };
      }
      // Allow other errors to be thrown and handled by the caller.
      throw error;
    }
    // Calling process notification in recursion until all the notifications
    // are processed.
    const response = await this.processUnsentNotificationsRecursive(
      pollingRecordsLimit,
      externalRateLimit,
      externalRateLimitSeconds,
      notificationsProcessed,
      notificationsSuccessfullyProcessed,
    );
    notificationsProcessed = response.notificationsProcessed;
    notificationsSuccessfullyProcessed =
      response.notificationsSuccessfullyProcessed;
    return {
      notificationsProcessed,
      notificationsSuccessfullyProcessed,
    };
  }

  /**
   * Number of notifications sent within the rate limit window.
   * @param externalRateLimitSeconds Duration of the rate limit window in seconds.
   * @returns Number of notifications sent within the rate limit window.
   */
  private async getMessagesSentWithinRateLimitWindow(
    externalRateLimitSeconds: number,
  ): Promise<number> {
    const rateLimitWindow = dayjs().subtract(
      externalRateLimitSeconds,
      "seconds",
    );
    return await this.repo.count({
      where: {
        dateSent: MoreThan(rateLimitWindow.toDate()),
      },
    });
  }
}
