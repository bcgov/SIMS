import { HttpStatus, Injectable } from "@nestjs/common";
import { AxiosError } from "axios";
import { LoggerService } from "@sims/utilities/logger";
import { ConfigService, Notify } from "@sims/utilities/config";
import { CustomNamedError } from "@sims/utilities";
import {
  NOTIFY_LIMIT_EXCEEDED_ERROR,
  NOTIFY_PERMANENT_FAILURE_ERROR,
} from "@sims/services/constants";
import { HttpService } from "@nestjs/axios";
import { NotifyAPIMessagePayload, NotifyMessageContent } from "./notify.model";
import { Notification } from "@sims/sims-db";

const AUTH_HEADER = "x-api-key";
const NO_ERROR_DATA_AVAILABLE = "Error data is not available";

@Injectable()
export class NotifyService {
  private readonly notifyConfig: Notify;
  constructor(
    readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {
    this.notifyConfig = configService.notify;
  }

  /**
   * Send email notification.
   * @param notification data to create the email to be sent.
   */
  async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      const payload = this.createNotifyAPIMessagePayload(notification);
      const response = await this.httpService.axiosRef.post(
        this.notifyConfig.url,
        payload,
        {
          headers: { [AUTH_HEADER]: this.notifyConfig.apiKey },
        },
      );
      this.logger.log(
        `Email notification ID ${notification.id} sent successfully: ${JSON.stringify(
          response.data,
        )}`,
      );
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.isAxiosError) {
        switch (axiosError.response?.status) {
          case HttpStatus.TOO_MANY_REQUESTS:
            this.logger.error(
              `Notify API call failed for email notification ID ${notification.id} due too may requests.`,
              error,
            );
            throw new CustomNamedError(
              axiosError.message,
              NOTIFY_LIMIT_EXCEEDED_ERROR,
            );
          case HttpStatus.BAD_REQUEST:
          case HttpStatus.UNPROCESSABLE_ENTITY:
          case HttpStatus.PAYLOAD_TOO_LARGE:
            this.logger.error(
              `Error while sending email notification ID ${notification.id}: ${JSON.stringify(
                axiosError.response,
              )}`,
            );
            throw new CustomNamedError(
              axiosError.message,
              NOTIFY_PERMANENT_FAILURE_ERROR,
              axiosError.response?.data ?? NO_ERROR_DATA_AVAILABLE,
            );
        }
      }
      this.logger.error(
        `Error error while sending email notification ID ${notification.id}. This error will cause the notification to be retried.`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create the Notify API message payload from the given notification.
   * @param notification data to create the email payload to be sent.
   * @returns Notify API message payload.
   */
  private createNotifyAPIMessagePayload(
    notification: Notification,
  ): NotifyAPIMessagePayload {
    const notifyMessageContent =
      notification.messageContent as NotifyMessageContent;
    const notifyAPIMessagePayload: NotifyAPIMessagePayload = {
      params: notifyMessageContent.params,
      email: {
        recipients: {
          to: notification.recipients,
        },
        content: {
          templateId: notification.templateId,
        },
        attachments: notifyMessageContent.attachments,
      },
    };
    return notifyAPIMessagePayload;
  }
}
