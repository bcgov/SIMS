import { Injectable } from "@nestjs/common";
import { ConfigService } from "..";
import axios from "axios";
import { GCNotifyResult, RequestPayload } from "./gc-notify.model";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";

@Injectable()
export class GCNotifyService {
  private readonly gcNotifyConfig;
  constructor(private readonly configService: ConfigService) {
    this.gcNotifyConfig = this.configService.getConfig().gcNotify;
  }

  gcNotifyUrl() {
    return this.gcNotifyConfig.url;
  }

  gcNotifyToAddress() {
    return this.gcNotifyConfig.toAddress;
  }

  gcNotifyApiKey() {
    return this.gcNotifyConfig.apiKey;
  }

  /**
   * Send email notification by passing the requestPayload.
   * @param payload
   * @returns GC Notify API call response.
   */

  async sendEmailNotification(
    payload: RequestPayload,
  ): Promise<GCNotifyResult> {
    let response;
    try {
      response = await axios.post(this.gcNotifyUrl(), payload, {
        headers: {
          Authorization: `ApiKey-v1 ${this.gcNotifyApiKey()}`,
        },
      });
    } catch (error) {
      this.logger.error(`Error while sending email notification: ${error}`);
      throw error;
    }
    return response.data as GCNotifyResult;
  }
  @InjectLogger()
  logger: LoggerService;
}
