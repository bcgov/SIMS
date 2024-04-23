import { HttpStatus, Injectable } from "@nestjs/common";
import { AxiosError } from "axios";
import {
  NotificationEmailMessage,
  GCNotifyErrorResponse,
  GCNotifyResult,
} from "./gc-notify.model";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ConfigService, GCNotify } from "@sims/utilities/config";
import { CustomNamedError } from "@sims/utilities";
import { GC_NOTIFY_PERMANENT_FAILURE_ERROR } from "@sims/services/constants";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class GCNotifyService {
  private readonly gcNotifyConfig: GCNotify;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.gcNotifyConfig = this.configService.notify;
  }

  /**
   * Send email notification by passing the requestPayload.
   * @param payload email message payload.
   * @returns GC Notify API call response.
   */
  async sendEmailNotification(
    payload: NotificationEmailMessage,
  ): Promise<GCNotifyResult> {
    try {
      const response = await this.httpService.axiosRef.post(
        this.gcNotifyConfig.url,
        payload,
        {
          headers: {
            Authorization: `ApiKey-v1 ${this.gcNotifyConfig.apiKey}`,
          },
        },
      );
      return response.data as GCNotifyResult;
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
        // When the error is identified to be GC Notify error
        // throw a custom error with all GC Notify error details.
        throw new CustomNamedError(
          axiosError.message,
          GC_NOTIFY_PERMANENT_FAILURE_ERROR,
          axiosError.response.data,
        );
      }
      this.logger.error(
        `Error while sending email notification: ${error}),
          )}`,
      );
      throw error;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
