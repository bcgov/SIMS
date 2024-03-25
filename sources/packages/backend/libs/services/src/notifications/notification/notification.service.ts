import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Notification,
  User,
  NotificationMessage,
  PermanentFailureError,
} from "@sims/sims-db";
import {
  DataSource,
  EntityManager,
  InsertResult,
  IsNull,
  UpdateResult,
} from "typeorm";
import { GCNotifyService } from "./gc-notify.service";
import {
  NotificationProcessingSummary,
  SaveNotificationModel,
} from "./notification.model";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  NotificationEmailMessage,
  GCNotifyErrorResponse,
} from "./gc-notify.model";
import { CustomNamedError, processInParallel } from "@sims/utilities";
import { GC_NOTIFY_PERMANENT_FAILURE_ERROR } from "@sims/services/constants";

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
    const newNotifications = notifications.map((notification) => ({
      user: { id: notification.userId } as User,
      creator: { id: auditUserId } as User,
      messagePayload: notification.messagePayload,
      notificationMessage: {
        id: notification.messageType,
      } as NotificationMessage,
      metadata: notification.metadata,
    }));
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
   * Updates the date sent column of the inbox notification record.
   * @param notificationId notification id.
   * @param permanentFailureError Error details of a permanent failure if occurred while processing the notification.
   * @returns result of the record updated.
   */
  async updateNotification(
    notificationId: number,
    permanentFailureError?: PermanentFailureError[],
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
   * @param pollingRecordsLimit Maximum number of notifications to be processed in one chunk of
   * processing.
   * @returns processing summary.
   */
  async processUnsentNotifications(
    pollingRecordsLimit: number,
  ): Promise<NotificationProcessingSummary> {
    return await this.processUnsentNotificationsRecursive(pollingRecordsLimit);
  }

  /**
   * Call GC Notify to process the given notification.
   * @param notification notification to be processed.
   * @returns status of notification processing.
   */
  private async sendEmailNotification(
    notification: Notification,
  ): Promise<boolean> {
    // Call GC Notify send email method.
    try {
      await this.gcNotifyService.sendEmailNotification(
        notification.messagePayload as NotificationEmailMessage,
      );
      await this.updateNotification(notification.id);
      return true;
    } catch (error: unknown) {
      this.logger.error(`Error while processing notification: ${error}`);
      if (
        error instanceof CustomNamedError &&
        error.name === GC_NOTIFY_PERMANENT_FAILURE_ERROR
      ) {
        const processNotificationError =
          error.objectInfo as GCNotifyErrorResponse;
        await this.updateNotification(
          notification.id,
          processNotificationError.errors,
        );
        return false;
      }
      throw error;
    }
  }

  /**
   * Process all the unsent notifications with a polling limit recursively.
   * Processing continues recursively until all the records are processed.
   * Call GCNotify to send email notification.
   * @param pollingLimit Maximum number of notifications to be processed in one chunk of
   * processing.
   * @param notificationsProcessed optional param used to
   * increment the total count on recursion.
   * @param notificationsSuccessfullyProcessed optional param used to
   * increment the successfully processed count count on recursion.
   * @returns processing summary.
   */
  private async processUnsentNotificationsRecursive(
    pollingRecordsLimit: number,
    notificationsProcessed = 0,
    notificationsSuccessfullyProcessed = 0,
  ): Promise<NotificationProcessingSummary> {
    const notificationsToProcess = await this.repo.find({
      select: {
        id: true,
        messagePayload: true,
      },
      where: {
        dateSent: IsNull(),
      },
      order: {
        createdAt: "ASC",
      },
      take: pollingRecordsLimit,
    });

    if (notificationsToProcess.length) {
      this.logger.log(
        `Processing ${notificationsToProcess.length} notifications`,
      );

      const resolvedResponses = await processInParallel(
        (notification: Notification) =>
          this.sendEmailNotification(notification),
        notificationsToProcess,
      );

      notificationsSuccessfullyProcessed += resolvedResponses.filter(
        (result) => result,
      ).length;

      //Assign the value for total notifications processed.
      notificationsProcessed += notificationsToProcess.length;

      // Calling process notification in recursion until all the notifications
      // are processed.
      const response = await this.processUnsentNotificationsRecursive(
        pollingRecordsLimit,
        notificationsProcessed,
        notificationsSuccessfullyProcessed,
      );
      notificationsProcessed = response.notificationsProcessed;
      notificationsSuccessfullyProcessed =
        response.notificationsSuccessfullyProcessed;
    }
    return {
      notificationsProcessed,
      notificationsSuccessfullyProcessed,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
