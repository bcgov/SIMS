import { Injectable } from "@nestjs/common";
import { GCNotify } from "../../types";
import { ConfigService } from "..";
import axios from "axios";
import { GCNotifyResult, RequestPayload } from "./gc-notify.model";

@Injectable()
export class GCNotifyService {
  constructor(private readonly configService: ConfigService) {}

  get config(): GCNotify {
    return this.configService.getConfig().gcNotify;
  }

  gcNotifyUrl() {
    return this.config.url;
  }

  gcNotifyToAddress() {
    return this.config.toAddress;
  }
  gcNotifyApiKey() {
    return this.config.apiKey;
  }

  async sendEmailNotification(
    payload: RequestPayload,
  ): Promise<GCNotifyResult> {
    const response = await axios.post(this.gcNotifyUrl(), payload, {
      headers: {
        Authorization: `ApiKey-v1 ${this.gcNotifyApiKey()}`,
      },
    });
    return response.data as GCNotifyResult;
  }
}
