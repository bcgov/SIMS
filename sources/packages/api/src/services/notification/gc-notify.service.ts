import { Injectable } from "@nestjs/common";
import { GcNotify } from "../../types";
import { ConfigService } from "..";
import axios from "axios";
import { GcNotifyResult, RequestPayload } from "./gc-notify.model";

@Injectable()
export class GcNotifyService {
  constructor(private readonly configService: ConfigService) {}

  get config(): GcNotify {
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
  ): Promise<GcNotifyResult> {
    const response = await axios.post(this.gcNotifyUrl(), payload, {
      headers: {
        Authorization: `ApiKey-v1 ${this.gcNotifyApiKey()}`,
      },
    });
    return response.data as GcNotifyResult;
  }
}
