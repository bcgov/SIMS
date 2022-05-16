import { Injectable } from "@nestjs/common";
import { ConfigService } from "..";
import axios from "axios";
import { AxiosError } from "axios";
import { GCNotifyResult, RequestPayload } from "./gc-notify.model";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { GCNotify } from "../../types";

@Injectable()
export class GCNotifyService {
  private readonly gcNotifyConfig: GCNotify;
  constructor(private readonly configService: ConfigService) {
    this.gcNotifyConfig = this.configService.getConfig().gcNotify;
  }

  ministryToAddress() {
    return this.gcNotifyConfig.toAddress;
  }

  /**
   * Send email notification by passing the requestPayload.
   * @param payload
   * @returns GC Notify API call response.
   */
  async sendEmailNotification<T>(
    payload: RequestPayload<T>,
  ): Promise<GCNotifyResult> {
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
          `Error while sending email notification:  ${JSON.stringify(
            axiosError.response.data,
          )}`,
        );
      } else {
        this.logger.error(
          `Error while sending email notification:  ${error}),
          )}`,
        );
      }
      throw error;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
