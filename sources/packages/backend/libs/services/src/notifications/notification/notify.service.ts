import { HttpStatus, Injectable } from "@nestjs/common";
import { AxiosError } from "axios";
import { GCNotifyErrorResponse } from "./gc-notify.model";
import { LoggerService } from "@sims/utilities/logger";
import { ConfigService, Notify } from "@sims/utilities/config";
import { CustomNamedError } from "@sims/utilities";
import { NOTIFY_PERMANENT_FAILURE_ERROR } from "@sims/services/constants";
import { HttpService } from "@nestjs/axios";
import {
  NotifyAPIMessagePayload,
  NotifyMessageContent,
} from "@sims/services/notifications/notification/notify.model";
import { Notification } from "@sims/sims-db";

@Injectable()
export class NotifyService {
  private readonly notifyConfig: Notify;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {
    this.notifyConfig = this.configService.notify;
  }

  /**
   * Send email notification.
   * @param payload email message payload.
   * @returns Notify API call response.
   */
  async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      const payload = this.createNotifyAPIMessagePayload(notification);
      await this.httpService.axiosRef.post(this.notifyConfig.url, payload, {
        headers: { "x-api-key": this.notifyConfig.apiKey },
      });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<GCNotifyErrorResponse>;
      if (
        axiosError.isAxiosError &&
        axiosError.response?.data?.status_code === HttpStatus.BAD_REQUEST
      ) {
        this.logger.error(
          `Error while sending email notification: ${JSON.stringify(
            axiosError.response.data,
          )}`,
        );
        // BAD_REQUEST errors are considered permanent failures, which means that the notification will not be retried.
        throw new CustomNamedError(
          axiosError.message,
          NOTIFY_PERMANENT_FAILURE_ERROR,
          axiosError.response.data,
        );
      }
      this.logger.error("Error while sending email notification.", error);
      throw error;
    }
  }

  /**
   * Create the Notify API message payload from the given notification.
   * @param notification notification containing the message payload and recipients.
   * @returns Notify API message payload.
   */
  private createNotifyAPIMessagePayload(
    notification: Notification,
  ): NotifyAPIMessagePayload {
    const notifyMessageContent =
      notification.messagePayload as NotifyMessageContent;
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
