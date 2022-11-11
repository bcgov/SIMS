import { Injectable } from "@nestjs/common";
import axios, { AxiosError } from "axios";
import { GCNotifyResult } from "./gc-notify.model";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { GCNotify } from "../../types";
import { ConfigService } from "@sims/utilities/config";

@Injectable()
export class GCNotifyService {
  private readonly gcNotifyConfig: GCNotify;
  constructor(private readonly configService: ConfigService) {
    this.gcNotifyConfig = this.configService.notify;
  }

  ministryToAddress() {
    return this.gcNotifyConfig.toAddress;
  }

  /**
   * Send email notification by passing the requestPayload.
   * @param payload
   * @returns GC Notify API call response.
   */
  async sendEmailNotification(payload: unknown): Promise<GCNotifyResult> {
    try {
      const response = await axios.post(this.gcNotifyConfig.url, payload, {
        headers: {
          Authorization: `ApiKey-v1 ${this.gcNotifyConfig.apiKey}`,
        },
      });
      return response.data as GCNotifyResult;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.isAxiosError && axiosError.response?.data) {
        this.logger.error(
          `Error while sending email notification: ${JSON.stringify(
            axiosError.response.data,
          )}`,
        );
      } else {
        this.logger.error(
          `Error while sending email notification: ${error}),
          )}`,
        );
      }
      throw error;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
